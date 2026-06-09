import express from "express";
import {
  getScheduleEvents,
  getScheduleEventById,
  createScheduleEvent,
  updateScheduleEvent,
  deleteScheduleEvent,
} from "../controllers/schedule.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router();

router.get("/", authenticate, getScheduleEvents);
router.get("/:id", authenticate, getScheduleEventById);
router.post("/", authenticate, authorize("Admin", "Couple"), createScheduleEvent);
router.put("/:id", authenticate, authorize("Admin", "Couple"), updateScheduleEvent);
router.delete("/:id", authenticate, authorize("Admin", "Couple"), deleteScheduleEvent);

export default router;
