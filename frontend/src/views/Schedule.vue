<template>
  <div class="schedule-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>当天日程时间线</span>
          <el-button type="primary" @click="handleAdd" :disabled="!canAdd">
            添加日程
          </el-button>
        </div>
      </template>

      <div v-if="sortedEvents.length === 0" class="empty-state">
        <el-empty description="暂无日程安排，点击右上角添加第一条日程" />
      </div>

      <el-timeline v-else>
        <el-timeline-item
          v-for="ev in sortedEvents"
          :key="ev.id"
          :timestamp="formatTimeRange(ev.startTime, ev.endTime)"
          :type="getTypeColor(ev.type)"
          placement="top"
          size="large"
        >
          <el-card shadow="hover" class="event-card">
            <div class="event-header">
              <div class="event-title-row">
                <el-tag :type="getTypeColor(ev.type)" size="small" class="type-tag">
                  {{ ev.type }}
                </el-tag>
                <span class="event-title">{{ ev.title }}</span>
              </div>
              <div class="event-actions" v-if="canEdit">
                <el-button size="small" text type="primary" @click="handleEdit(ev)">编辑</el-button>
                <el-button size="small" text type="danger" @click="handleDelete(ev)" v-if="isAdmin">删除</el-button>
              </div>
            </div>
            <div class="event-body">
              <div class="event-meta" v-if="ev.location">
                <el-icon><Location /></el-icon>
                <span>{{ ev.location }}</span>
              </div>
              <div class="event-meta" v-if="ev.personInCharge">
                <el-icon><User /></el-icon>
                <span>负责人：{{ ev.personInCharge }}</span>
              </div>
              <div class="event-meta" v-if="ev.createdBy">
                <el-icon><Clock /></el-icon>
                <span>由 {{ ev.createdBy.name }} 创建</span>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑日程' : '添加日程'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="eventForm" label-width="90px" :rules="formRules" ref="formRef">
        <el-form-item label="日程标题" prop="title">
          <el-input v-model="eventForm.title" placeholder="如：迎亲仪式、酒店签到等" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="eventForm.type" style="width: 100%">
            <el-option v-for="t in eventTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="eventForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="eventForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="eventForm.location" placeholder="活动地点" />
        </el-form-item>
        <el-form-item label="负责人" prop="personInCharge">
          <el-input v-model="eventForm.personInCharge" placeholder="负责此项安排的人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox, FormInstance, FormRules } from "element-plus";
import { Location, User, Clock } from "@element-plus/icons-vue";
import { useScheduleStore, useAuthStore } from "@/store";
import type { ScheduleEvent, ScheduleEventType } from "@/types";

const scheduleStore = useScheduleStore();
const authStore = useAuthStore();

const eventTypes: ScheduleEventType[] = ["化妆", "接亲", "仪式", "拍照", "宴客", "敬酒", "其他"];

const dialogVisible = ref(false);
const isEditMode = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const eventForm = reactive({
  title: "",
  type: "其他" as ScheduleEventType,
  startTime: "",
  endTime: "",
  location: "",
  personInCharge: "",
});

const formRules: FormRules = {
  title: [{ required: true, message: "请输入日程标题", trigger: "blur" }],
  startTime: [{ required: true, message: "请选择开始时间", trigger: "change" }],
  endTime: [{ required: true, message: "请选择结束时间", trigger: "change" }],
};

const sortedEvents = computed(() => {
  return [...scheduleStore.events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
});

const canAdd = computed(() => authStore.isAdmin || authStore.isCouple);
const canEdit = computed(() => authStore.isAdmin || authStore.isCouple);
const isAdmin = computed(() => authStore.isAdmin);

const getTypeColor = (type: ScheduleEventType): "primary" | "success" | "warning" | "danger" | "info" => {
  const map: Record<ScheduleEventType, "primary" | "success" | "warning" | "danger" | "info"> = {
    化妆: "info",
    接亲: "danger",
    仪式: "warning",
    拍照: "success",
    宴客: "primary",
    敬酒: "warning",
    其他: "info",
  };
  return map[type] || "info";
};

const pad = (n: number) => n.toString().padStart(2, "0");

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatTimeRange = (start: string, end: string) => {
  return `${formatDateTime(start)} ~ ${formatDateTime(end)}`;
};

const resetForm = () => {
  eventForm.title = "";
  eventForm.type = "其他";
  eventForm.startTime = "";
  eventForm.endTime = "";
  eventForm.location = "";
  eventForm.personInCharge = "";
};

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (ev: ScheduleEvent) => {
  isEditMode.value = true;
  editingId.value = ev.id;
  eventForm.title = ev.title;
  eventForm.type = ev.type;
  eventForm.startTime = ev.startTime;
  eventForm.endTime = ev.endTime;
  eventForm.location = ev.location || "";
  eventForm.personInCharge = ev.personInCharge || "";
  dialogVisible.value = true;
};

const handleDelete = async (ev: ScheduleEvent) => {
  try {
    await ElMessageBox.confirm(`确定要删除日程「${ev.title}」吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await scheduleStore.deleteEvent(ev.id);
    ElMessage.success("删除成功");
  } catch {
    // 用户取消
  }
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    if (new Date(eventForm.endTime) <= new Date(eventForm.startTime)) {
      ElMessage.error("结束时间必须晚于开始时间");
      return;
    }

    try {
      saving.value = true;
      const payload = { ...eventForm };
      if (isEditMode.value && editingId.value) {
        await scheduleStore.updateEvent(editingId.value, payload);
        ElMessage.success("更新成功");
      } else {
        await scheduleStore.createEvent(payload);
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
    } catch {
      // API 拦截器已提示错误
    } finally {
      saving.value = false;
    }
  });
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

.empty-state {
  padding: 40px 0;
}

.event-card {
  margin-bottom: 0;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.event-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.type-tag {
  flex-shrink: 0;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.event-actions {
  flex-shrink: 0;
}

.event-body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

:deep(.el-timeline-item__timestamp) {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}
</style>
