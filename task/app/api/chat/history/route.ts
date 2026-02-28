import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { GetHistorySchema } from "@/lib/validators/chatSchema";
import { getChatHistory } from "@/lib/services/chatService";
import { withAuth } from "@/lib/middlewares/withAuth";
import { successResponse, badRequest, errorResponse } from "@/lib/utils/apiResponse";
import { AuthenticatedContext } from "@/types";

export const runtime = "nodejs";

async function historyHandler(req: NextRequest, ctx: AuthenticatedContext): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  const rawParams = {
    sessionId: searchParams.get("sessionId"),
    limit: searchParams.get("limit") ?? undefined,
    before: searchParams.get("before") ?? undefined,
  };

  let input;
  try {
    input = GetHistorySchema.parse(rawParams);
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest(error.message ?? "Invalid query parameters");
    }
    throw error;
  }

  try {
    const messages = await getChatHistory(
      ctx.userId,
      input.sessionId,
      input.limit,
      input.before
    );

    return successResponse({
      sessionId: input.sessionId,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("[GET /api/chat/history]", error);
    return errorResponse("Failed to fetch chat history", 500);
  }
}

export const GET = withAuth(historyHandler);