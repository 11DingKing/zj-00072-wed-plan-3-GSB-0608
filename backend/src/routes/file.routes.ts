import express from "express";
import { authenticate } from "../middlewares/auth";
import { getFiles, uploadFile, deleteFile } from "../controllers/file.controller";

const router = express.Router();

router.get("/:entityType/:entityId?", authenticate, getFiles);
router.post("/:entityType/:entityId?", authenticate, uploadFile);
router.delete("/:id", authenticate, deleteFile);

export default router;
