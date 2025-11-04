import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getChats,
  editChatName,
  createChat,
  deleteChat,
  addMemberToChat,
  deleteMemberFromChat,
  changeMemberRole,
  getChatMessages,
  createMessage,
  changeMessage,
  deleteMessage,
  readMessage
} from "../controllers/chatController";

const router = Router();

router.get("/", protect, getChats);
router.post("/", protect, createChat);
router.patch("/:id", protect, editChatName);
router.delete("/:id", protect, deleteChat);

router.patch("/:id/members/:memberId", protect, addMemberToChat);
router.delete("/:id/members/:memberId", protect, deleteMemberFromChat);
router.patch("/:id/members/:memberId/role", protect, changeMemberRole);

router.get("/:id/messages", protect, getChatMessages);
router.post("/:id/messages", protect, createMessage);
router.patch("/:id/messages/:messageId/change", protect, changeMessage);
router.patch("/:id/messages/:messageId/read", protect, readMessage);
router.delete("/:id/messages/:messageId", protect, deleteMessage);


export default router;
