import express from "express";
import {
  getChecklists,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  getMyTasks,
} from "../controllers/checklist.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router();

router.get("/", authenticate, getChecklists);
router.get("/my-tasks", authenticate, getMyTasks);
router.post("/", authenticate, authorize("Admin", "Couple"), createChecklist);
router.put("/:id", authenticate, authorize("Admin", "Couple"), updateChecklist);
router.delete("/:id", authenticate, authorize("Admin"), deleteChecklist);

export default router;
