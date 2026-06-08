<template>
  <div class="vendors-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>供应商管理</span>
          <el-button type="primary" @click="handleAdd" :disabled="!canAdd">添加供应商</el-button>
        </div>
      </template>
      <el-table :data="vendorStore.vendors" style="width: 100%">
        <el-table-column prop="name" label="供应商名称" min-width="200" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="合同金额" width="120">
          <template #default="{ row }">
            ¥{{ formatMoney(row.contractAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="已付金额" width="120">
          <template #default="{ row }">
            ¥{{ formatMoney(row.paidAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentStatus" label="付款状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getPaymentStatusType(row.paymentStatus)">{{ row.paymentStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isConfirmed" label="档期确认" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isConfirmed ? 'success' : 'info'">
              {{ row.isConfirmed ? '已确认' : '待确认' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button size="small" @click="handleDetail(row)">详情</el-button>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" :disabled="!isAdmin">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑供应商' : '添加供应商'" width="600px">
      <el-form :model="vendorForm" label-width="100px">
        <el-form-item label="供应商名称">
          <el-input v-model="vendorForm.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="vendorForm.type" style="width: 100%">
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
        <el-form-item label="联系人">
          <el-input v-model="vendorForm.contactPerson" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="vendorForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="vendorForm.email" />
        </el-form-item>
        <el-form-item label="合同金额">
          <el-input-number v-model="vendorForm.contractAmount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="已付金额">
          <el-input-number v-model="vendorForm.paidAmount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="付款状态">
          <el-select v-model="vendorForm.paymentStatus" style="width: 100%">
            <el-option label="未付" value="未付" />
            <el-option label="定金已付" value="定金已付" />
            <el-option label="尾款已付" value="尾款已付" />
            <el-option label="全额付清" value="全额付清" />
          </el-select>
        </el-form-item>
        <el-form-item label="档期确认">
          <el-switch v-model="vendorForm.isConfirmed" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="vendorForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" :title="selectedVendor?.name || '供应商详情'" width="800px">
      <el-descriptions :column="2" border v-if="selectedVendor">
        <el-descriptions-item label="供应商名称">{{ selectedVendor.name }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag size="small">{{ selectedVendor.type }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ selectedVendor.contactPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ selectedVendor.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ selectedVendor.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同金额">¥{{ formatMoney(selectedVendor.contractAmount) }}</el-descriptions-item>
        <el-descriptions-item label="已付金额">¥{{ formatMoney(selectedVendor.paidAmount) }}</el-descriptions-item>
        <el-descriptions-item label="付款状态">
          <el-tag :type="getPaymentStatusType(selectedVendor.paymentStatus)">{{ selectedVendor.paymentStatus }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="档期确认">
          <el-tag :type="selectedVendor.isConfirmed ? 'success' : 'info'">
            {{ selectedVendor.isConfirmed ? '已确认' : '待确认' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ selectedVendor.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ selectedVendor.notes || '-' }}</el-descriptions-item>
      </el-descriptions>

      <FileUpload
        v-if="selectedVendor"
        :entityType="'vendor'"
        :entityId="selectedVendor.id"
        :currentUser="authStore.user"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useVendorStore, useAuthStore } from "@/store";
import type { VendorBooking, VendorType, PaymentStatus } from "@/types";
import FileUpload from "@/components/FileUpload.vue";

const vendorStore = useVendorStore();
const authStore = useAuthStore();

const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const isEditMode = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const selectedVendor = ref<VendorBooking | null>(null);

const vendorForm = reactive({
  name: "",
  type: "其他" as VendorType,
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  contractAmount: 0,
  paidAmount: 0,
  paymentStatus: "未付" as PaymentStatus,
  isConfirmed: false,
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

const getPaymentStatusType = (status: PaymentStatus) => {
  const map: Record<PaymentStatus, string> = {
    未付: "info",
    定金已付: "warning",
    尾款已付: "warning",
    全额付清: "success",
  };
  return map[status] || "info";
};

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  Object.assign(vendorForm, {
    name: "",
    type: "其他" as VendorType,
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    contractAmount: 0,
    paidAmount: 0,
    paymentStatus: "未付" as PaymentStatus,
    isConfirmed: false,
    notes: "",
  });
  dialogVisible.value = true;
};

const handleDetail = (row: VendorBooking) => {
  selectedVendor.value = row;
  detailDialogVisible.value = true;
};

const handleEdit = (row: VendorBooking) => {
  isEditMode.value = true;
  editingId.value = row.id;
  Object.assign(vendorForm, {
    name: row.name,
    type: row.type,
    contactPerson: row.contactPerson,
    phone: row.phone,
    email: row.email,
    address: row.address,
    contractAmount: row.contractAmount,
    paidAmount: row.paidAmount,
    paymentStatus: row.paymentStatus,
    isConfirmed: row.isConfirmed,
    notes: row.notes,
  });
  dialogVisible.value = true;
};

const handleDelete = async (row: VendorBooking) => {
  try {
    await ElMessageBox.confirm("确定要删除这个供应商吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await vendorStore.deleteVendor(row.id);
    ElMessage.success("删除成功");
  } catch (error) {
    // 用户取消
  }
};

const handleSave = async () => {
  if (!vendorForm.name) {
    ElMessage.warning("请输入供应商名称");
    return;
  }

  try {
    saving.value = true;
    if (isEditMode.value && editingId.value) {
      await vendorStore.updateVendor(editingId.value, vendorForm);
      ElMessage.success("更新成功");
    } else {
      await vendorStore.createVendor(vendorForm);
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
  await vendorStore.fetchVendors();
});
</script>

<style scoped>
.vendors-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}
</style>
