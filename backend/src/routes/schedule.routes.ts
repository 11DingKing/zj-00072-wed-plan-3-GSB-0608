import express from "express";
import {
  getScheduleEvents,
  createScheduleEvent,
  updateScheduleEvent,
  deleteScheduleEvent,
} from "../controllers/schedule.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router();

router.get("/", authenticate, getScheduleEvents);
router.post(
  "/",
  authenticate,
  authorize("Admin", "Couple"),
  createScheduleEvent,
);
router.put(
  "/:id",
  authenticate,
  authorize("Admin", "Couple"),
  updateScheduleEvent,
);
router.delete("/:id", authenticate, authorize("Admin"), deleteScheduleEvent);

export default router;
