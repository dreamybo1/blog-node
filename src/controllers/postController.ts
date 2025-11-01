import { Response } from "express";
import Post from "../models/Post";
import { AuthRequest } from "../middleware/authMiddleware";

interface CreatePostBody {
  title: string;
  content: string;
}

interface LikePostBody {
  id: any;
}

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body as CreatePostBody;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {name, email, role} = req.user

    const post = await Post.create({
      author: {name, email, role},
      title,
      content,
    });

    res.status(201).json(post);
  } catch (e) {
    console.error("Error creating post:", e);
    res.status(400).json({ message: "Failed to create post" });
  }
};

export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (
      post?.likes.some((likeUser) => likeUser._id.toString() === req.user._id.toString())
    ) {
      post.likes = post?.likes.filter(
        (likeUser) => likeUser._id.toString() !== req.user._id.toString()
      );
      await post?.save();

      res.status(200).json(`You removed like from post ${post?.title}`);
    } else {
      post?.likes.push(req.user);
      await post?.save();
      res.status(200).json(`You liked post ${post?.title}`);
    }
  } catch (e) {
    console.error("Error liking post:", e);
    res.status(400).json({ message: "Failed to like post" });
  }
};
