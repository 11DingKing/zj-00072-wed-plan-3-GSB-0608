import express from "express";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../controllers/budget.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router();

router.get("/", authenticate, getBudgets);
router.post("/", authenticate, authorize("Admin", "Couple"), createBudget);
router.put("/:id", authenticate, authorize("Admin", "Couple"), updateBudget);
router.delete("/:id", authenticate, authorize("Admin"), deleteBudget);

export default router;
