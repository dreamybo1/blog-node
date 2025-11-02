import { Router } from "express";
import { createPost, likePost, deletePost } from "../controllers/postController";
import { protect } from "../middleware/authMiddleware";

const router = Router()

router.post('/create', protect, createPost)
router.put('/:id/like', protect, likePost)
router.delete('/:id/delete', protect, deletePost)



export default router