import { NextRequest, NextResponse } from "next/server";
import { getUserSessions } from "@/lib/services/chatService";
import { withAuth } from "@/lib/middlewares/withAuth";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { AuthenticatedContext } from "@/types";

export const runtime = "nodejs";

async function sessionsHandler(_req: NextRequest, ctx: AuthenticatedContext): Promise<NextResponse> {
  try {
    const sessions = await getUserSessions(ctx.userId);
    return successResponse({ sessions, count: sessions.length });
  } catch (error) {
    console.error("[GET /api/chat/sessions]", error);
    return errorResponse("Failed to fetch sessions", 500);
  }
}

export const GET = withAuth(sessionsHandler);