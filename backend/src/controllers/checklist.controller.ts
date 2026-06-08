import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Checklist, ChecklistStatus } from "../entities/Checklist";
import { AuthRequest } from "../middlewares/auth";
import { In } from "typeorm";

export const getChecklists = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const checklistRepository = AppDataSource.getRepository(Checklist);
    const checklists = await checklistRepository.find({
      where: { wedding: { id: req.user.wedding.id } },
      relations: ["assignee", "vendor"],
      order: { dueDate: "ASC" },
    });

    res.json(checklists);
  } catch (error) {
    res.status(500).json({ message: "获取清单失败" });
  }
};

export const createChecklist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    console.log("Received checklist data:", req.body);

    const checklistRepository = AppDataSource.getRepository(Checklist);
    const checklistData = {
      title: req.body.title,
      description: req.body.description || "",
      phase: req.body.phase || "婚前12个月",
      priority: req.body.priority || "中",
      status: req.body.status || "待开始",
      wedding: { id: req.user.wedding.id },
    };

    console.log("Processed checklist data:", checklistData);

    const checklist = checklistRepository.create(checklistData);
    const savedChecklist = await checklistRepository.save(checklist);
    const result = await checklistRepository.findOne({
      where: { id: savedChecklist.id },
      relations: ["assignee", "vendor", "wedding"],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("创建清单项失败:", error);
    res.status(500).json({ message: "创建清单项失败" });
  }
};

export const updateChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const checklistRepository = AppDataSource.getRepository(Checklist);

    await checklistRepository.update(id, req.body);
    const updatedChecklist = await checklistRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["assignee", "vendor", "wedding"],
    });

    res.json(updatedChecklist);
  } catch (error) {
    console.error("更新清单项失败:", error);
    res.status(500).json({ message: "更新清单项失败" });
  }
};

export const deleteChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const checklistRepository = AppDataSource.getRepository(Checklist);

    await checklistRepository.delete(id);
    res.json({ message: "删除成功" });
  } catch (error) {
    res.status(500).json({ message: "删除清单项失败" });
  }
};

export const getMyTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "未认证" });
    }

    const checklistRepository = AppDataSource.getRepository(Checklist);
    const tasks = await checklistRepository.find({
      where: { assignee: { id: req.user.id } },
      relations: ["wedding", "vendor"],
      order: { dueDate: "ASC" },
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "获取我的任务失败" });
  }
};
