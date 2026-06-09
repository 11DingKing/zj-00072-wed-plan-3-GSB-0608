import { defineStore } from "pinia";
import {
  User,
  Wedding,
  Checklist,
  VendorBooking,
  Budget,
  DashboardStats,
  ScheduleEvent,
} from "@/types";
import {
  authAPI,
  weddingAPI,
  checklistAPI,
  vendorAPI,
  budgetAPI,
  statsAPI,
  scheduleAPI,
} from "@/api";

interface AuthState {
  token: string | null;
  user: User | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: localStorage.getItem("token"),
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }),
  actions: {
    async login(username: string, password: string) {
      const response = await authAPI.login({ username, password });
      this.token = response.data.token;
      this.user = response.data.user;
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    async fetchCurrentUser() {
      const response = await authAPI.getCurrentUser();
      this.user = response.data;
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role,
    isAdmin: (state) => state.user?.role === "Admin",
    isCouple: (state) => state.user?.role === "Couple",
    isAssistant: (state) => state.user?.role === "Assistant",
  },
});

interface WeddingState {
  wedding: Wedding | null;
}

export const useWeddingStore = defineStore("wedding", {
  state: (): WeddingState => ({
    wedding: null,
  }),
  actions: {
    async fetchWedding() {
      const response = await weddingAPI.getWedding();
      this.wedding = response.data;
      return response.data;
    },
    async updateWedding(data: Partial<Wedding>) {
      const response = await weddingAPI.updateWedding(data);
      this.wedding = response.data;
      return response.data;
    },
  },
});

interface ChecklistState {
  checklists: Checklist[];
  myTasks: Checklist[];
}

export const useChecklistStore = defineStore("checklist", {
  state: (): ChecklistState => ({
    checklists: [],
    myTasks: [],
  }),
  actions: {
    async fetchChecklists() {
      const response = await checklistAPI.getChecklists();
      this.checklists = response.data;
      return response.data;
    },
    async fetchMyTasks() {
      const response = await checklistAPI.getMyTasks();
      this.myTasks = response.data;
      return response.data;
    },
    async createChecklist(data: any) {
      const response = await checklistAPI.createChecklist(data);
      this.checklists.push(response.data);
      return response.data;
    },
    async updateChecklist(id: number, data: any) {
      const response = await checklistAPI.updateChecklist(id, data);
      const index = this.checklists.findIndex((c) => c.id === id);
      if (index !== -1) {
        this.checklists[index] = response.data;
      }
      return response.data;
    },
    async deleteChecklist(id: number) {
      await checklistAPI.deleteChecklist(id);
      this.checklists = this.checklists.filter((c) => c.id !== id);
    },
  },
  getters: {
    tasksByPhase: (state) => {
      const groups: Record<string, Checklist[]> = {
        婚前12个月: [],
        婚前6个月: [],
        婚前3个月: [],
        婚前1个月: [],
        婚前1周: [],
        婚礼当天: [],
      };
      state.checklists.forEach((task) => {
        groups[task.phase].push(task);
      });
      return groups;
    },
  },
});

interface VendorState {
  vendors: VendorBooking[];
}

export const useVendorStore = defineStore("vendor", {
  state: (): VendorState => ({
    vendors: [],
  }),
  actions: {
    async fetchVendors() {
      const response = await vendorAPI.getVendors();
      this.vendors = response.data;
      return response.data;
    },
    async createVendor(data: any) {
      const response = await vendorAPI.createVendor(data);
      this.vendors.push(response.data);
      return response.data;
    },
    async updateVendor(id: number, data: any) {
      const response = await vendorAPI.updateVendor(id, data);
      const index = this.vendors.findIndex((v) => v.id === id);
      if (index !== -1) {
        this.vendors[index] = response.data;
      }
      return response.data;
    },
    async deleteVendor(id: number) {
      await vendorAPI.deleteVendor(id);
      this.vendors = this.vendors.filter((v) => v.id !== id);
    },
  },
});

interface BudgetState {
  budgets: Budget[];
}

export const useBudgetStore = defineStore("budget", {
  state: (): BudgetState => ({
    budgets: [],
  }),
  actions: {
    async fetchBudgets() {
      const response = await budgetAPI.getBudgets();
      this.budgets = response.data;
      return response.data;
    },
    async createBudget(data: any) {
      const response = await budgetAPI.createBudget(data);
      this.budgets.push(response.data);
      return response.data;
    },
    async updateBudget(id: number, data: any) {
      const response = await budgetAPI.updateBudget(id, data);
      const index = this.budgets.findIndex((b) => b.id === id);
      if (index !== -1) {
        this.budgets[index] = response.data;
      }
      return response.data;
    },
    async deleteBudget(id: number) {
      await budgetAPI.deleteBudget(id);
      this.budgets = this.budgets.filter((b) => b.id !== id);
    },
  },
});

interface StatsState {
  dashboard: DashboardStats | null;
}

export const useStatsStore = defineStore("stats", {
  state: (): StatsState => ({
    dashboard: null,
  }),
  actions: {
    async fetchDashboardStats() {
      const response = await statsAPI.getDashboardStats();
      this.dashboard = response.data;
      return response.data;
    },
  },
});

interface ScheduleState {
  events: ScheduleEvent[];
}

export const useScheduleStore = defineStore("schedule", {
  state: (): ScheduleState => ({
    events: [],
  }),
  actions: {
    async fetchEvents() {
      const response = await scheduleAPI.getEvents();
      this.events = response.data;
      return response.data;
    },
    async createEvent(data: any) {
      const response = await scheduleAPI.createEvent(data);
      this.events.push(response.data);
      this.events.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      return response.data;
    },
    async updateEvent(id: number, data: any) {
      const response = await scheduleAPI.updateEvent(id, data);
      const index = this.events.findIndex((e) => e.id === id);
      if (index !== -1) {
        this.events[index] = response.data;
      }
      this.events.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      return response.data;
    },
    async deleteEvent(id: number) {
      await scheduleAPI.deleteEvent(id);
      this.events = this.events.filter((e) => e.id !== id);
    },
  },
});
