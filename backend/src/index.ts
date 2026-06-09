import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./config/database";
import { specs } from "./config/swagger";

import authRoutes from "./routes/auth.routes";
import weddingRoutes from "./routes/wedding.routes";
import checklistRoutes from "./routes/checklist.routes";
import vendorRoutes from "./routes/vendor.routes";
import budgetRoutes from "./routes/budget.routes";
import scheduleRoutes from "./routes/schedule.routes";
import statsRoutes from "./routes/stats.routes";
import commentRoutes from "./routes/comment.routes";
import fileRoutes from "./routes/file.routes";
import changelogRoutes from "./routes/changelog.routes";
import reportRoutes from "./routes/report.routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use("/api/auth", authRoutes);
app.use("/api/wedding", weddingRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/changelog", changelogRoutes);
app.use("/api/report", reportRoutes);

AppDataSource.initialize()
  .then(() => {
    console.log("数据库连接成功");
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`API 文档: http://localhost:${PORT}/api/docs`);
    });
  })
  .catch((error) => console.log("数据库连接失败:", error));
