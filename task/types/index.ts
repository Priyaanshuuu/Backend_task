import {Types} from "mongoose"

export interface JwtAccessPayload{
    sub : string;
    email : string;
    iat? : number;
    exp? : number;
}

export interface JwtRefreshPayload{
    sub : string;
    iat? : number;
    exp? : number;
}

export interface AuthTokens{
    accessToken : string
    refreshToken: string
} 

export interface IUser{
    _id : Types.ObjectId;
    email : string;
    passwordHash : string;
    createdAt: Date;
    updateAt: Date;
}

export interface PublicUser{
    id : string;
    email : string;
    createdAt: Date
}

export type MessageRole = "user" | "assistant" | "system";

export interface IMessage {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: string;
  role: MessageRole;
  content: string;
  promptTokens?: number;
  completionTokens?: number;
  createdAt: Date;
}

export interface ChatHistoryEntry {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AuthenticatedContext {
  userId: string;
  email: string;
}