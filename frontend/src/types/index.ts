export type UserRole = "Admin" | "Couple" | "Assistant";

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  weddingId?: number;
}

export type WeddingTheme = "中式" | "西式" | "户外" | "海岛" | "极简";

export interface Wedding {
  id: number;
  groomName: string;
  brideName: string;
  weddingDate: string;
  location: string;
  totalBudget: number;
  theme: WeddingTheme;
  description?: string;
}

export type ChecklistStatus = "待开始" | "进行中" | "已完成" | "已跳过";
export type ChecklistPriority = "高" | "中" | "低";
export type ChecklistPhase =
  | "婚前12个月"
  | "婚前6个月"
  | "婚前3个月"
  | "婚前1个月"
  | "婚前1周"
  | "婚礼当天";

export interface Checklist {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  status: ChecklistStatus;
  priority: ChecklistPriority;
  phase: ChecklistPhase;
  assignee?: User;
  isUrgent: boolean;
}

export type PaymentStatus = "未付" | "定金已付" | "尾款已付" | "全额付清";
export type VendorType =
  | "场地"
  | "婚庆"
  | "摄影"
  | "摄像"
  | "婚纱"
  | "化妆"
  | "主持"
  | "婚车"
  | "喜糖"
  | "请柬"
  | "蜜月"
  | "其他";

export interface VendorBooking {
  id: number;
  name: string;
  type: VendorType;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  contractAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  isConfirmed: boolean;
  bookingDate?: string;
  notes?: string;
}

export type BudgetCategory =
  | "场地"
  | "婚庆"
  | "摄影"
  | "摄像"
  | "婚纱"
  | "化妆"
  | "主持"
  | "婚车"
  | "喜糖"
  | "请柬"
  | "蜜月"
  | "其他";

export interface Budget {
  id: number;
  category: BudgetCategory;
  budgetLimit: number;
  actualSpent: number;
  notes?: string;
}

export interface Comment {
  id: number;
  content: string;
  mentions?: number[];
  attachmentUrl?: string;
  author: User;
  createdAt: string;
}

export type FileEntityType = "wedding" | "checklist" | "vendor";

export interface FileAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  entityType: FileEntityType;
  entityId?: number;
  uploadedBy: User;
  uploadedAt: string;
}

export type ChangeEntityType = "wedding" | "budget" | "vendor" | "schedule";

export interface ChangeLog {
  id: number;
  entityType: ChangeEntityType;
  entityId: number;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  modifiedBy: User;
  modifiedAt: string;
}

export type ScheduleEventType =
  | "化妆"
  | "接亲"
  | "仪式"
  | "拍照"
  | "宴客"
  | "敬酒"
  | "其他";

export interface ScheduleEvent {
  id: number;
  title: string;
  location?: string;
  startTime: string;
  endTime: string;
  personInCharge?: string;
  type: ScheduleEventType;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingReport {
  weddingSummary: {
    groomName: string;
    brideName: string;
    weddingDate: string;
    location: string;
    theme: string;
  };
  progress: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  budget: {
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    budgetProgress: number;
    categories: Array<{
      category: string;
      budgetLimit: number;
      actualSpent: number;
      remaining: number;
    }>;
  };
  payment: {
    totalContractAmount: number;
    totalPaidAmount: number;
    remainingPayment: number;
    paymentProgress: number;
  };
  vendors: Array<{
    name: string;
    type: string;
    contractAmount: number;
    paidAmount: number;
    paymentStatus: string;
    isConfirmed: boolean;
  }>;
  pendingTasks: Array<{
    id: number;
    title: string;
    description?: string;
    dueDate?: string;
    status: string;
    priority: string;
    assignee?: string;
    phase: string;
  }>;
  dateRange?: { startDate: string; endDate: string } | null;
  generatedAt: string;
}

export interface DashboardStats {
  overview: {
    daysUntilWedding: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  phaseCompletion: Record<ChecklistPhase, { total: number; completed: number }>;
  budget: {
    totalBudget: number;
    totalSpent: number;
    budgetProgress: number;
    remaining: number;
  };
  payment: {
    totalContractAmount: number;
    totalPaidAmount: number;
    paymentProgress: number;
    remaining: number;
  };
  vendors: {
    total: number;
    confirmed: number;
  };
}
