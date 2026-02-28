import OpenAI from "openai";
import { MessageRole } from "@/types";

if(!process.env.OPENAI_API_KEY){
    throw new Error("Something wrong with the API key!!")
}

const openai = new OpenAI({
    apiKey : process.env.OPENAI_API_KEY
})

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o"

export interface ConversationMessage{
    role : MessageRole
    content : string
}

export async function generateResponse(
  messages: ConversationMessage[]
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: 2048,
    temperature: 0.7,
  });

  const choice = response.choices[0];
  if (!choice?.message?.content) {
    throw new Error("LLM returned an empty response");
  }

  return {
    content: choice.message.content,
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
  };
}

export function streamResponse(messages: ConversationMessage[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = await openai.chat.completions.create({
          model: MODEL,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: 2048,
          temperature: 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
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