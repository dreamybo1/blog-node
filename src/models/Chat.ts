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
  messages: ({ _id: Schema.Types.ObjectId } & IMessage)[];
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
      },
    ],
    isChatMode: {
      type: Boolean,
      required: true,
      default: false,
    },
    messages: [{
      _id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Message",
      },
      text: {
        type: String,
        required: true,
        ref: "Message",
      },
      status: {
        type: String,
        enum: ["sent", "read"],
        required: true,
        ref: "Message",
      },
      sender: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Message",
      },
    }],
    name: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IChat>("Chat", ChatSchema);
