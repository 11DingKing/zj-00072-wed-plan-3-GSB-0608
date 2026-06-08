import express from "express";
import { authenticate } from "../middlewares/auth";
import { getComments, createComment, deleteComment } from "../controllers/comment.controller";

const router = express.Router();

router.get("/:checklistId", authenticate, getComments);
router.post("/:checklistId", authenticate, createComment);
router.delete("/:id", authenticate, deleteComment);

export default router;
