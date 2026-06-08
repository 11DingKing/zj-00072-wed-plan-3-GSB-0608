import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Wedding } from "../entities/Wedding";
import { AuthRequest } from "../middlewares/auth";
import { createChangeLog } from "./changelog.controller";

export const getWedding = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const weddingRepository = AppDataSource.getRepository(Wedding);
    const wedding = await weddingRepository.findOne({
      where: { id: req.user.wedding.id },
      relations: ["users", "checklists", "vendors", "budgets"],
    });

    res.json(wedding);
  } catch (error) {
    console.error("获取婚礼信息失败:", error);
    res.status(500).json({ message: "获取婚礼信息失败" });
  }
};

export const updateWedding = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const weddingRepository = AppDataSource.getRepository(Wedding);
    const oldWedding = await weddingRepository.findOne({
      where: { id: req.user.wedding.id },
    });

    if (!oldWedding) {
      return res.status(404).json({ message: "婚礼不存在" });
    }

    const updateData = { ...req.body };
    
    if (updateData.weddingDate instanceof Date) {
      updateData.weddingDate = updateData.weddingDate.toISOString().split("T")[0];
    }
    
    await weddingRepository.update(req.user.wedding.id, updateData);
    const updatedWedding = await weddingRepository.findOne({
      where: { id: req.user.wedding.id },
      relations: ["users", "checklists", "vendors", "budgets"],
    });

    const fields = ["groomName", "brideName", "weddingDate", "location", "totalBudget", "theme", "description"];
    for (const field of fields) {
      const oldValue = oldWedding[field as keyof Wedding]?.toString();
      const newValue = updateData[field]?.toString();
      if (newValue !== undefined && oldValue !== newValue) {
        await createChangeLog(
          "wedding",
          req.user.wedding.id,
          field,
          oldValue,
          newValue,
          req.user.id,
          req.user.wedding.id
        );
      }
    }

    res.json(updatedWedding);
  } catch (error) {
    console.error("更新婚礼信息失败:", error);
    res.status(500).json({ message: "更新婚礼信息失败" });
  }
};

export const getAllWeddings = async (req: AuthRequest, res: Response) => {
  try {
    const weddingRepository = AppDataSource.getRepository(Wedding);
    const weddings = await weddingRepository.find({
      relations: ["users"],
    });

    res.json(weddings);
  } catch (error) {
    res.status(500).json({ message: "获取婚礼列表失败" });
  }
};
