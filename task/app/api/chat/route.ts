import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { SendMessageSchema } from "@/lib/validators/chatSchema";
import { handleStreamingChatMessage } from "@/lib/services/chatService";
import { withAuth } from "@/lib/middlewares/withAuth";
import { checkRateLimit } from "@/lib/middlewares/rateLimit";
import { badRequest, tooManyRequests, errorResponse } from "@/lib/utils/apiResponse";
import { AuthenticatedContext } from "@/types";

export const runtime = "nodejs";

async function chatHandler(req: NextRequest, ctx: AuthenticatedContext): Promise<NextResponse> {

  const rateLimit = checkRateLimit(ctx.userId);
  if (!rateLimit.allowed) {
    const response = tooManyRequests("Chat rate limit exceeded. Please wait before sending more messages.");
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("X-RateLimit-Reset", String(rateLimit.restAt));
    return response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  let input;
  try {
    input = SendMessageSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest(error.message ?? "Validation failed");
    }
    throw error;
  }

  try {
    const stream = await handleStreamingChatMessage(
      ctx.userId,
      input.sessionId,
      input.message,
      input.contextWindow
    );

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (error) {
    console.error("[POST /api/chat]", error);
    return errorResponse("Failed to generate response", 502, "LLM_ERROR");
  }
}

export const POST = withAuth(chatHandler);