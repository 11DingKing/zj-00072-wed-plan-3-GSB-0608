<template>
  <div class="schedule-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>婚礼当天日程时间线</span>
          <el-button type="primary" @click="handleAdd" :disabled="!canAdd">添加日程</el-button>
        </div>
      </template>

      <div v-if="scheduleStore.events.length === 0" class="empty-state">
        <el-empty description="暂无日程安排，请点击上方按钮添加">
          <el-button type="primary" @click="handleAdd" :disabled="!canAdd">添加日程</el-button>
        </el-empty>
      </div>

      <el-timeline v-else>
        <el-timeline-item
          v-for="event in scheduleStore.events"
          :key="event.id"
          :timestamp="formatTime(event.startTime)"
          placement="top"
          :type="getEventType(event.type)"
        >
          <el-card class="event-card" shadow="hover">
            <div class="event-header">
              <h4 class="event-title">
                <el-tag :type="getEventType(event.type)" size="small" class="event-type-tag">
                  {{ event.type }}
                </el-tag>
                {{ event.title }}
              </h4>
              <div class="event-actions">
                <el-button size="small" text @click="handleEdit(event)">编辑</el-button>
                <el-button size="small" text type="danger" @click="handleDelete(event)" :disabled="!isAdmin">删除</el-button>
              </div>
            </div>
            <div class="event-time">
              <el-icon><Clock /></el-icon>
              <span>{{ formatTimeRange(event.startTime, event.endTime) }}</span>
            </div>
            <div v-if="event.location" class="event-detail">
              <el-icon><Location /></el-icon>
              <span>{{ event.location }}</span>
            </div>
            <div v-if="event.responsiblePerson" class="event-detail">
              <el-icon><User /></el-icon>
              <span>负责人：{{ event.responsiblePerson }}</span>
            </div>
            <div v-if="event.description" class="event-description">
              {{ event.description }}
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑日程' : '添加日程'" width="500px">
      <el-form :model="eventForm" label-width="100px">
        <el-form-item label="日程标题">
          <el-input v-model="eventForm.title" placeholder="请输入日程标题" />
        </el-form-item>
        <el-form-item label="日程类型">
          <el-select v-model="eventForm.type" style="width: 100%">
            <el-option v-for="type in eventTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="eventForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="eventForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="eventForm.location" placeholder="请输入地点" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="eventForm.responsiblePerson" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="eventForm.description" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { reactive, ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Clock, Location, User } from "@element-plus/icons-vue";
import { useScheduleStore, useAuthStore } from "@/store";
import type { ScheduleEvent, ScheduleEventType } from "@/types";

const scheduleStore = useScheduleStore();
const authStore = useAuthStore();

const eventTypes: ScheduleEventType[] = ["仪式", "迎亲", "敬酒", "迎宾", "合影", "晚宴", "其他"];

const dialogVisible = ref(false);
const isEditMode = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);

const eventForm = reactive({
  title: "",
  type: "其他" as ScheduleEventType,
  startTime: "",
  endTime: "",
  location: "",
  responsiblePerson: "",
  description: "",
});

const canAdd = computed(() => {
  return authStore.isAdmin || authStore.isCouple;
});

const isAdmin = computed(() => authStore.isAdmin);

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTimeRange = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startTime = startDate.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = endDate.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${startTime} - ${endTime}`;
};

const getEventType = (type: ScheduleEventType) => {
  const map: Record<ScheduleEventType, string> = {
    仪式: "primary",
    迎亲: "success",
    敬酒: "warning",
    迎宾: "info",
    合影: "success",
    晚宴: "danger",
    其他: "info",
  };
  return map[type] || "info";
};

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  Object.assign(eventForm, {
    title: "",
    type: "其他" as ScheduleEventType,
    startTime: "",
    endTime: "",
    location: "",
    responsiblePerson: "",
    description: "",
  });
  dialogVisible.value = true;
};

const handleEdit = (event: ScheduleEvent) => {
  isEditMode.value = true;
  editingId.value = event.id;
  Object.assign(eventForm, {
    title: event.title,
    type: event.type,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location || "",
    responsiblePerson: event.responsiblePerson || "",
    description: event.description || "",
  });
  dialogVisible.value = true;
};

const handleDelete = async (event: ScheduleEvent) => {
  try {
    await ElMessageBox.confirm("确定要删除这个日程吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await scheduleStore.deleteScheduleEvent(event.id);
    ElMessage.success("删除成功");
  } catch (error) {
    // 用户取消
  }
};

const handleSave = async () => {
  if (!eventForm.title) {
    ElMessage.warning("请输入日程标题");
    return;
  }
  if (!eventForm.startTime || !eventForm.endTime) {
    ElMessage.warning("请选择开始时间和结束时间");
    return;
  }
  if (new Date(eventForm.endTime) <= new Date(eventForm.startTime)) {
    ElMessage.warning("结束时间必须晚于开始时间");
    return;
  }

  try {
    saving.value = true;
    if (isEditMode.value && editingId.value) {
      await scheduleStore.updateScheduleEvent(editingId.value, eventForm);
      ElMessage.success("更新成功");
    } else {
      await scheduleStore.createScheduleEvent(eventForm);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
  } catch (error: any) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error("保存失败");
    }
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await scheduleStore.fetchScheduleEvents();
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
  margin-bottom: 8px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.event-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-type-tag {
  margin-right: 0;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.event-time,
.event-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.event-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}
</style>
