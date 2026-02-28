

import { Schema, model, models, Model } from "mongoose";
import { IUser } from "@/types";

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, 
    },
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
export const UserModel: Model<IUser> =
  models.User ?? model<IUser>("User", UserSchema);