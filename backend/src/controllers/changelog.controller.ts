import { Response } from "express";
import { AppDataSource } from "../config/database";
import { ChangeLog, ChangeEntityType } from "../entities/ChangeLog";
import { AuthRequest } from "../middlewares/auth";

export const getChangeLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const changeLogRepository = AppDataSource.getRepository(ChangeLog);

    const whereCondition: any = {};
    if (entityType) {
      whereCondition.entityType = entityType as ChangeEntityType;
    }
    if (entityId) {
      whereCondition.entityId = parseInt(entityId);
    }
    if (req.user?.wedding) {
      whereCondition.wedding = { id: req.user.wedding.id };
    }

    const changeLogs = await changeLogRepository.find({
      where: whereCondition,
      relations: ["modifiedBy"],
      order: { modifiedAt: "DESC" },
    });

    res.json(changeLogs);
  } catch (error) {
    res.status(500).json({ message: "获取变更历史失败" });
  }
};

export const createChangeLog = async (
  entityType: ChangeEntityType,
  entityId: number,
  fieldName: string,
  oldValue: string | undefined,
  newValue: string | undefined,
  userId: number,
  weddingId: number
) => {
  try {
    const changeLogRepository = AppDataSource.getRepository(ChangeLog);
    const changeLog = changeLogRepository.create({
      entityType,
      entityId,
      fieldName,
      oldValue,
      newValue,
      modifiedBy: { id: userId },
      wedding: { id: weddingId },
    });
    await changeLogRepository.save(changeLog);
  } catch (error) {
    console.error("创建变更日志失败:", error);
  }
};
