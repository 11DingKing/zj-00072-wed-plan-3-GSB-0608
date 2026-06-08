<template>
  <div class="budget-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>预算管理</span>
          <el-button type="primary" @click="handleAdd" :disabled="!canAdd">添加预算</el-button>
        </div>
      </template>
      <el-table :data="budgetStore.budgets" style="width: 100%">
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预算上限" width="150">
          <template #default="{ row }">
            ¥{{ formatMoney(row.budgetLimit) }}
          </template>
        </el-table-column>
        <el-table-column label="实际支出" width="150">
          <template #default="{ row }">
            <span :class="{ 'over-budget': isOverBudget(row) }">
              ¥{{ formatMoney(row.actualSpent) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="剩余预算" width="150">
          <template #default="{ row }">
            <span :class="{ 'negative': (row.budgetLimit - row.actualSpent) < 0 }">
              ¥{{ formatMoney(row.budgetLimit - row.actualSpent) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.actualSpent / row.budgetLimit) * 100)"
              :color="row.actualSpent / row.budgetLimit > 0.9 ? '#f56c6c' : '#67c23a'"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" :disabled="!isAdmin">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑预算' : '添加预算'" width="500px">
      <el-form :model="budgetForm" label-width="100px">
        <el-form-item label="分类">
          <el-select v-model="budgetForm.category" style="width: 100%">
            <el-option label="场地" value="场地" />
            <el-option label="婚庆" value="婚庆" />
            <el-option label="摄影" value="摄影" />
            <el-option label="摄像" value="摄像" />
            <el-option label="婚纱" value="婚纱" />
            <el-option label="化妆" value="化妆" />
            <el-option label="主持" value="主持" />
            <el-option label="婚车" value="婚车" />
            <el-option label="喜糖" value="喜糖" />
            <el-option label="请柬" value="请柬" />
            <el-option label="蜜月" value="蜜月" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算上限">
          <el-input-number v-model="budgetForm.budgetLimit" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="实际支出">
          <el-input-number v-model="budgetForm.actualSpent" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="budgetForm.notes" type="textarea" :rows="3" />
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
import { useBudgetStore, useAuthStore } from "@/store";
import type { Budget, BudgetCategory } from "@/types";

const budgetStore = useBudgetStore();
const authStore = useAuthStore();

const dialogVisible = ref(false);
const isEditMode = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);

const budgetForm = reactive({
  category: "其他" as BudgetCategory,
  budgetLimit: 0,
  actualSpent: 0,
  notes: "",
});

const canAdd = computed(() => {
  return authStore.isAdmin || authStore.isCouple;
});

const isAdmin = computed(() => authStore.isAdmin);

const formatMoney = (value?: number) => {
  if (!value) return "0";
  return value.toLocaleString("zh-CN");
};

const isOverBudget = (row: Budget) => {
  return row.actualSpent > row.budgetLimit;
};

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  Object.assign(budgetForm, {
    category: "其他" as BudgetCategory,
    budgetLimit: 0,
    actualSpent: 0,
    notes: "",
  });
  dialogVisible.value = true;
};

const handleEdit = (row: Budget) => {
  isEditMode.value = true;
  editingId.value = row.id;
  Object.assign(budgetForm, {
    category: row.category,
    budgetLimit: row.budgetLimit,
    actualSpent: row.actualSpent,
    notes: row.notes,
  });
  dialogVisible.value = true;
};

const handleDelete = async (row: Budget) => {
  try {
    await ElMessageBox.confirm("确定要删除这个预算项吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await budgetStore.deleteBudget(row.id);
    ElMessage.success("删除成功");
  } catch (error) {
    // 用户取消
  }
};

const handleSave = async () => {
  if (!budgetForm.category) {
    ElMessage.warning("请选择分类");
    return;
  }
  if (budgetForm.budgetLimit <= 0) {
    ElMessage.warning("预算上限必须大于0");
    return;
  }

  try {
    saving.value = true;
    if (isEditMode.value && editingId.value) {
      await budgetStore.updateBudget(editingId.value, budgetForm);
      ElMessage.success("更新成功");
    } else {
      await budgetStore.createBudget(budgetForm);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await budgetStore.fetchBudgets();
});
</script>

<style scoped>
.budget-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}

.over-budget {
  color: #f56c6c;
  font-weight: bold;
}

.negative {
  color: #f56c6c;
  font-weight: bold;
}
</style>
