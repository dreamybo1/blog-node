import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: String; // Ссылка на пользователя
  likes: mongoose.Types.ObjectId[]; // массив ObjectId пользователей
}

const PostSchema: Schema<IPost> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: {
      name: { type: String, required: true, ref: "User" },
      email: { type: String, required: true, ref: "User" },
      role: { type: String, required: true, ref: "User" },
    },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }], // массив ObjectId пользователей
  },
  { timestamps: true }
);

export default mongoose.model<IPost>("Post", PostSchema);
