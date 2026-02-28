import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { MessageRole } from "@/types";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export interface ConversationMessage {
  role: MessageRole;
  content: string;
}
function toGeminiRole(role: MessageRole): "user" | "model" {
  if (role === "assistant") return "model";
  return "user";
}

export async function generateResponse(
  messages: ConversationMessage[]
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const systemMessage = messages.find((m) => m.role === "system")?.content;
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const model = genAI.getGenerativeModel({
    model: MODEL,
    safetySettings,
    ...(systemMessage && { systemInstruction: systemMessage }),
  });
  const history = conversationMessages.slice(0, -1).map((m) => ({
    role: toGeminiRole(m.role),
    parts: [{ text: m.content }],
  }));

  const lastMessage = conversationMessages.at(-1);
  if (!lastMessage) {
    throw new Error("No user message provided");
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return {
    content: text,
    promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

export function streamResponse(messages: ConversationMessage[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const systemMessage = messages.find((m) => m.role === "system")?.content;
        const conversationMessages = messages.filter((m) => m.role !== "system");

        const model = genAI.getGenerativeModel({
          model: MODEL,
          safetySettings,
          ...(systemMessage && { systemInstruction: systemMessage }),
        });

        const history = conversationMessages.slice(0, -1).map((m) => ({
          role: toGeminiRole(m.role),
          parts: [{ text: m.content }],
        }));

        const lastMessage = conversationMessages.at(-1);
        if (!lastMessage) throw new Error("No user message provided");

        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage.content);

        for await (const chunk of result.stream) {
          const delta = chunk.text();
          if (delta) {
            controller.enqueue(encoder.encode(`data: ${delta}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}