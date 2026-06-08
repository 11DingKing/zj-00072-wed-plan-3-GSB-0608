<template>
  <div class="wedding-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>婚礼信息</span>
          <div class="header-actions">
            <el-button type="success" @click="handleExportReport" :loading="exporting">
              导出报告
            </el-button>
            <el-button type="primary" @click="handleEdit" :disabled="!canEdit">编辑</el-button>
          </div>
        </div>
      </template>
      <el-form :model="weddingForm" label-width="120px" class="wedding-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="新郎姓名">
              <el-input v-model="weddingForm.groomName" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="新娘姓名">
              <el-input v-model="weddingForm.brideName" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="婚礼日期">
              <el-date-picker
                v-model="weddingForm.weddingDate"
                type="date"
                style="width: 100%"
                :disabled="!isEditing"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="婚礼地点">
              <el-input v-model="weddingForm.location" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算总额">
              <el-input-number
                v-model="weddingForm.totalBudget"
                :min="0"
                style="width: 100%"
                :disabled="!isEditing"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="婚礼主题">
              <el-select v-model="weddingForm.theme" style="width: 100%" :disabled="!isEditing">
                <el-option label="中式" value="中式" />
                <el-option label="西式" value="西式" />
                <el-option label="户外" value="户外" />
                <el-option label="海岛" value="海岛" />
                <el-option label="极简" value="极简" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input
            v-model="weddingForm.description"
            type="textarea"
            :rows="4"
            :disabled="!isEditing"
          />
        </el-form-item>
      </el-form>
      <div v-if="isEditing" class="form-actions">
        <el-button @click="isEditing = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </div>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>婚礼文件</span>
      </template>
      <FileUpload
        :entityType="'wedding'"
        :currentUser="authStore.user"
      />
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>变更历史</span>
      </template>
      <ChangeLogPanel />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useWeddingStore, useAuthStore } from "@/store";
import type { Wedding, WeddingTheme } from "@/types";
import FileUpload from "@/components/FileUpload.vue";
import ChangeLogPanel from "@/components/ChangeLogPanel.vue";
import { reportAPI } from "@/api";

const weddingStore = useWeddingStore();
const authStore = useAuthStore();

const isEditing = ref(false);
const saving = ref(false);
const exporting = ref(false);

const weddingForm = reactive<Partial<Wedding>>({
  groomName: "",
  brideName: "",
  weddingDate: "",
  location: "",
  totalBudget: 0,
  theme: "西式" as WeddingTheme,
  description: "",
});

const canEdit = computed(() => {
  return authStore.isAdmin || authStore.isCouple;
});

const handleEdit = () => {
  isEditing.value = true;
};

const handleSave = async () => {
  try {
    saving.value = true;
    const formData = { ...weddingForm };
    if ((formData.weddingDate as unknown) instanceof Date) {
      formData.weddingDate = (formData.weddingDate as unknown as Date).toISOString().split("T")[0];
    }
    await weddingStore.updateWedding(formData);
    ElMessage.success("保存成功");
    isEditing.value = false;
  } catch (error) {
    console.error("保存婚礼信息失败:", error);
  } finally {
    saving.value = false;
  }
};

const handleExportReport = async () => {
  try {
    exporting.value = true;
    const response = await reportAPI.generateReport();
    console.log("报告数据:", response.data);
    ElMessage.success("报告生成成功，已输出到控制台");
  } catch (error) {
    ElMessage.error("生成报告失败");
  } finally {
    exporting.value = false;
  }
};

onMounted(async () => {
  const wedding = await weddingStore.fetchWedding();
  Object.assign(weddingForm, wedding);
});
</script>

<style scoped>
.wedding-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.wedding-form {
  max-width: 800px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>
