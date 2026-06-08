import "reflect-metadata";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Wedding } from "../entities/Wedding";
import { Checklist, ChecklistPhase } from "../entities/Checklist";
import { VendorBooking, VendorType } from "../entities/VendorBooking";
import { Budget, BudgetCategory } from "../entities/Budget";
import { Comment } from "../entities/Comment";
import { FileAttachment } from "../entities/FileAttachment";
import { ChangeLog } from "../entities/ChangeLog";

const checklistTemplates: { title: string; phase: ChecklistPhase; description?: string }[] = [
  { title: "确定婚礼日期", phase: "婚前12个月", description: "与双方家人协商，确定最佳婚礼日期" },
  { title: "设定预算总额", phase: "婚前12个月", description: "根据双方经济状况，设定合理的婚礼预算" },
  { title: "初步确定宾客名单", phase: "婚前12个月", description: "统计双方亲友人数，初步确定规模" },
  { title: "选择婚礼场地", phase: "婚前12个月", description: "参观多个场地，比较价格和服务" },
  { title: "预定婚礼场地", phase: "婚前12个月", description: "签订合同，支付定金" },
  
  { title: "选择婚礼策划公司", phase: "婚前6个月", description: "面试多家策划公司，选择最合适的" },
  { title: "预定婚纱摄影", phase: "婚前6个月", description: "选择摄影师，确定拍摄日期和风格" },
  { title: "挑选婚纱礼服", phase: "婚前6个月", description: "新娘挑选婚纱，新郎挑选西装" },
  { title: "预定婚庆司仪", phase: "婚前6个月", description: "选择有经验的婚礼主持人" },
  { title: "预定婚宴餐饮", phase: "婚前6个月", description: "确定菜单，品尝菜品" },
  { title: "选择伴郎伴娘", phase: "婚前6个月", description: "确定伴郎伴娘人选并通知" },
  { title: "预定婚礼用车", phase: "婚前6个月", description: "安排婚车车队" },
  { title: "预定蜜月旅行", phase: "婚前6个月", description: "确定目的地，预订机票酒店" },
  { title: "选择婚礼主题风格", phase: "婚前6个月", description: "确定婚礼整体风格和色彩搭配" },
  
  { title: "发送正式请柬", phase: "婚前3个月", description: "设计并印制请柬，发送给宾客" },
  { title: "拍摄婚纱照", phase: "婚前3个月", description: "完成婚纱照拍摄并选片" },
  { title: "确定最终宾客名单", phase: "婚前3个月", description: "统计确认出席的宾客人数" },
  { title: "与司仪沟通流程", phase: "婚前3个月", description: "详细讨论婚礼当天流程" },
  { title: "确定婚礼音乐", phase: "婚前3个月", description: "选择入场音乐、背景音乐等" },
  { title: "选购婚戒", phase: "婚前3个月", description: "挑选并定制结婚戒指" },
  { title: "安排宾客住宿", phase: "婚前3个月", description: "为外地宾客预订酒店" },
  { title: "确定婚礼花艺", phase: "婚前3个月", description: "选择花材和花艺设计" },
  { title: "预定婚礼蛋糕", phase: "婚前3个月", description: "选择蛋糕款式和口味" },
  
  { title: "试穿婚纱礼服", phase: "婚前1个月", description: "最后试穿，确认尺寸合适" },
  { title: "确认所有供应商", phase: "婚前1个月", description: "与所有供应商确认最终细节" },
  { title: "制作婚礼座位表", phase: "婚前1个月", description: "安排宾客座位" },
  { title: "准备婚礼誓词", phase: "婚前1个月", description: "新人准备婚礼誓词" },
  { title: "购买婚礼用品", phase: "婚前1个月", description: "购买红包、喜字、签到册等" },
  { title: "安排婚礼彩排", phase: "婚前1个月", description: "组织相关人员进行彩排" },
  { title: "确认蜜月行程", phase: "婚前1个月", description: "最终确认旅行安排" },
  { title: "美发美甲预约", phase: "婚前1个月", description: "预约婚礼当天的美发美甲" },
  
  { title: "最后确认宾客出席", phase: "婚前1周", description: "电话或短信确认宾客" },
  { title: "整理婚礼当天物品清单", phase: "婚前1周", description: "列出需要携带的所有物品" },
  { title: "与婚礼策划师最终确认", phase: "婚前1周", description: "确认所有细节和时间安排" },
  { title: "准备婚礼致辞", phase: "婚前1周", description: "双方父母和新人准备致辞" },
  { title: "充分休息", phase: "婚前1周", description: "保持良好状态，避免疲劳" },
  { title: "准备红包", phase: "婚前1周", description: "准备各种金额的红包" },
  
  { title: "早起美发化妆", phase: "婚礼当天", description: "按照预约时间到达" },
  { title: "迎亲接新娘", phase: "婚礼当天", description: "按照传统习俗进行" },
  { title: "到达婚礼现场", phase: "婚礼当天", description: "提前到达，准备迎宾" },
  { title: "迎宾签到", phase: "婚礼当天", description: "欢迎宾客到来" },
  { title: "婚礼仪式开始", phase: "婚礼当天", description: "按照流程进行" },
  { title: "婚宴开始", phase: "婚礼当天", description: "敬酒环节" },
  { title: "婚礼结束送客", phase: "婚礼当天", description: "感谢宾客光临" },
];

const vendorData: { name: string; type: VendorType; contractAmount: number; paidAmount: number }[] = [
  { name: "幸福婚礼策划有限公司", type: "婚庆", contractAmount: 28000, paidAmount: 14000 },
  { name: "永恒记忆摄影工作室", type: "摄影", contractAmount: 12800, paidAmount: 6400 },
  { name: "皇家宴会厅", type: "场地", contractAmount: 88000, paidAmount: 44000 },
  { name: "美丽新娘婚纱馆", type: "婚纱", contractAmount: 8600, paidAmount: 4300 },
  { name: "金牌主持张老师", type: "主持", contractAmount: 5000, paidAmount: 2500 },
];

const budgetData: { category: BudgetCategory; budgetLimit: number; actualSpent: number }[] = [
  { category: "场地", budgetLimit: 100000, actualSpent: 88000 },
  { category: "婚庆", budgetLimit: 35000, actualSpent: 28000 },
  { category: "摄影", budgetLimit: 15000, actualSpent: 12800 },
  { category: "婚纱", budgetLimit: 10000, actualSpent: 8600 },
  { category: "主持", budgetLimit: 6000, actualSpent: 5000 },
  { category: "蜜月", budgetLimit: 30000, actualSpent: 0 },
  { category: "其他", budgetLimit: 10000, actualSpent: 5000 },
];

async function seed() {
  await AppDataSource.initialize();
  console.log("开始创建种子数据...");

  const userRepository = AppDataSource.getRepository(User);
  const weddingRepository = AppDataSource.getRepository(Wedding);
  const checklistRepository = AppDataSource.getRepository(Checklist);
  const vendorRepository = AppDataSource.getRepository(VendorBooking);
  const budgetRepository = AppDataSource.getRepository(Budget);

  const hashedAdminPassword = await bcrypt.hash("admin123456", 10);
  const hashedGroomPassword = await bcrypt.hash("groom123456", 10);
  const hashedBridePassword = await bcrypt.hash("bride123456", 10);
  const hashedAssistantPassword = await bcrypt.hash("assistant123456", 10);

  const wedding = weddingRepository.create({
    groomName: "张伟",
    brideName: "李娜",
    weddingDate: "2025-10-01",
    location: "北京市朝阳区皇家宴会厅",
    totalBudget: 206000,
    theme: "中式",
  });
  await weddingRepository.save(wedding);

  const admin = userRepository.create({
    username: "admin",
    password: hashedAdminPassword,
    name: "系统管理员",
    role: "Admin",
  });
  await userRepository.save(admin);

  const groom = userRepository.create({
    username: "groom1",
    password: hashedGroomPassword,
    name: "张伟",
    role: "Couple",
    wedding,
  });
  await userRepository.save(groom);

  const bride = userRepository.create({
    username: "bride1",
    password: hashedBridePassword,
    name: "李娜",
    role: "Couple",
    wedding,
  });
  await userRepository.save(bride);

  const assistant = userRepository.create({
    username: "assistant1",
    password: hashedAssistantPassword,
    name: "王伴郎",
    role: "Assistant",
    wedding,
  });
  await userRepository.save(assistant);

  for (const template of checklistTemplates) {
    let assignee: User | undefined;
    if (template.title.includes("新娘") || template.title.includes("婚纱") || template.title.includes("美甲")) {
      assignee = bride;
    } else if (template.title.includes("新郎") || template.title.includes("西装") || template.title.includes("婚车")) {
      assignee = groom;
    } else if (template.phase === "婚礼当天") {
      assignee = assistant;
    }

    const checklist = checklistRepository.create({
      ...template,
      wedding,
      assignee,
      status: Math.random() > 0.5 ? "已完成" : "待开始",
      priority: Math.random() > 0.7 ? "高" : Math.random() > 0.5 ? "中" : "低",
    });
    await checklistRepository.save(checklist);
  }

  for (const v of vendorData) {
    const vendor = vendorRepository.create({
      ...v,
      wedding,
      isConfirmed: true,
      paymentStatus: v.paidAmount >= v.contractAmount ? "全额付清" : "定金已付",
    });
    await vendorRepository.save(vendor);
  }

  for (const b of budgetData) {
    const budget = budgetRepository.create({
      ...b,
      wedding,
    });
    await budgetRepository.save(budget);
  }

  const allChecklists = await checklistRepository.find({ where: { wedding: { id: wedding.id } } });
  const allVendors = await vendorRepository.find({ where: { wedding: { id: wedding.id } } });
  const firstChecklist = allChecklists[0];
  const firstVendor = allVendors[0];

  const commentRepository = AppDataSource.getRepository(Comment);
  const comments = [
    { content: "这个任务需要尽快完成，场地很抢手！", author: groom, checklist: firstChecklist },
    { content: "@新娘 你看下这个日期可行吗？", mentions: [bride.id], author: assistant, checklist: firstChecklist },
    { content: "没问题，我这边确认了。", author: bride, checklist: firstChecklist },
  ];
  for (const c of comments) {
    const comment = commentRepository.create(c);
    await commentRepository.save(comment);
  }

  const fileRepository = AppDataSource.getRepository(FileAttachment);
  const files = [
    { fileName: "场地合同.pdf", fileUrl: "/uploads/venue-contract.pdf", fileSize: 1024000, entityType: "checklist" as const, entityId: firstChecklist.id, uploadedBy: groom, checklist: firstChecklist },
    { fileName: "婚庆报价单.xlsx", fileUrl: "/uploads/wedding-quote.xlsx", fileSize: 512000, entityType: "vendor" as const, entityId: firstVendor.id, uploadedBy: bride, vendor: firstVendor },
    { fileName: "婚礼流程示意图.png", fileUrl: "/uploads/wedding-flow.png", fileSize: 2048000, entityType: "wedding" as const, uploadedBy: assistant, wedding },
  ];
  for (const f of files) {
    const file = fileRepository.create(f);
    await fileRepository.save(file);
  }

  const changeLogRepository = AppDataSource.getRepository(ChangeLog);
  const changeLogs = [
    { entityType: "wedding" as const, entityId: wedding.id, fieldName: "totalBudget", oldValue: "200000", newValue: "206000", modifiedBy: groom, wedding },
    { entityType: "wedding" as const, entityId: wedding.id, fieldName: "location", oldValue: "待定", newValue: wedding.location, modifiedBy: bride, wedding },
  ];
  for (const l of changeLogs) {
    const changeLog = changeLogRepository.create(l);
    await changeLogRepository.save(changeLog);
  }

  console.log("种子数据创建完成！");
  console.log("测试账号:");
  console.log("  Admin: admin / admin123456");
  console.log("  新郎: groom1 / groom123456");
  console.log("  新娘: bride1 / bride123456");
  console.log("  伴郎: assistant1 / assistant123456");

  process.exit(0);
}

seed().catch((error) => {
  console.error("创建种子数据失败:", error);
  process.exit(1);
});
