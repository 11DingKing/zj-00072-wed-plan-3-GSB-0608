import { Response } from "express";
import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { ScheduleEvent } from "../entities/ScheduleEvent";
import { AuthRequest } from "../middlewares/auth";
import { createChangeLog } from "./changelog.controller";

interface ScheduleEventInput {
  title?: string;
  location?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  eventType?: ScheduleEvent["eventType"];
  responsibleId?: number | null;
  notes?: string;
}

const formatTime = (value: Date) => value.toISOString();

const findConflictingEvent = async (
  repo: Repository<ScheduleEvent>,
  weddingId: number,
  startTime: Date,
  endTime: Date,
  excludeId?: number,
) => {
  const query = repo
    .createQueryBuilder("event")
    .leftJoinAndSelect("event.responsible", "responsible")
    .where("event.weddingId = :weddingId", { weddingId })
    .andWhere("event.startTime < :endTime", { endTime })
    .andWhere("event.endTime > :startTime", { startTime });

  if (excludeId !== undefined) {
    query.andWhere("event.id != :excludeId", { excludeId });
  }

  return query.getOne();
};

const validateTimeRange = (startTime: Date, endTime: Date): string | null => {
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return "开始时间或结束时间格式不正确";
  }
  if (endTime.getTime() <= startTime.getTime()) {
    return "结束时间必须晚于开始时间";
  }
  return null;
};

export const getScheduleEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const repo = AppDataSource.getRepository(ScheduleEvent);
    const events = await repo.find({
      where: { wedding: { id: req.user.wedding.id } },
      relations: ["responsible"],
      order: { startTime: "ASC" },
    });

    res.json(events);
  } catch (error) {
    console.error("获取日程列表失败:", error);
    res.status(500).json({ message: "获取日程列表失败" });
  }
};

export const createScheduleEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const body = req.body as ScheduleEventInput;
    if (!body.title || !body.location || !body.startTime || !body.endTime) {
      return res
        .status(400)
        .json({ message: "标题、地点、开始时间和结束时间不能为空" });
    }

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    const timeError = validateTimeRange(startTime, endTime);
    if (timeError) {
      return res.status(400).json({ message: timeError });
    }

    const repo = AppDataSource.getRepository(ScheduleEvent);
    const conflict = await findConflictingEvent(
      repo,
      req.user.wedding.id,
      startTime,
      endTime,
    );
    if (conflict) {
      return res.status(409).json({
        message: `时间冲突：与已有日程「${conflict.title}」(${formatTime(
          conflict.startTime,
        )} - ${formatTime(conflict.endTime)}) 时间段重叠`,
        conflict: {
          id: conflict.id,
          title: conflict.title,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        },
      });
    }

    const event = repo.create({
      title: body.title,
      location: body.location,
      startTime,
      endTime,
      eventType: body.eventType || "其他",
      notes: body.notes || "",
      wedding: { id: req.user.wedding.id },
      responsible: body.responsibleId ? { id: body.responsibleId } : undefined,
    });

    const saved = await repo.save(event);

    await createChangeLog(
      "schedule",
      saved.id,
      "create",
      undefined,
      `${saved.title} (${formatTime(saved.startTime)} - ${formatTime(
        saved.endTime,
      )})`,
      req.user.id,
      req.user.wedding.id,
    );

    const result = await repo.findOne({
      where: { id: saved.id },
      relations: ["responsible", "wedding"],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("创建日程失败:", error);
    res.status(500).json({ message: "创建日程失败" });
  }
};

export const updateScheduleEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "无效的日程 ID" });
    }

    const repo = AppDataSource.getRepository(ScheduleEvent);
    const existing = await repo.findOne({
      where: { id },
      relations: ["responsible", "wedding"],
    });

    if (!existing || existing.wedding.id !== req.user.wedding.id) {
      return res.status(404).json({ message: "日程不存在" });
    }

    const body = req.body as ScheduleEventInput;
    const newStart = body.startTime
      ? new Date(body.startTime)
      : existing.startTime;
    const newEnd = body.endTime ? new Date(body.endTime) : existing.endTime;

    const timeError = validateTimeRange(newStart, newEnd);
    if (timeError) {
      return res.status(400).json({ message: timeError });
    }

    const conflict = await findConflictingEvent(
      repo,
      req.user.wedding.id,
      newStart,
      newEnd,
      id,
    );
    if (conflict) {
      return res.status(409).json({
        message: `时间冲突：与已有日程「${conflict.title}」(${formatTime(
          conflict.startTime,
        )} - ${formatTime(conflict.endTime)}) 时间段重叠`,
        conflict: {
          id: conflict.id,
          title: conflict.title,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        },
      });
    }

    const oldSnapshot = {
      title: existing.title,
      location: existing.location,
      startTime: formatTime(existing.startTime),
      endTime: formatTime(existing.endTime),
      eventType: existing.eventType,
      responsible: existing.responsible?.id ?? null,
      notes: existing.notes ?? "",
    };

    existing.title = body.title ?? existing.title;
    existing.location = body.location ?? existing.location;
    existing.startTime = newStart;
    existing.endTime = newEnd;
    existing.eventType = body.eventType ?? existing.eventType;
    existing.notes = body.notes ?? existing.notes;
    if (body.responsibleId === null) {
      existing.responsible = undefined;
    } else if (body.responsibleId !== undefined) {
      existing.responsible = { id: body.responsibleId } as any;
    }

    await repo.save(existing);

    const newSnapshot = {
      title: existing.title,
      location: existing.location,
      startTime: formatTime(existing.startTime),
      endTime: formatTime(existing.endTime),
      eventType: existing.eventType,
      responsible:
        (existing.responsible as { id?: number } | undefined)?.id ?? null,
      notes: existing.notes ?? "",
    };

    for (const field of Object.keys(oldSnapshot) as Array<
      keyof typeof oldSnapshot
    >) {
      const oldValue = String(oldSnapshot[field] ?? "");
      const newValue = String(newSnapshot[field] ?? "");
      if (oldValue !== newValue) {
        await createChangeLog(
          "schedule",
          existing.id,
          field,
          oldValue,
          newValue,
          req.user.id,
          req.user.wedding.id,
        );
      }
    }

    const result = await repo.findOne({
      where: { id: existing.id },
      relations: ["responsible", "wedding"],
    });

    res.json(result);
  } catch (error) {
    console.error("更新日程失败:", error);
    res.status(500).json({ message: "更新日程失败" });
  }
};

export const deleteScheduleEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "无效的日程 ID" });
    }

    const repo = AppDataSource.getRepository(ScheduleEvent);
    const existing = await repo.findOne({
      where: { id },
      relations: ["wedding"],
    });

    if (!existing || existing.wedding.id !== req.user.wedding.id) {
      return res.status(404).json({ message: "日程不存在" });
    }

    await repo.remove(existing);

    await createChangeLog(
      "schedule",
      id,
      "delete",
      `${existing.title} (${formatTime(existing.startTime)} - ${formatTime(
        existing.endTime,
      )})`,
      undefined,
      req.user.id,
      req.user.wedding.id,
    );

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除日程失败:", error);
    res.status(500).json({ message: "删除日程失败" });
  }
};
