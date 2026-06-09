<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <h2>💒 婚礼筹备</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/wedding">
          <el-icon><House /></el-icon>
          <span>婚礼信息</span>
        </el-menu-item>
        <el-menu-item index="/checklist">
          <el-icon><List /></el-icon>
          <span>筹备清单</span>
        </el-menu-item>
        <el-menu-item index="/my-tasks">
          <el-icon><Document /></el-icon>
          <span>我的任务</span>
        </el-menu-item>
        <el-menu-item index="/vendors">
          <el-icon><ShoppingCart /></el-icon>
          <span>供应商管理</span>
        </el-menu-item>
        <el-menu-item index="/budget">
          <el-icon><Money /></el-icon>
          <span>预算管理</span>
        </el-menu-item>
        <el-menu-item index="/stats">
          <el-icon><TrendCharts /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="/schedule">
          <el-icon><Clock /></el-icon>
          <span>当天日程</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h3 v-if="weddingStore.wedding">
            {{ weddingStore.wedding.groomName }} &
            {{ weddingStore.wedding.brideName }} 的婚礼
          </h3>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ authStore.user?.name }} ({{ roleText }})
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore, useWeddingStore } from "@/store";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const weddingStore = useWeddingStore();

const activeMenu = computed(() => route.path);

const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    Admin: "策划师",
    Couple: "新人",
    Assistant: "伴郎/伴娘",
  };
  return roleMap[authStore.user?.role || ""] || "";
});

const handleCommand = (command: string) => {
  if (command === "logout") {
    authStore.logout();
    router.push("/login");
  }
};

onMounted(async () => {
  if (authStore.user?.weddingId) {
    await weddingStore.fetchWedding();
  }
});
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow: hidden;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  border-bottom: 1px solid #1f2d3d;
}

.logo h2 {
  font-size: 18px;
}

.menu {
  border-right: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-left h3 {
  color: #333;
  font-size: 18px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #666;
}

.main {
  background-color: #f0f2f5;
  overflow-y: auto;
}
</style>
