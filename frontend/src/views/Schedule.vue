<template>
  <div class="schedule-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>当天日程时间线</span>
          <el-button type="primary" @click="handleAdd" :disabled="!canEdit">
            新增日程
          </el-button>
        </div>
      </template>

      <div v-if="scheduleStore.events.length === 0" class="empty">
        <el-empty description="暂无日程，点击右上角「新增日程」开始安排" />
      </div>

      <el-timeline v-else>
        <el-timeline-item
          v-for="event in scheduleStore.events"
          :key="event.id"
          :timestamp="formatRange(event.startTime, event.endTime)"
          :type="getTimelineType(event.eventType)"
          placement="top"
        >
          <el-card shadow="hover" class="event-card">
            <div class="event-header">
              <div class="event-title">
                <el-tag :type="getTagType(event.eventType)" size="small">
                  {{ event.eventType }}
                </el-tag>
                <span class="title-text">{{ event.title }}</span>
              </div>
              <div class="event-actions">
                <el-button size="small" @click="handleEdit(event)" :disabled="!canEdit">
                  编辑
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(event)"
                  :disabled="!isAdmin"
                >
                  删除
                </el-button>
              </div>
            </div>
            <div class="event-meta">
              <span><el-icon><LocationFilled /></el-icon> {{ event.location }}</span>
              <span v-if="event.responsible">
                <el-icon><UserFilled /></el-icon> {{ event.responsible.name }}
              </span>
            </div>
            <div v-if="event.notes" class="event-notes">
              {{ event.notes }}
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑日程' : '新增日程'"
      width="560px"
    >
      <el-form :model="eventForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="eventForm.title" placeholder="例如：迎宾仪式" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="eventForm.eventType" style="width: 100%">
            <el-option
              v-for="t in eventTypes"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="地点" required>
          <el-input v-model="eventForm.location" placeholder="例如：宴会厅入口" />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="eventForm.startTime"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
            placeholder="选择开始时间"
          />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker
            v-model="eventForm.endTime"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
            placeholder="选择结束时间"
          />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="eventForm.responsibleName" disabled placeholder="可选，由策划师后台分配" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="eventForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { LocationFilled, UserFilled } from "@element-plus/icons-vue";
import { useScheduleStore, useAuthStore } from "@/store";
import type { ScheduleEvent, ScheduleEventType } from "@/types";

const scheduleStore = useScheduleStore();
const authStore = useAuthStore();

const eventTypes: ScheduleEventType[] = [
  "迎宾",
  "仪式",
  "宴会",
  "敬酒",
  "送客",
  "彩排",
  "化妆",
  "拍摄",
  "其他",
];

const dialogVisible = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);

const eventForm = reactive({
  title: "",
  location: "",
  startTime: "" as string,
  endTime: "" as string,
  eventType: "其他" as ScheduleEventType,
  notes: "",
  responsibleName: "",
});

const canEdit = computed(() => authStore.isAdmin || authStore.isCouple);
const isAdmin = computed(() => authStore.isAdmin);

const pad = (n: number) => String(n).padStart(2, "0");
const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};
const formatRange = (start: string, end: string) =>
  `${formatTime(start)} → ${formatTime(end)}`;

const tagTypeMap: Record<ScheduleEventType, string> = {
  迎宾: "info",
  仪式: "danger",
  宴会: "warning",
  敬酒: "warning",
  送客: "info",
  彩排: "primary",
  化妆: "success",
  拍摄: "primary",
  其他: "info",
};
const getTagType = (t: ScheduleEventType) => tagTypeMap[t] || "info";
const getTimelineType = (t: ScheduleEventType) => {
  const map: Record<ScheduleEventType, string> = {
    迎宾: "info",
    仪式: "danger",
    宴会: "warning",
    敬酒: "warning",
    送客: "info",
    彩排: "primary",
    化妆: "success",
    拍摄: "primary",
    其他: "",
  };
  return map[t] || "";
};

const resetForm = () => {
  eventForm.title = "";
  eventForm.location = "";
  eventForm.startTime = "";
  eventForm.endTime = "";
  eventForm.eventType = "其他";
  eventForm.notes = "";
  eventForm.responsibleName = "";
};

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (event: ScheduleEvent) => {
  isEditMode.value = true;
  editingId.value = event.id;
  eventForm.title = event.title;
  eventForm.location = event.location;
  eventForm.startTime = new Date(event.startTime).toISOString().slice(0, 19);
  eventForm.endTime = new Date(event.endTime).toISOString().slice(0, 19);
  eventForm.eventType = event.eventType;
  eventForm.notes = event.notes || "";
  eventForm.responsibleName = event.responsible?.name || "";
  dialogVisible.value = true;
};

const handleDelete = async (event: ScheduleEvent) => {
  try {
    await ElMessageBox.confirm(`确定要删除日程「${event.title}」吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await scheduleStore.deleteEvent(event.id);
    ElMessage.success("删除成功");
  } catch (error) {
    // 用户取消
  }
};

const handleSave = async () => {
  if (!eventForm.title || !eventForm.location) {
    ElMessage.warning("请填写标题和地点");
    return;
  }
  if (!eventForm.startTime || !eventForm.endTime) {
    ElMessage.warning("请选择开始和结束时间");
    return;
  }
  if (new Date(eventForm.endTime) <= new Date(eventForm.startTime)) {
    ElMessage.warning("结束时间必须晚于开始时间");
    return;
  }

  const payload = {
    title: eventForm.title,
    location: eventForm.location,
    startTime: eventForm.startTime,
    endTime: eventForm.endTime,
    eventType: eventForm.eventType,
    notes: eventForm.notes,
  };

  try {
    saving.value = true;
    if (isEditMode.value && editingId.value) {
      await scheduleStore.updateEvent(editingId.value, payload);
      ElMessage.success("更新成功");
    } else {
      await scheduleStore.createEvent(payload);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
  } catch (error: any) {
    // 错误消息已被 axios 拦截器统一提示，这里无需重复
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await scheduleStore.fetchEvents();
});
</script>

<style scoped>
.schedule-page {
  padding: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}
.empty {
  padding: 40px 0;
}
.event-card {
  margin-bottom: 4px;
}
.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.event-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.event-meta {
  display: flex;
  gap: 18px;
  color: #666;
  font-size: 14px;
}
.event-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.event-notes {
  margin-top: 8px;
  color: #888;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
