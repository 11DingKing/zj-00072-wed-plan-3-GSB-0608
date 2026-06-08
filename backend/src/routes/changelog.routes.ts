import express from "express";
import { authenticate } from "../middlewares/auth";
import { getChangeLogs } from "../controllers/changelog.controller";

const router = express.Router();

router.get("/:entityType?/:entityId?", authenticate, getChangeLogs);

export default router;
