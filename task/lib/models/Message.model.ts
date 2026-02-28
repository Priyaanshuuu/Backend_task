
import { Schema, model, models, Model } from "mongoose";
import { IMessage, MessageRole } from "@/types";

const MessageSchema = new Schema<IMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, "sessionId is required"],
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"] satisfies MessageRole[],
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      maxlength: [32_000, "Message content too long"],
    },
    promptTokens: { type: Number },
    completionTokens: { type: Number },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
    const { _id, __v, ...rest } = ret;
    return {
        id: _id.toString(),
        ...rest
    };
}
    },
  }
);

MessageSchema.index({ userId: 1, sessionId: 1, createdAt: 1 });

export const MessageModel: Model<IMessage> =
  models.Message ?? model<IMessage>("Message", MessageSchema);