import { Response } from "express";
import { AppDataSource } from "../config/database";
import { ScheduleEvent } from "../entities/ScheduleEvent";
import { AuthRequest } from "../middlewares/auth";
import { createChangeLog } from "./changelog.controller";

function hasTimeOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}

async function checkTimeConflict(
  weddingId: number,
  startTime: string,
  endTime: string,
  excludeId?: number,
): Promise<ScheduleEvent | null> {
  const repo = AppDataSource.getRepository(ScheduleEvent);
  const events = await repo.find({
    where: { wedding: { id: weddingId } },
  });

  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);

  for (const event of events) {
    if (excludeId && event.id === excludeId) continue;
    const existStart = new Date(event.startTime);
    const existEnd = new Date(event.endTime);
    if (hasTimeOverlap(newStart, newEnd, existStart, existEnd)) {
      return event;
    }
  }
  return null;
}

export const getScheduleEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const repo = AppDataSource.getRepository(ScheduleEvent);
    const events = await repo.find({
      where: { wedding: { id: req.user.wedding.id } },
      order: { startTime: "ASC" },
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "获取日程列表失败" });
  }
};

export const createScheduleEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const { title, location, startTime, endTime, personInCharge, type } =
      req.body;

    if (!title || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "标题、开始时间和结束时间为必填项" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: "结束时间必须晚于开始时间" });
    }

    const conflict = await checkTimeConflict(
      req.user.wedding.id,
      startTime,
      endTime,
    );
    if (conflict) {
      return res.status(409).json({
        message: `时间冲突：与日程「${conflict.title}」（${new Date(conflict.startTime).toLocaleString("zh-CN")} - ${new Date(conflict.endTime).toLocaleString("zh-CN")}）存在重叠`,
      });
    }

    const repo = AppDataSource.getRepository(ScheduleEvent);
    const eventData = {
      title,
      location: location || null,
      startTime,
      endTime,
      personInCharge: personInCharge || null,
      type: type || "其他",
      wedding: { id: req.user.wedding.id },
    };

    const event = repo.create(eventData);
    const savedEvent = await repo.save(event);
    const result = await repo.findOne({
      where: { id: savedEvent.id },
      relations: ["wedding"],
    });

    await createChangeLog(
      "schedule",
      savedEvent.id,
      "create",
      undefined,
      JSON.stringify({ title, startTime, endTime, type }),
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
      where: { id: parseInt(id) },
      relations: ["wedding"],
    });

    if (!existing) {
      return res.status(404).json({ message: "日程不存在" });
    }

    if (existing.wedding.id !== req.user.wedding.id) {
      return res.status(403).json({ message: "无权修改此日程" });
    }

    const startTime = req.body.startTime ?? existing.startTime;
    const endTime = req.body.endTime ?? existing.endTime;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: "结束时间必须晚于开始时间" });
    }

    const conflict = await checkTimeConflict(
      req.user.wedding.id,
      startTime,
      endTime,
      parseInt(id),
    );
    if (conflict) {
      return res.status(409).json({
        message: `时间冲突：与日程「${conflict.title}」（${new Date(conflict.startTime).toLocaleString("zh-CN")} - ${new Date(conflict.endTime).toLocaleString("zh-CN")}）存在重叠`,
      });
    }

    const oldValues: Record<string, string> = {};
    const fields = [
      "title",
      "location",
      "startTime",
      "endTime",
      "personInCharge",
      "type",
    ];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const oldValue = (existing as any)[field]?.toString();
        const newValue = req.body[field]?.toString();
        if (oldValue !== newValue) {
          oldValues[field] = oldValue;
          await createChangeLog(
            "schedule",
            parseInt(id),
            field,
            oldValue,
            newValue,
            req.user.id,
            req.user.wedding.id,
          );
        }
      }
    }

    await repo.update(id, req.body);
    const updatedEvent = await repo.findOne({
      where: { id: parseInt(id) },
      relations: ["wedding"],
    });

    res.json(updatedEvent);
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
      where: { id: parseInt(id) },
      relations: ["wedding"],
    });

    if (!existing) {
      return res.status(404).json({ message: "日程不存在" });
    }

    if (existing.wedding.id !== req.user.wedding.id) {
      return res.status(403).json({ message: "无权删除此日程" });
    }

    await createChangeLog(
      "schedule",
      parseInt(id),
      "delete",
      JSON.stringify({
        title: existing.title,
        startTime: existing.startTime,
        endTime: existing.endTime,
      }),
      undefined,
      req.user.id,
      req.user.wedding.id,
    );

    await repo.delete(id);
    res.json({ message: "删除成功" });
  } catch (error) {
    res.status(500).json({ message: "删除日程失败" });
  }
};
