import { Response } from "express";
import { AppDataSource } from "../config/database";
import { ScheduleEvent } from "../entities/ScheduleEvent";
import { AuthRequest } from "../middlewares/auth";
import { createChangeLog } from "./changelog.controller";

const SCHEDULE_FIELDS = [
  "title",
  "location",
  "startTime",
  "endTime",
  "personInCharge",
  "type",
];

const hasTimeConflict = (
  existingEvents: ScheduleEvent[],
  startTime: Date,
  endTime: Date,
  excludeId?: number,
): ScheduleEvent | null => {
  for (const ev of existingEvents) {
    if (excludeId !== undefined && ev.id === excludeId) continue;
    if (startTime < ev.endTime && ev.startTime < endTime) {
      return ev;
    }
  }
  return null;
};

const validateTimeRange = (startTime: Date, endTime: Date): string | null => {
  if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
    return "开始时间格式无效";
  }
  if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
    return "结束时间格式无效";
  }
  if (endTime <= startTime) {
    return "结束时间必须晚于开始时间";
  }
  return null;
};

const formatTime = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const getScheduleEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const repo = AppDataSource.getRepository(ScheduleEvent);
    const events = await repo.find({
      where: { wedding: { id: req.user.wedding.id } },
      relations: ["createdBy"],
      order: { startTime: "ASC" },
    });

    res.json(events);
  } catch (error) {
    console.error("获取日程列表失败:", error);
    res.status(500).json({ message: "获取日程列表失败" });
  }
};

export const getScheduleEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const { id } = req.params;
    const repo = AppDataSource.getRepository(ScheduleEvent);
    const event = await repo.findOne({
      where: { id: parseInt(id), wedding: { id: req.user.wedding.id } },
      relations: ["createdBy"],
    });

    if (!event) {
      return res.status(404).json({ message: "日程不存在" });
    }

    res.json(event);
  } catch (error) {
    console.error("获取日程详情失败:", error);
    res.status(500).json({ message: "获取日程详情失败" });
  }
};

export const createScheduleEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const { title, location, startTime, endTime, personInCharge, type } =
      req.body;

    if (!title) {
      return res.status(400).json({ message: "标题不能为空" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const timeError = validateTimeRange(start, end);
    if (timeError) {
      return res.status(400).json({ message: timeError });
    }

    const repo = AppDataSource.getRepository(ScheduleEvent);

    const existing = await repo.find({
      where: { wedding: { id: req.user.wedding.id } },
    });

    const conflict = hasTimeConflict(existing, start, end);
    if (conflict) {
      return res.status(409).json({
        message: `时间冲突：与「${conflict.title}」（${formatTime(conflict.startTime)} - ${formatTime(conflict.endTime)}）时间段重叠`,
      });
    }

    const event = repo.create({
      title,
      location: location || "",
      startTime: start,
      endTime: end,
      personInCharge: personInCharge || "",
      type: type || "其他",
      wedding: { id: req.user.wedding.id },
      createdBy: { id: req.user.id },
    });

    const saved = await repo.save(event);
    const result = await repo.findOne({
      where: { id: saved.id },
      relations: ["createdBy"],
    });

    await createChangeLog(
      "schedule",
      saved.id,
      "created",
      undefined,
      JSON.stringify({
        title,
        location,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        personInCharge,
        type,
      }),
      req.user.id,
      req.user.wedding.id,
    );

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

    const { id } = req.params;
    const repo = AppDataSource.getRepository(ScheduleEvent);

    const existing = await repo.findOne({
      where: { id: parseInt(id), wedding: { id: req.user.wedding.id } },
    });

    if (!existing) {
      return res.status(404).json({ message: "日程不存在" });
    }

    const rawStartTime =
      req.body.startTime !== undefined
        ? req.body.startTime
        : existing.startTime;
    const rawEndTime =
      req.body.endTime !== undefined ? req.body.endTime : existing.endTime;
    const start = new Date(rawStartTime);
    const end = new Date(rawEndTime);

    const timeError = validateTimeRange(start, end);
    if (timeError) {
      return res.status(400).json({ message: timeError });
    }

    const allEvents = await repo.find({
      where: { wedding: { id: req.user.wedding.id } },
    });

    const conflict = hasTimeConflict(allEvents, start, end, parseInt(id));
    if (conflict) {
      return res.status(409).json({
        message: `时间冲突：与「${conflict.title}」（${formatTime(conflict.startTime)} - ${formatTime(conflict.endTime)}）时间段重叠`,
      });
    }

    const oldValues: Record<string, string | undefined> = {};
    const newValues: Record<string, string | undefined> = {};

    for (const field of SCHEDULE_FIELDS) {
      const oldVal = (existing as any)[field];
      const newVal =
        field === "startTime"
          ? start
          : field === "endTime"
            ? end
            : req.body[field] !== undefined
              ? req.body[field]
              : oldVal;

      const oldStr =
        oldVal instanceof Date
          ? oldVal.toISOString()
          : (oldVal?.toString() ?? undefined);
      const newStr =
        newVal instanceof Date
          ? newVal.toISOString()
          : (newVal?.toString() ?? undefined);

      if (newStr !== oldStr) {
        oldValues[field] = oldStr;
        newValues[field] = newStr;
      }
    }

    const updateData: any = { ...req.body };
    updateData.startTime = start;
    updateData.endTime = end;

    await repo.update(id, updateData);

    const updated = await repo.findOne({
      where: { id: parseInt(id) },
      relations: ["createdBy"],
    });

    for (const field of Object.keys(newValues)) {
      await createChangeLog(
        "schedule",
        parseInt(id),
        field,
        oldValues[field],
        newValues[field],
        req.user.id,
        req.user.wedding.id,
      );
    }

    res.json(updated);
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

    const { id } = req.params;
    const repo = AppDataSource.getRepository(ScheduleEvent);

    const existing = await repo.findOne({
      where: { id: parseInt(id), wedding: { id: req.user.wedding.id } },
    });

    if (!existing) {
      return res.status(404).json({ message: "日程不存在" });
    }

    await repo.delete(id);

    await createChangeLog(
      "schedule",
      parseInt(id),
      "deleted",
      JSON.stringify({
        title: existing.title,
        startTime: existing.startTime.toISOString(),
        endTime: existing.endTime.toISOString(),
      }),
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
