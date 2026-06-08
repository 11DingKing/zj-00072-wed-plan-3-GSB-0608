import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Budget } from "../entities/Budget";
import { AuthRequest } from "../middlewares/auth";

export const getBudgets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const budgetRepository = AppDataSource.getRepository(Budget);
    const budgets = await budgetRepository.find({
      where: { wedding: { id: req.user.wedding.id } },
      relations: ["vendors"],
    });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: "获取预算列表失败" });
  }
};

export const createBudget = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    console.log("Received budget data:", req.body);

    const budgetRepository = AppDataSource.getRepository(Budget);
    const budgetData = {
      category: req.body.category || "其他",
      budgetLimit: req.body.budgetLimit || 0,
      actualSpent: req.body.actualSpent || 0,
      notes: req.body.notes || "",
      wedding: { id: req.user.wedding.id },
    };

    console.log("Processed budget data:", budgetData);

    const budget = budgetRepository.create(budgetData);
    const savedBudget = await budgetRepository.save(budget);
    const result = await budgetRepository.findOne({
      where: { id: savedBudget.id },
      relations: ["vendors", "wedding"],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("创建预算失败:", error);
    res.status(500).json({ message: "创建预算失败" });
  }
};

export const updateBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const budgetRepository = AppDataSource.getRepository(Budget);

    await budgetRepository.update(id, req.body);
    const updatedBudget = await budgetRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["vendors", "wedding"],
    });

    res.json(updatedBudget);
  } catch (error) {
    console.error("更新预算失败:", error);
    res.status(500).json({ message: "更新预算失败" });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const budgetRepository = AppDataSource.getRepository(Budget);

    await budgetRepository.delete(id);
    res.json({ message: "删除成功" });
  } catch (error) {
    res.status(500).json({ message: "删除预算失败" });
  }
};
