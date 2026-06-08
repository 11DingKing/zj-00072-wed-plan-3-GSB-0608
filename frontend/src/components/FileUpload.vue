<template>
  <div class="file-upload">
    <h4>附件 ({{ files.length }})</h4>
    
    <div class="upload-area">
      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileSelect"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
      >
        <el-button type="primary" :icon="Upload">
          上传文件
        </el-button>
      </el-upload>
      <span class="upload-tip">
        支持 PDF、Word、Excel、图片格式，最大 10MB
      </span>
    </div>

    <div class="file-list" v-if="files.length > 0">
      <div v-for="file in files" :key="file.id" class="file-item">
        <div class="file-icon">
          <el-icon :size="24">
            <component :is="getFileIcon(file.fileName)" />
          </el-icon>
        </div>
        <div class="file-info">
          <div class="file-name">{{ file.fileName }}</div>
          <div class="file-meta">
            <span>{{ formatFileSize(file.fileSize) }}</span>
            <span class="file-uploader">上传者: {{ file.uploadedBy.name }}</span>
            <span class="file-time">{{ formatTime(file.uploadedAt) }}</span>
          </div>
        </div>
        <div class="file-actions">
          <el-button
            type="text"
            size="small"
            @click="downloadFile(file)"
          >
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button
            v-if="canDelete(file)"
            type="text"
            size="small"
            @click="deleteFile(file.id)"
            style="color: #f56c6c"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </div>

    <el-empty v-else description="暂无附件" :image-size="100" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload, Download, Delete, Document, Picture, Files } from "@element-plus/icons-vue";
import { fileAPI } from "../api";
import type { FileAttachment, User, FileEntityType } from "../types";

const props = defineProps<{
  entityType: FileEntityType;
  entityId?: number;
  currentUser: User | null;
}>();

const emit = defineEmits<{
  fileUploaded: [];
}>();

const files = ref<FileAttachment[]>([]);

const loadFiles = async () => {
  try {
    const response = await fileAPI.getFiles(props.entityType, props.entityId);
    files.value = response.data;
  } catch (error) {
    ElMessage.error("加载文件失败");
  }
};

const handleFileSelect = async (uploadFile: any) => {
  const file = uploadFile.raw;
  
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error("文件大小不能超过 10MB");
    return;
  }

  try {
    await fileAPI.uploadFile(props.entityType, props.entityId, {
      fileName: file.name,
      fileUrl: `/uploads/${Date.now()}_${file.name}`,
      fileSize: file.size,
    });
    ElMessage.success("文件上传成功");
    await loadFiles();
    emit("fileUploaded");
  } catch (error) {
    ElMessage.error("文件上传失败");
  }
};

const deleteFile = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个文件吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    
    await fileAPI.deleteFile(id);
    ElMessage.success("删除成功");
    await loadFiles();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const downloadFile = (file: FileAttachment) => {
  ElMessage.info("下载功能演示 - 实际项目中需要配置文件服务器");
  window.open(file.fileUrl, "_blank");
};

const canDelete = (file: FileAttachment) => {
  if (!props.currentUser) return false;
  return (
    props.currentUser.id === file.uploadedBy.id ||
    props.currentUser.role === "Admin"
  );
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext || "")) {
    return Picture;
  }
  if (["pdf", "doc", "docx"].includes(ext || "")) {
    return Document;
  }
  return Files;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

watch(
  () => [props.entityType, props.entityId],
  () => {
    loadFiles();
  },
  { immediate: true }
);
</script>

<style scoped>
.file-upload {
  margin-top: 20px;
}

.file-upload h4 {
  margin-bottom: 15px;
  color: #303133;
}

.upload-area {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.file-list {
  max-height: 400px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f9fafc;
  border-radius: 6px;
  margin-bottom: 10px;
}

.file-icon {
  color: #409eff;
  margin-right: 12px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.file-actions {
  display: flex;
  gap: 5px;
}
</style>
