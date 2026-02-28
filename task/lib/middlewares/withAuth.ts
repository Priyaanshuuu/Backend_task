import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, verifyAccessToken } from "@/lib/utils/jwt";
import { unauthorized } from "@/lib/utils/apiResponse";
import { AuthenticatedContext } from "@/types";

export type AuthedRouteHandler = (
  req: NextRequest,
  context: AuthenticatedContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

export function withAuth(handler: AuthedRouteHandler) {
  return async (
    req: NextRequest,
    params?: Record<string, string>
  ): Promise<NextResponse> => {
    const authHeader = req.headers.get("Authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
      return unauthorized("Missing or malformed Authorization header");
    }

    try {
      const payload = verifyAccessToken(token);
      const context: AuthenticatedContext = {
        userId: payload.sub,
        email: payload.email,
      };
      return handler(req, context, params);
    } catch {
      return unauthorized("Access token is invalid or expired");
    }
  };
}