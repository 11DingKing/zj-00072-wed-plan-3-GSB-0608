import { Response } from "express";
import { AppDataSource } from "../config/database";
import { ScheduleEvent, ScheduleEventType } from "../entities/ScheduleEvent";
import { AuthRequest } from "../middlewares/auth";
import { createChangeLog } from "./changelog.controller";
import { Between, LessThan, MoreThan } from "typeorm";

const checkTimeConflict = async (
  weddingId: number,
  startTime: Date,
  endTime: Date,
  excludeId?: number
): Promise<ScheduleEvent | null> => {
  const scheduleRepository = AppDataSource.getRepository(ScheduleEvent);

  const conflictingEvent = await scheduleRepository
    .createQueryBuilder("event")
    .where("event.weddingId = :weddingId", { weddingId })
    .andWhere("event.startTime < :endTime AND event.endTime > :startTime", {
      startTime,
      endTime,
    })
    .andWhere(excludeId ? "event.id != :excludeId" : "1=1", { excludeId })
    .getOne();

  return conflictingEvent;
};

export const getScheduleEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const scheduleRepository = AppDataSource.getRepository(ScheduleEvent);
    const events = await scheduleRepository.find({
      where: { wedding: { id: req.user.wedding.id } },
      order: { startTime: "ASC" },
    });

    res.json(events);
  } catch (error) {
    console.error("获取日程列表失败:", error);
    res.status(500).json({ message: "获取日程列表失败" });
  }
};

export const getScheduleEventById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const { id } = req.params;
    const scheduleRepository = AppDataSource.getRepository(ScheduleEvent);
    const event = await scheduleRepository.findOne({
      where: {
        id: parseInt(id),
        wedding: { id: req.user.wedding.id },
      },
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

    const { title, location, startTime, endTime, responsiblePerson, type, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "请输入日程标题" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "时间格式不正确" });
    }

    if (end <= start) {
      return res.status(400).json({ message: "结束时间必须晚于开始时间" });
    }

    const conflictingEvent = await checkTimeConflict(req.user.wedding.id, start, end);
    if (conflictingEvent) {
      return res.status(400).json({
        message: `时间与已有日程冲突：「${conflictingEvent.title}」`,
        conflictingEvent,
      });
    }

    const scheduleRepository = AppDataSource.getRepository(ScheduleEvent);
    const event = scheduleRepository.create({
      title,
      location,
      startTime: start,
      endTime: end,
      responsiblePerson,
      type: type || "其他",
      description,
      wedding: { id: req.user.wedding.id },
    });

    const savedEvent = await scheduleRepository.save(event);

    await createChangeLog(
      "schedule",
      savedEvent.id,
      "event",
      undefined,
      JSON.stringify(savedEvent),
      req.user.id,
      req.user.wedding.id
    );

    res.status(201).json(savedEvent);
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
    const scheduleRepository = AppDataSource.getRepository(ScheduleEvent);

    const oldEvent = await scheduleRepository.findOne({
      where: {
        id: parseInt(id),
        wedding: { id: req.user.wedding.id },
      },
    });

    if (!oldEvent) {
      return res.status(404).json({ message: "日程不存在" });
    }

    const { title, location, startTime, endTime, responsiblePerson, type, description } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (location !== undefined) updateData.location = location;
    if (responsiblePerson !== undefined) updateData.responsiblePerson = responsiblePerson;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;

    let newStartTime = oldEvent.startTime;
    let newEndTime = oldEvent.endTime;

    if (startTime !== undefined) {
      newStartTime = new Date(startTime);
      if (isNaN(newStartTime.getTime())) {
        return res.status(400).json({ message: "开始时间格式不正确" });
      }
      updateData.startTime = newStartTime;
    }

    if (endTime !== undefined) {
      newEndTime = new Date(endTime);
      if (isNaN(newEndTime.getTime())) {
        return res.status(400).json({ message: "结束时间格式不正确" });
      }
      updateData.endTime = newEndTime;
    }

    if (newEndTime <= newStartTime) {
      return res.status(400).json({ message: "结束时间必须晚于开始时间" });
    }

    const conflictingEvent = await checkTimeConflict(
      req.user.wedding.id,
      newStartTime,
      newEndTime,
      parseInt(id)
    );
    if (conflictingEvent) {
      return res.status(400).json({
        message: `时间与已有日程冲突：「${conflictingEvent.title}」`,
        conflictingEvent,
      });
    }

    await scheduleRepository.update(parseInt(id), updateData);
    const updatedEvent = await scheduleRepository.findOne({
      where: { id: parseInt(id) },
    });

    const fields = ["title", "location", "startTime", "endTime", "responsiblePerson", "type", "description"];
    for (const field of fields) {
      const oldValue = oldEvent[field as keyof ScheduleEvent]?.toString();
      const newValue = updateData[field]?.toString();
      if (newValue !== undefined && oldValue !== newValue) {
        await createChangeLog(
          "schedule",
          parseInt(id),
          field,
          oldValue,
          newValue,
          req.user.id,
          req.user.wedding.id
        );
      }
    }

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
    const scheduleRepository = AppDataSource.getRepository(ScheduleEvent);

    const event = await scheduleRepository.findOne({
      where: {
        id: parseInt(id),
        wedding: { id: req.user.wedding.id },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "日程不存在" });
    }

    await scheduleRepository.delete(parseInt(id));

    await createChangeLog(
      "schedule",
      parseInt(id),
      "event",
      JSON.stringify(event),
      undefined,
      req.user.id,
      req.user.wedding.id
    );

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除日程失败:", error);
    res.status(500).json({ message: "删除日程失败" });
  }
};
