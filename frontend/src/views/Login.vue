<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h1>💒 婚礼筹备管理系统</h1>
          <p>Wedding Planner</p>
        </div>
      </template>
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading"
            >登 录</el-button
          >
        </el-form-item>
      </el-form>
      <div class="login-tips">
        <p>测试账号：</p>
        <p>策划师: admin / admin123456</p>
        <p>新郎: groom1 / groom123456</p>
        <p>新娘: bride1 / bride123456</p>
        <p>伴郎: assistant1 / assistant123456</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/store";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const loginForm = reactive({
  username: "",
  password: "",
});

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning("请输入用户名和密码");
    return;
  }

  try {
    loading.value = true;
    await authStore.login(loginForm.username, loginForm.password);
    ElMessage.success("登录成功");
    router.push("/");
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || "登录失败");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 450px;
}

.card-header {
  text-align: center;
}

.card-header h1 {
  margin-bottom: 8px;
  color: #333;
}

.card-header p {
  color: #666;
  font-size: 14px;
}

.login-btn {
  width: 100%;
}

.login-tips {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #999;
}

.login-tips p {
  margin: 4px 0;
}
</style>
