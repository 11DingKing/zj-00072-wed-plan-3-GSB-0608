import express from "express";
import { getWedding, updateWedding, getAllWeddings } from "../controllers/wedding.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router();

router.get("/", authenticate, getWedding);
router.put("/", authenticate, authorize("Admin", "Couple"), updateWedding);
router.get("/all", authenticate, authorize("Admin"), getAllWeddings);

export default router;
