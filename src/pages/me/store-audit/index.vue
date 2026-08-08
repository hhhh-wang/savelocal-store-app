<script setup lang="ts">
import type {
  AuditMaterialsDocumentItem,
  AuditMaterialsFormValue,
  AuditMaterialsSelectField,
  AuditMaterialsTextField,
} from '@/components/audit-materials-form/shared'
import AuditMaterialsForm from '@/components/audit-materials-form/audit-materials-form.vue'
import { validateAuditMaterials } from '@/components/audit-materials-form/shared'
import documentIcon from '@/static/icons/document.png'

defineOptions({
  name: 'StoreAudit',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '审核资料',
  },
})

const form = reactive<AuditMaterialsFormValue>({
  mainIndustryCode: 'food',
  storeCategory: 'restaurant',
  storeName: '',
  legalPersonName: '',
  legalPersonPhone: '',
  storeAddress: '',
  businessLicenseCode: '',
})

const selectFields: AuditMaterialsSelectField[] = [
  {
    key: 'mainIndustryCode',
    label: '主营业态',
    required: true,
    options: [{ label: '餐饮美食', value: 'food' }],
  },
  {
    key: 'storeCategory',
    label: '门店品类',
    required: true,
    options: [
      { label: '餐厅', value: 'restaurant' },
      { label: '小吃', value: 'snack' },
      { label: '饮品', value: 'drink' },
    ],
  },
]

const textFields: AuditMaterialsTextField[] = [
  { key: 'storeName', label: '店铺名称', required: true, placeholder: '请输入店铺名称' },
  { key: 'legalPersonName', label: '法人姓名', required: true, placeholder: '请输入法人姓名' },
  { key: 'legalPersonPhone', label: '法人电话', required: true, type: 'tel', placeholder: '请输入法人电话' },
  { key: 'storeAddress', label: '门店地址', required: true, placeholder: '请输入门店地址' },
  { key: 'businessLicenseCode', label: '营业执照信用代码', required: true, placeholder: '请输入统一社会信用代码' },
]

const documents = ref<AuditMaterialsDocumentItem[]>([
  { key: 'business-license', title: '营业执照', required: true, emptyText: '营业执照' },
  { key: 'food-permit', title: '食品经营许可证', required: true },
  { key: 'id-front', title: '法人身份证正面', required: true },
  { key: 'id-back', title: '法人身份证反面', required: true },
])

const requiredFieldKeys = [
  ...selectFields.filter(field => field.required).map(field => field.key),
  ...textFields.filter(field => field.required).map(field => field.key),
]
const requiredDocumentKeys = documents.value.filter(document => document.required).map(document => document.key)

function handleDocumentUpload(document: AuditMaterialsDocumentItem) {
  uni.showToast({
    title: `${document.title}上传功能待接入`,
    icon: 'none',
  })
}

function handleSubmit(value: AuditMaterialsFormValue) {
  const result = validateAuditMaterials(
    value,
    requiredFieldKeys,
    requiredDocumentKeys,
    documents.value.filter(document => document.imageUrl).map(document => document.key),
  )

  if (!result.valid) {
    const field = [...selectFields, ...textFields].find(item => item.key === result.missingKey)
    const document = documents.value.find(item => item.key === result.missingKey)
    uni.showToast({
      title: field ? `请填写${field.label}` : `请上传${document?.title || '必填资料'}`,
      icon: 'none',
    })
    return
  }

  uni.showToast({
    title: '提交逻辑待接入',
    icon: 'none',
  })
}
</script>

<template>
  <view class="store-audit-page">
    <view class="store-audit-page__content">
      <view class="store-audit-nav">
        <back-button
          fallback-url="/pages/me/me"
          fallback-mode="switchTab"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />
        <text class="store-audit-nav__title">审核资料编辑</text>
        <view class="store-audit-nav__spacer" />
      </view>

      <audit-materials-form
        v-model="form"
        :select-fields="selectFields"
        :text-fields="textFields"
        :documents="documents"
        :document-icon="documentIcon"
        @upload-document="handleDocumentUpload"
        @submit="handleSubmit"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-audit-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f7f7f9 18%, #f3f4f7 100%);
}

.store-audit-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 18rpx calc(env(safe-area-inset-bottom) + 42rpx);
}

.store-audit-nav {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  min-height: 72rpx;
  margin-bottom: 22rpx;
}

.store-audit-nav__title {
  color: #171a1f;
  font-size: 42rpx;
  font-weight: 800;
  text-align: center;
}

.store-audit-nav__spacer {
  width: 72rpx;
  height: 72rpx;
}
</style>
