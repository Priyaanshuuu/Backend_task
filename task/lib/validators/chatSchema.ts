import { z } from "zod";

export const SendMessageSchema = z.object({
  sessionId: z
    .string()
    .uuid("sessionId must be a valid UUID"),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(8_000, "Message cannot exceed 8000 characters")
    .trim(),
  contextWindow: z.number().int().min(1).max(20).optional().default(10),
});

export const GetHistorySchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  before: z.string().datetime().optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type GetHistoryInput = z.infer<typeof GetHistorySchema>;