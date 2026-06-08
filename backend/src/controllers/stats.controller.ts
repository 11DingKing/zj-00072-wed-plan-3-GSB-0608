import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Checklist, ChecklistPhase } from "../entities/Checklist";
import { VendorBooking } from "../entities/VendorBooking";
import { Budget } from "../entities/Budget";
import { AuthRequest } from "../middlewares/auth";

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const weddingId = req.user.wedding.id;

    const checklistRepository = AppDataSource.getRepository(Checklist);
    const vendorRepository = AppDataSource.getRepository(VendorBooking);
    const budgetRepository = AppDataSource.getRepository(Budget);

    const allTasks = await checklistRepository.find({
      where: { wedding: { id: weddingId } },
    });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "已完成").length;
    const overdueTasks = allTasks.filter((t) => {
      if (!t.dueDate || t.status === "已完成") return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const phaseCompletion: Record<ChecklistPhase, { total: number; completed: number }> = {
      "婚前12个月": { total: 0, completed: 0 },
      "婚前6个月": { total: 0, completed: 0 },
      "婚前3个月": { total: 0, completed: 0 },
      "婚前1个月": { total: 0, completed: 0 },
      "婚前1周": { total: 0, completed: 0 },
      "婚礼当天": { total: 0, completed: 0 },
    };

    allTasks.forEach((task) => {
      phaseCompletion[task.phase].total++;
      if (task.status === "已完成") {
        phaseCompletion[task.phase].completed++;
      }
    });

    const vendors = await vendorRepository.find({
      where: { wedding: { id: weddingId } },
    });

    const totalContractAmount = vendors.reduce((sum, v) => sum + parseFloat(v.contractAmount.toString()), 0);
    const totalPaidAmount = vendors.reduce((sum, v) => sum + parseFloat(v.paidAmount.toString()), 0);
    const paymentProgress = totalContractAmount > 0 ? (totalPaidAmount / totalContractAmount) * 100 : 0;

    const budgets = await budgetRepository.find({
      where: { wedding: { id: weddingId } },
    });

    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.budgetLimit.toString()), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.actualSpent.toString()), 0);
    const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const today = new Date();
    const weddingDate = new Date(req.user.wedding.weddingDate);
    const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      overview: {
        daysUntilWedding,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
      phaseCompletion,
      budget: {
        totalBudget,
        totalSpent,
        budgetProgress,
        remaining: totalBudget - totalSpent,
      },
      payment: {
        totalContractAmount,
        totalPaidAmount,
        paymentProgress,
        remaining: totalContractAmount - totalPaidAmount,
      },
      vendors: {
        total: vendors.length,
        confirmed: vendors.filter((v) => v.isConfirmed).length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "获取统计数据失败" });
  }
};
