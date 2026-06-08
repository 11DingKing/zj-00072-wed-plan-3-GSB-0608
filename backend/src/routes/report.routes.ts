import express from "express";
import { authenticate } from "../middlewares/auth";
import { generateReport } from "../controllers/report.controller";

const router = express.Router();

router.get("/", authenticate, generateReport);

export default router;
