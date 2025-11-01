import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { getPosts } from "../controllers/postsController";

const router = Router();

router.get("/", protect, getPosts);

export default router;
