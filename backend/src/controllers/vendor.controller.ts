import { Response } from "express";
import { AppDataSource } from "../config/database";
import { VendorBooking } from "../entities/VendorBooking";
import { AuthRequest } from "../middlewares/auth";

export const getVendors = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    const vendorRepository = AppDataSource.getRepository(VendorBooking);
    const vendors = await vendorRepository.find({
      where: { wedding: { id: req.user.wedding.id } },
      relations: ["budget", "checklists"],
    });

    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: "获取供应商列表失败" });
  }
};

export const createVendor = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.wedding) {
      return res.status(404).json({ message: "未关联婚礼" });
    }

    console.log("Received vendor data:", req.body);

    const vendorRepository = AppDataSource.getRepository(VendorBooking);
    const vendorData = {
      name: req.body.name,
      type: req.body.type || "其他",
      contactPerson: req.body.contactPerson || "",
      phone: req.body.phone || "",
      email: req.body.email || "",
      address: req.body.address || "",
      contractAmount: req.body.contractAmount || 0,
      paidAmount: req.body.paidAmount || 0,
      paymentStatus: req.body.paymentStatus || "未付",
      isConfirmed: req.body.isConfirmed || false,
      notes: req.body.notes || "",
      wedding: { id: req.user.wedding.id },
    };

    console.log("Processed vendor data:", vendorData);

    const vendor = vendorRepository.create(vendorData);
    const savedVendor = await vendorRepository.save(vendor);
    const result = await vendorRepository.findOne({
      where: { id: savedVendor.id },
      relations: ["budget", "checklists", "wedding"],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("创建供应商失败:", error);
    res.status(500).json({ message: "创建供应商失败" });
  }
};

export const updateVendor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vendorRepository = AppDataSource.getRepository(VendorBooking);

    await vendorRepository.update(id, req.body);
    const updatedVendor = await vendorRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["budget", "checklists", "wedding"],
    });

    res.json(updatedVendor);
  } catch (error) {
    console.error("更新供应商失败:", error);
    res.status(500).json({ message: "更新供应商失败" });
  }
};

export const deleteVendor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vendorRepository = AppDataSource.getRepository(VendorBooking);

    await vendorRepository.delete(id);
    res.json({ message: "删除成功" });
  } catch (error) {
    res.status(500).json({ message: "删除供应商失败" });
  }
};
