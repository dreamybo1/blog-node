import { Router } from "express";
import { createPost, likePost } from "../controllers/postController";
import { protect } from "../middleware/authMiddleware";

const router = Router()

router.post('/create', protect, createPost)
router.put('/likePost/:id', protect, likePost)


export default router