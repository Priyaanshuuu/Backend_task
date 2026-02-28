import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { MessageModel } from "../models/Message.model";
import { generateResponse, streamResponse, ConversationMessage } from "@/lib/services/llmService";
import { llmCache, buildCacheKey } from "@/lib/utils/cache";
import { ChatHistoryEntry, IMessage } from "@/types";

const SYSTEM_PROMPT = `You are a helpful, concise, and knowledgeable AI assistant.
Answer the user's questions accurately. If you don't know something, say so honestly.`;

export async function handleChatMessage(
  userId: string,
  sessionId: string,
  userMessage: string,
  contextWindow: number = 10
): Promise<{ assistantMessage: string; fromCache: boolean }> {
  await connectDB();

  const cacheKey = buildCacheKey(userId, userMessage);
  const cached = llmCache.get(cacheKey);
  if (cached) {
    await persistMessagePair(userId, sessionId, userMessage, cached);
    return { assistantMessage: cached, fromCache: true };
  }

  const history = await getRecentMessages(userId, sessionId, contextWindow);
  const messages: ConversationMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const { content, promptTokens, completionTokens } = await generateResponse(messages);

  llmCache.set(cacheKey, content);

  await persistMessagePair(userId, sessionId, userMessage, content, promptTokens, completionTokens);

  return { assistantMessage: content, fromCache: false };
}

export async function handleStreamingChatMessage(
  userId: string,
  sessionId: string,
  userMessage: string,
  contextWindow: number = 10
): Promise<ReadableStream<Uint8Array>> {
  await connectDB();

  const history = await getRecentMessages(userId, sessionId, contextWindow);
  const messages: ConversationMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  let fullResponse = "";
  const encoder = new TextEncoder();

  const sourceStream = streamResponse(messages);

  const transformedStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = sourceStream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const match = chunk.match(/^data: (.+)\n\n$/);
          if (match && match[1] !== "[DONE]") {
            fullResponse += match[1];
          }

          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();

        persistMessagePair(userId, sessionId, userMessage, fullResponse).catch((err) =>
          console.error("[chatService] Failed to persist streamed messages:", err)
        );
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return transformedStream;
}

export async function getChatHistory(
  userId: string,
  sessionId: string,
  limit: number = 50,
  before?: string
): Promise<ChatHistoryEntry[]> {
  await connectDB();

  const query: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    sessionId,
  };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await MessageModel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<IMessage[]>();

  return messages.reverse().map((m) => ({
    id: m._id.toString(),
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }));
}

export async function getUserSessions(userId: string): Promise<string[]> {
  await connectDB();

  const sessions = await MessageModel.aggregate<{ _id: string; lastMessage: Date }>([
    { $match: { userId: new Types.ObjectId(userId) } },
    { $group: { _id: "$sessionId", lastMessage: { $max: "$createdAt" } } },
    { $sort: { lastMessage: -1 } },
  ]);

  return sessions.map((s) => s._id);
}

async function getRecentMessages(
  userId: string,
  sessionId: string,
  limit: number
): Promise<Pick<IMessage, "role" | "content">[]> {
  const messages = await MessageModel.find({
    userId: new Types.ObjectId(userId),
    sessionId,
    role: { $ne: "system" }, 
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("role content")
    .lean<Pick<IMessage, "role" | "content">[]>();

  return messages.reverse();
}

async function persistMessagePair(
  userId: string,
  sessionId: string,
  userContent: string,
  assistantContent: string,
  promptTokens?: number,
  completionTokens?: number
): Promise<void> {
  await MessageModel.insertMany([
    {
      userId: new Types.ObjectId(userId),
      sessionId,
      role: "user",
      content: userContent,
    },
    {
      userId: new Types.ObjectId(userId),
      sessionId,
      role: "assistant",
      content: assistantContent,
      promptTokens,
      completionTokens,
    },
  ]);
}