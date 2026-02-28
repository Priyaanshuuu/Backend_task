import {NextResponse} from "next/server"
import {ApiSuccess , ApiError} from "@/types"

export function successResponse<T>(data: T , status: number = 200) : NextResponse<ApiSuccess<T>>{
    return NextResponse.json(
        {
            success : true,
            data
        },
        {
            status
        }
    )
}

export function errorResponse(
    message: string,
    status: number = 500,
    code?: string
): NextResponse<ApiError> {
    return NextResponse.json(
        {
            success: false,
            error: message,
            ...(code && { code })
        },
        { status }
    );
}

export const unauthorized = (msg = "Unauthorized") => errorResponse(msg, 401, "UNAUTHORIZED");
export const forbidden = (msg = "Forbidden") => errorResponse(msg, 403, "FORBIDDEN");
export const notFound = (msg = "Not found") => errorResponse(msg, 404, "NOT_FOUND");
export const badRequest = (msg: string) => errorResponse(msg, 400, "BAD_REQUEST");
export const tooManyRequests = (msg = "Too many requests") =>
  errorResponse(msg, 429, "RATE_LIMITED");
export const internalError = (msg = "Internal server error") =>
  errorResponse(msg, 500, "INTERNAL_ERROR");