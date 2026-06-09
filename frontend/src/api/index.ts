import axios from "axios";
import { ElMessage } from "element-plus";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      "API Request:",
      config.method?.toUpperCase(),
      config.url,
      config.data,
    );
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("Response Error:", error);
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      ElMessage.error("登录已过期，请重新登录");
    } else if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message);
    } else if (error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error("请求失败，请稍后重试");
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post("/auth/login", data),
  getCurrentUser: () => api.get("/auth/me"),
};

export const weddingAPI = {
  getWedding: () => api.get("/wedding"),
  updateWedding: (data: any) => api.put("/wedding", data),
};

export const checklistAPI = {
  getChecklists: () => api.get("/checklist"),
  getMyTasks: () => api.get("/checklist/my-tasks"),
  createChecklist: (data: any) => api.post("/checklist", data),
  updateChecklist: (id: number, data: any) => api.put(`/checklist/${id}`, data),
  deleteChecklist: (id: number) => api.delete(`/checklist/${id}`),
};

export const vendorAPI = {
  getVendors: () => api.get("/vendor"),
  createVendor: (data: any) => api.post("/vendor", data),
  updateVendor: (id: number, data: any) => api.put(`/vendor/${id}`, data),
  deleteVendor: (id: number) => api.delete(`/vendor/${id}`),
};

export const budgetAPI = {
  getBudgets: () => api.get("/budget"),
  createBudget: (data: any) => api.post("/budget", data),
  updateBudget: (id: number, data: any) => api.put(`/budget/${id}`, data),
  deleteBudget: (id: number) => api.delete(`/budget/${id}`),
};

export const statsAPI = {
  getDashboardStats: () => api.get("/stats/dashboard"),
};

export const commentAPI = {
  getComments: (checklistId: number) => api.get(`/comments/${checklistId}`),
  createComment: (checklistId: number, data: any) =>
    api.post(`/comments/${checklistId}`, data),
  deleteComment: (id: number) => api.delete(`/comments/${id}`),
};

export const fileAPI = {
  getFiles: (entityType: string, entityId?: number) =>
    entityId
      ? api.get(`/files/${entityType}/${entityId}`)
      : api.get(`/files/${entityType}`),
  uploadFile: (entityType: string, entityId: number | undefined, data: any) =>
    entityId
      ? api.post(`/files/${entityType}/${entityId}`, data)
      : api.post(`/files/${entityType}`, data),
  deleteFile: (id: number) => api.delete(`/files/${id}`),
};

export const changelogAPI = {
  getChangeLogs: (entityType?: string, entityId?: number) =>
    entityType && entityId
      ? api.get(`/changelog/${entityType}/${entityId}`)
      : entityType
        ? api.get(`/changelog/${entityType}`)
        : api.get("/changelog"),
};

export const reportAPI = {
  generateReport: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const query = params.toString();
    return api.get(`/report${query ? `?${query}` : ""}`);
  },
};

export const scheduleAPI = {
  getScheduleEvents: () => api.get("/schedule"),
  createScheduleEvent: (data: any) => api.post("/schedule", data),
  updateScheduleEvent: (id: number, data: any) =>
    api.put(`/schedule/${id}`, data),
  deleteScheduleEvent: (id: number) => api.delete(`/schedule/${id}`),
};

export default api;
