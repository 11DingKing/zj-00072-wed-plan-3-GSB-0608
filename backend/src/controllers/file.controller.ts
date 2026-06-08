import { Response } from "express";
import { AppDataSource } from "../config/database";
import { FileAttachment, FileEntityType } from "../entities/FileAttachment";
import { AuthRequest } from "../middlewares/auth";

export const getFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const fileRepository = AppDataSource.getRepository(FileAttachment);

    const whereCondition: any = { entityType: entityType as FileEntityType };
    if (entityId) {
      whereCondition.entityId = parseInt(entityId);
    }

    const files = await fileRepository.find({
      where: whereCondition,
      relations: ["uploadedBy"],
      order: { uploadedAt: "DESC" },
    });

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "获取文件失败" });
  }
};

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { fileName, fileUrl, fileSize } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "未认证" });
    }

    const fileRepository = AppDataSource.getRepository(FileAttachment);
    const fileData: any = {
      fileName,
      fileUrl,
      fileSize,
      entityType: entityType as FileEntityType,
      entityId: entityId ? parseInt(entityId) : null,
      uploadedBy: { id: req.user.id },
    };

    if (entityType === "checklist" && entityId) {
      fileData.checklist = { id: parseInt(entityId) };
    } else if (entityType === "vendor" && entityId) {
      fileData.vendor = { id: parseInt(entityId) };
    } else if (entityType === "wedding" && req.user.wedding) {
      fileData.wedding = { id: req.user.wedding.id };
    }

    const file = fileRepository.create(fileData) as unknown as FileAttachment;
    const savedFile = await fileRepository.save(file);
    const result = await fileRepository.findOne({
      where: { id: savedFile.id },
      relations: ["uploadedBy"],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("上传文件失败:", error);
    res.status(500).json({ message: "上传文件失败" });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const fileRepository = AppDataSource.getRepository(FileAttachment);

    const file = await fileRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["uploadedBy"],
    });

    if (!file) {
      return res.status(404).json({ message: "文件不存在" });
    }

    if (file.uploadedBy.id !== req.user?.id && req.user?.role !== "Admin") {
      return res.status(403).json({ message: "无权限删除此文件" });
    }

    await fileRepository.delete(id);
    res.json({ message: "删除成功" });
  } catch (error) {
    res.status(500).json({ message: "删除文件失败" });
  }
};
