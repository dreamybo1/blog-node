import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  posts: mongoose.Types.ObjectId[];
  role?: string;
  password?: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
