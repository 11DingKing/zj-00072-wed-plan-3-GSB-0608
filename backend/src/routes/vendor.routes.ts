import express from "express";
import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from "../controllers/vendor.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router();

router.get("/", authenticate, getVendors);
router.post("/", authenticate, authorize("Admin", "Couple"), createVendor);
router.put("/:id", authenticate, authorize("Admin", "Couple"), updateVendor);
router.delete("/:id", authenticate, authorize("Admin"), deleteVendor);

export default router;
