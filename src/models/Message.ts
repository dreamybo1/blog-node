import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  text: string;
  status: "sent" | "read";
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    text: { type: String, required: true },
    status: {
      type: String,
      enum: ["sent", "read"],
      required: true,
      default: "sent",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("Message", MessageSchema);
