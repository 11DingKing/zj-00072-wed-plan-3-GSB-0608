import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Comment } from "../entities/Comment";
import { Checklist } from "../entities/Checklist";
import { AuthRequest } from "../middlewares/auth";

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { checklistId } = req.params;
    const commentRepository = AppDataSource.getRepository(Comment);
    const comments = await commentRepository.find({
      where: { checklist: { id: parseInt(checklistId) } },
      relations: ["author"],
      order: { createdAt: "DESC" },
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "获取评论失败" });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { checklistId } = req.params;
    const { content, mentions, attachmentUrl } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "未认证" });
    }

    const checklistRepository = AppDataSource.getRepository(Checklist);
    const checklist = await checklistRepository.findOne({
      where: { id: parseInt(checklistId) },
    });

    if (!checklist) {
      return res.status(404).json({ message: "清单项不存在" });
    }

    const commentRepository = AppDataSource.getRepository(Comment);
    const comment = commentRepository.create({
      content,
      mentions,
      attachmentUrl,
      author: { id: req.user.id },
      checklist: { id: parseInt(checklistId) },
    });

    const savedComment = await commentRepository.save(comment);
    const result = await commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ["author"],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("创建评论失败:", error);
    res.status(500).json({ message: "创建评论失败" });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const commentRepository = AppDataSource.getRepository(Comment);

    const comment = await commentRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["author"],
    });

    if (!comment) {
      return res.status(404).json({ message: "评论不存在" });
    }

    if (comment.author.id !== req.user?.id && req.user?.role !== "Admin") {
      return res.status(403).json({ message: "无权限删除此评论" });
    }

    await commentRepository.delete(id);
    res.json({ message: "删除成功" });
  } catch (error) {
    res.status(500).json({ message: "删除评论失败" });
  }
};
