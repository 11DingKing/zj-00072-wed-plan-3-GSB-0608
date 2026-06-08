import express from "express";
import { getDashboardStats } from "../controllers/stats.controller";
import { authenticate } from "../middlewares/auth";

const router = express.Router();

router.get("/dashboard", authenticate, getDashboardStats);

export default router;
