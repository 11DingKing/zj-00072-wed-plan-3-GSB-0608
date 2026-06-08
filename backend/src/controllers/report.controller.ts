import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Wedding } from "../entities/Wedding";
import { Checklist } from "../entities/Checklist";
import { Budget } from "../entities/Budget";
import { VendorBooking } from "../entities/VendorBooking";
import { AuthRequest } from "../middlewares/auth";

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const { startDate, endDate } = req.query;

    const weddingRepository = AppDataSource.getRepository(Wedding);
    const checklistRepository = AppDataSource.getRepository(Checklist);
    const budgetRepository = AppDataSource.getRepository(Budget);
    const vendorRepository = AppDataSource.getRepository(VendorBooking);

    const wedding = await weddingRepository.findOne({
      where: { id: req.user.wedding.id },
    });

    if (!wedding) {
      return res.status(404).json({ message: "婚礼不存在" });
    }

    let checklistWhere: any = { wedding: { id: req.user.wedding.id } };
    if (startDate && endDate) {
      checklistWhere.dueDate = {
        between: [startDate, endDate],
      };
    }

    const checklists = await checklistRepository.find({
      where: checklistWhere,
      relations: ["assignee", "vendor"],
      order: { dueDate: "ASC" },
    });

    const budgets = await budgetRepository.find({
      where: { wedding: { id: req.user.wedding.id } },
      relations: ["vendors"],
    });

    const vendors = await vendorRepository.find({
      where: { wedding: { id: req.user.wedding.id } },
    });

    const totalTasks = checklists.length;
    const completedTasks = checklists.filter((c) => c.status === "已完成").length;
    const overdueTasks = checklists.filter(
      (c) => c.status !== "已完成" && c.dueDate && new Date(c.dueDate) < new Date()
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetLimit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.actualSpent, 0);
    const remainingBudget = totalBudget - totalSpent;

    const totalContractAmount = vendors.reduce((sum, v) => sum + v.contractAmount, 0);
    const totalPaidAmount = vendors.reduce((sum, v) => sum + v.paidAmount, 0);
    const remainingPayment = totalContractAmount - totalPaidAmount;

    const pendingTasks = checklists.filter((c) => c.status === "待开始" || c.status === "进行中");

    const report = {
      weddingSummary: {
        groomName: wedding.groomName,
        brideName: wedding.brideName,
        weddingDate: wedding.weddingDate,
        location: wedding.location,
        theme: wedding.theme,
      },
      progress: {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
      },
      budget: {
        totalBudget,
        totalSpent,
        remainingBudget,
        budgetProgress: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        categories: budgets.map((b) => ({
          category: b.category,
          budgetLimit: b.budgetLimit,
          actualSpent: b.actualSpent,
          remaining: b.budgetLimit - b.actualSpent,
        })),
      },
      payment: {
        totalContractAmount,
        totalPaidAmount,
        remainingPayment,
        paymentProgress:
          totalContractAmount > 0 ? Math.round((totalPaidAmount / totalContractAmount) * 100) : 0,
      },
      vendors: vendors.map((v) => ({
        name: v.name,
        type: v.type,
        contractAmount: v.contractAmount,
        paidAmount: v.paidAmount,
        paymentStatus: v.paymentStatus,
        isConfirmed: v.isConfirmed,
      })),
      pendingTasks: pendingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee?.name,
        phase: t.phase,
      })),
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      generatedAt: new Date().toISOString(),
    };

    res.json(report);
  } catch (error) {
    console.error("生成报告失败:", error);
    res.status(500).json({ message: "生成报告失败" });
  }
};
