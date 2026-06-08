<template>
  <div class="comment-section">
    <h4>评论 ({{ comments.length }})</h4>
    
    <div class="comment-input">
      <el-input
        v-model="newComment"
        type="textarea"
        :rows="2"
        placeholder="输入评论，使用 @username 提及用户"
        @keydown.enter.exact.prevent="submitComment"
      />
      <div class="mention-suggestions" v-if="showMentions">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="mention-item"
          @click="insertMention(user)"
        >
          @{{ user.name }}
        </div>
      </div>
      <el-button type="primary" @click="submitComment" :loading="submitting">
        发送
      </el-button>
    </div>

    <div class="comment-list">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-header">
          <el-avatar :size="32">{{ comment.author.name.charAt(0) }}</el-avatar>
          <div class="comment-info">
            <span class="comment-author">{{ comment.author.name }}</span>
            <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
          </div>
          <el-button
            v-if="canDelete(comment)"
            type="text"
            size="small"
            @click="deleteComment(comment.id)"
          >
            删除
          </el-button>
        </div>
        <div class="comment-content">
          {{ comment.content }}
        </div>
        <div v-if="comment.attachmentUrl" class="comment-attachment">
          <el-link :href="comment.attachmentUrl" target="_blank" type="primary">
            <el-icon><Document /></el-icon>
            查看附件
          </el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Document } from "@element-plus/icons-vue";
import { commentAPI } from "../api";
import type { Comment, User } from "../types";

const props = defineProps<{
  checklistId: number;
  currentUser: User | null;
  users?: User[];
}>();

const emit = defineEmits<{
  commentAdded: [];
}>();

const comments = ref<Comment[]>([]);
const newComment = ref("");
const submitting = ref(false);
const showMentions = ref(false);
const mentionQuery = ref("");

const filteredUsers = computed(() => {
  if (!props.users) return [];
  return props.users.filter((user) =>
    user.name.toLowerCase().includes(mentionQuery.value.toLowerCase())
  );
});

const loadComments = async () => {
  try {
    const response = await commentAPI.getComments(props.checklistId);
    comments.value = response.data;
  } catch (error) {
    ElMessage.error("加载评论失败");
  }
};

const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning("请输入评论内容");
    return;
  }

  submitting.value = true;
  try {
    await commentAPI.createComment(props.checklistId, {
      content: newComment.value.trim(),
    });
    newComment.value = "";
    ElMessage.success("评论发布成功");
    await loadComments();
    emit("commentAdded");
  } catch (error) {
    ElMessage.error("发布评论失败");
  } finally {
    submitting.value = false;
  }
};

const deleteComment = async (id: number) => {
  try {
    await commentAPI.deleteComment(id);
    ElMessage.success("删除成功");
    await loadComments();
  } catch (error) {
    ElMessage.error("删除失败");
  }
};

const canDelete = (comment: Comment) => {
  if (!props.currentUser) return false;
  return (
    props.currentUser.id === comment.author.id ||
    props.currentUser.role === "Admin"
  );
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

const insertMention = (user: User) => {
  const mentionText = `@${user.name} `;
  const lastAtIndex = newComment.value.lastIndexOf("@");
  if (lastAtIndex !== -1) {
    newComment.value =
      newComment.value.substring(0, lastAtIndex) + mentionText;
  }
  showMentions.value = false;
};

watch(newComment, (value) => {
  const lastAtIndex = value.lastIndexOf("@");
  if (lastAtIndex !== -1) {
    const afterAt = value.substring(lastAtIndex + 1);
    if (!afterAt.includes(" ")) {
      mentionQuery.value = afterAt;
      showMentions.value = true;
      return;
    }
  }
  showMentions.value = false;
});

watch(
  () => props.checklistId,
  () => {
    if (props.checklistId) {
      loadComments();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.comment-section {
  margin-top: 20px;
}

.comment-section h4 {
  margin-bottom: 15px;
  color: #303133;
}

.comment-input {
  position: relative;
  margin-bottom: 20px;
}

.comment-input .el-button {
  margin-top: 10px;
}

.mention-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.mention-item {
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mention-item:hover {
  background-color: #f5f7fa;
}

.comment-list {
  max-height: 400px;
  overflow-y: auto;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.comment-info {
  flex: 1;
  margin-left: 10px;
}

.comment-author {
  font-weight: 500;
  color: #303133;
  margin-right: 10px;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  margin-left: 42px;
  color: #606266;
  line-height: 1.6;
}

.comment-attachment {
  margin-left: 42px;
  margin-top: 10px;
}
</style>
