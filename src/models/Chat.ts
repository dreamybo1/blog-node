import mongoose, { Schema, Document } from "mongoose";
import { IMessage } from "./Message";

export interface IChatMember {
  user: mongoose.Types.ObjectId;
  role: "admin" | "member"; // or a string enum
}

export interface IChat extends Document {
  members: IChatMember[];
  createdAt: Date;
  updatedAt: Date;
  messages: Schema.Types.ObjectId[];
  name: string;
  isChatMode: boolean;
}

const ChatSchema: Schema<IChat> = new Schema(
  {
    members: [
      {
        user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        role: {
          type: String,
          enum: ["admin", "member"],
          required: true,
          default: "member",
        },
        isChatMode: {
          type: Boolean,
          require: true,
          default: false,
        },
      },
    ],
    messages: [{ type: Schema.Types.ObjectId, required: true, ref: "Message" }],
    name: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IChat>("Chat", ChatSchema);
