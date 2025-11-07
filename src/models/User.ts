import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  posts: mongoose.Types.ObjectId[];
  role?: string;
  password?: string;
  chats: mongoose.Types.ObjectId[];
  isVerified: boolean;
  isEmailSent: boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    role: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      default: "user",
    },
    chats: [{ type: Schema.Types.ObjectId, required: true, ref: "Chat" }],
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
