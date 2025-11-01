import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Post from "../models/Post";

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (e) {
    res.status(400).json(e);
  }
};
