<script setup lang="ts">
import type { MerchantFoodAddressSuggestion } from '@/api/types/merchant-food'
import type { MerchantStoreAuditDraft, MerchantStoreAuditMaterials, MerchantStoreAuditOptions } from '@/api/types/merchant-store'
import type {
  AuditMaterialsAddressSuggestion,
  AuditMaterialsDocumentItem,
  AuditMaterialsFormValue,
  AuditMaterialsSelectField,
  AuditMaterialsTextField,
} from '@/components/audit-materials-form/shared'
import { getMerchantFoodAddressSuggestions } from '@/api/merchant-food'
import { getMerchantStoreAuditDraft, getMerchantStoreAuditOptions, submitMerchantStoreAudit } from '@/api/merchant-store'
import { resolveAddressSuggestionText } from '@/components/audit-materials-form/address-suggestion'
import AuditMaterialsForm from '@/components/audit-materials-form/audit-materials-form.vue'
import { validateAuditMaterials } from '@/components/audit-materials-form/shared'
import useUpload from '@/hooks/useUpload'
import { normalizeCoordinate } from '@/pages/me/store-address/shared'
import documentIcon from '@/static/icons/document.png'
import locationIcon from '@/static/icons/location-icon.png'
import { resolveStoreAuditPrimaryAction } from './shared'

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
  mainIndustryCode: 'FOOD',
  storeCategoryCode: 'CATERING',
  storeName: '',
  legalPersonName: '',
  legalPersonPhone: '',
  storeAddress: '',
  businessLicenseCode: '',
  businessLicenseUrl: '',
  foodPermitUrl: '',
  legalPersonIdFrontUrl: '',
  legalPersonIdBackUrl: '',
})

const storeId = ref(0)
const auditStatus = ref('0')
const auditVersion = ref(0)
const auditSummary = ref('')
const auditIssues = ref<{ field: string, message: string }[]>([])
const loading = ref(true)
const submitting = ref(false)
const addressSuggestions = ref<MerchantFoodAddressSuggestion[]>([])
const loadingAddressSuggestions = ref(false)
const addressSuggestionVisible = ref(false)
const addressLocation = reactive({ latitude: 0, longitude: 0 })
const ADDRESS_SUGGESTION_LIMIT = 10
let addressSuggestionRequestSeq = 0

const auditIssueAliases: Record<string, string[]> = {
  'mainIndustryCode': ['industry.mainIndustryCode'],
  'storeCategoryCode': ['industry.storeCategoryCode'],
  'storeName': ['store.storeName'],
  'legalPersonName': ['legalEntity.legalPersonName'],
  'legalPersonPhone': ['legalEntity.legalPersonPhone'],
  'storeAddress': ['store.addressText', 'store.addressDetail'],
  'businessLicenseCode': ['legalEntity.unifiedSocialCode'],
  'business-license': ['qualifications.BUSINESS_LICENSE.qualificationImages'],
  'food-permit': ['qualifications.FOOD_LICENSE.qualificationImages'],
  'id-front': ['legalEntity.legalPersonIdFront'],
  'id-back': ['legalEntity.legalPersonIdBack'],
}

const isReadonly = computed(() => auditStatus.value === '1' || loading.value || submitting.value)
const primaryAction = computed(() => resolveStoreAuditPrimaryAction(auditStatus.value))
const primaryButtonText = computed(() => primaryAction.value === 'workbench' ? '去工作台' : '确认提交')
const statusLabel = computed(() => ({
  0: '草稿，可继续完善资料',
  1: '审核中，资料已锁定',
  2: '审核已通过',
  3: '审核驳回，请按问题修改后重新提交',
} as Record<string, string>)[auditStatus.value] || '请完善审核资料')

const fieldIssues = computed<Record<string, string>>(() => {
  const formFieldKeys = [
    'mainIndustryCode',
    'storeCategoryCode',
    'storeName',
    'legalPersonName',
    'legalPersonPhone',
    'storeAddress',
    'businessLicenseCode',
  ]
  return Object.fromEntries(formFieldKeys.flatMap((key) => {
    const paths = auditIssueAliases[key] || []
    const issue = auditIssues.value.find(item => paths.includes(item.field))
    return issue ? [[key, issue.message]] : []
  }))
})

const selectFields: AuditMaterialsSelectField[] = [
  {
    key: 'mainIndustryCode',
    label: '主营业态',
    required: true,
    options: [{ label: '餐饮美食', value: 'FOOD' }],
  },
  {
    key: 'storeCategoryCode',
    label: '门店品类',
    required: true,
    options: [
      { label: '餐厅', value: 'CATERING' },
      { label: '小吃', value: 'SNACK' },
      { label: '饮品', value: 'CAFE' },
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

const pendingDocumentKey = ref('')
const optionsCache = ref<MerchantStoreAuditOptions['mainIndustries']>([])

function fieldIssue(key: string) {
  const keys = auditIssueAliases[key] || []
  return auditIssues.value.find(item => keys.includes(item.field))?.message || ''
}

function clearFieldIssue(key: string) {
  const paths = auditIssueAliases[key] || []
  if (!paths.length)
    return
  auditIssues.value = auditIssues.value.filter(item => !paths.includes(item.field))
}

function clearAddressSuggestions() {
  addressSuggestionRequestSeq += 1
  loadingAddressSuggestions.value = false
  addressSuggestions.value = []
  addressSuggestionVisible.value = false
}

async function requestAddressLocation() {
  const currentLatitude = normalizeCoordinate(addressLocation.latitude)
  const currentLongitude = normalizeCoordinate(addressLocation.longitude)

  if (
    currentLatitude !== undefined
    && currentLongitude !== undefined
    && (currentLatitude !== 0 || currentLongitude !== 0)
  ) {
    return {
      latitude: currentLatitude,
      longitude: currentLongitude,
    }
  }

  const location = await uni.getLocation({
    type: 'gcj02',
    isHighAccuracy: true,
    highAccuracyExpireTime: 3000,
  })
  const latitude = normalizeCoordinate(location.latitude)
  const longitude = normalizeCoordinate(location.longitude)
  if (latitude === undefined || longitude === undefined) {
    throw new Error('定位结果无效')
  }

  return { latitude, longitude }
}

async function loadAddressSuggestions() {
  const requestSeq = ++addressSuggestionRequestSeq
  loadingAddressSuggestions.value = true
  addressSuggestionVisible.value = false

  try {
    const location = await requestAddressLocation()
    if (requestSeq !== addressSuggestionRequestSeq)
      return

    addressLocation.latitude = location.latitude
    addressLocation.longitude = location.longitude
    const suggestions = await getMerchantFoodAddressSuggestions({
      ...location,
      limit: ADDRESS_SUGGESTION_LIMIT,
    })
    if (requestSeq !== addressSuggestionRequestSeq)
      return

    addressSuggestions.value = (suggestions || []).filter(item =>
      !!(item.detailAddress || item.title || item.address),
    )
    if (!addressSuggestions.value.length) {
      uni.showToast({ title: '当前位置暂无可选地址', icon: 'none' })
      return
    }

    addressSuggestionVisible.value = true
  }
  catch (error) {
    if (requestSeq !== addressSuggestionRequestSeq)
      return

    console.error('获取审核地址候选失败:', error)
    uni.showToast({ title: '获取地址失败，请检查定位权限', icon: 'none' })
  }
  finally {
    if (requestSeq === addressSuggestionRequestSeq) {
      loadingAddressSuggestions.value = false
    }
  }
}

function handleAddressIconTap() {
  if (isReadonly.value || loadingAddressSuggestions.value)
    return

  if (addressSuggestions.value.length) {
    addressSuggestionVisible.value = true
    return
  }

  void loadAddressSuggestions()
}

function handlePageTap() {
  if (addressSuggestionVisible.value) {
    addressSuggestionVisible.value = false
  }
}

function selectAddressSuggestion(item: AuditMaterialsAddressSuggestion) {
  const address = resolveAddressSuggestionText(item)
  if (!address) {
    uni.showToast({ title: '该地址缺少完整地址信息，请重新选择', icon: 'none' })
    return
  }

  form.storeAddress = address
  clearFieldIssue('storeAddress')
  clearAddressSuggestions()
}

function applyDraft(draft: MerchantStoreAuditDraft) {
  storeId.value = draft.storeId
  auditStatus.value = draft.auditStatus || '0'
  auditVersion.value = draft.auditVersion || 0
  auditSummary.value = draft.auditSummary || ''
  auditIssues.value = draft.auditIssues || []
  Object.assign(form, {
    ...(draft.materials || {}),
    auditVersion: String(draft.auditVersion || 0),
  })
  const pending = draft.pendingSnapshot ?? draft.activeSnapshot
  const qualifications = pending?.qualifications ?? []
  const findImage = (code: string) => qualifications.find(item => item.qualificationCode === code)?.qualificationImages?.[0] || ''
  const urls = {
    businessLicenseUrl: findImage('BUSINESS_LICENSE'),
    foodPermitUrl: findImage('FOOD_LICENSE'),
    legalPersonIdFrontUrl: pending?.legalEntity.legalPersonIdFront || '',
    legalPersonIdBackUrl: pending?.legalEntity.legalPersonIdBack || '',
  }
  Object.assign(form, urls)
  documents.value.forEach((document) => {
    const url = ({
      'business-license': urls.businessLicenseUrl,
      'food-permit': urls.foodPermitUrl,
      'id-front': urls.legalPersonIdFrontUrl,
      'id-back': urls.legalPersonIdBackUrl,
    } as Record<string, string>)[document.key] || ''
    document.fileUrl = url
    document.imageUrl = url
    document.fileName = url ? '已上传文件' : ''
    document.issueMessage = fieldIssue(document.key)
  })

  const selectedMain = optionsCache.value.find(option => option.value === form.mainIndustryCode)
  const fallbackMain = optionsCache.value[0] || {
    value: selectFields[0].options[0]?.value || '',
    categories: selectFields[1].options,
  }
  const activeMain = selectedMain || fallbackMain
  if (activeMain.value) {
    // 新草稿的快照可能还没有行业值，不能让下拉框显示第一项但实际提交空值。
    form.mainIndustryCode = activeMain.value
    selectFields[1].options = activeMain.categories
    if (!activeMain.categories.some(option => option.value === form.storeCategoryCode)) {
      form.storeCategoryCode = activeMain.categories[0]?.value || ''
    }
  }
}

function handleFormUpdate(value: AuditMaterialsFormValue) {
  if (value.storeAddress !== form.storeAddress) {
    clearAddressSuggestions()
  }
  Object.assign(form, value)
}

onLoad(async (options) => {
  const parsedStoreId = Number(options?.storeId)
  if (!Number.isFinite(parsedStoreId) || parsedStoreId <= 0) {
    loading.value = false
    uni.showToast({ title: '缺少门店ID，请从开新店入口进入', icon: 'none' })
    return
  }
  storeId.value = parsedStoreId
  try {
    const [draft, optionsData] = await Promise.all([
      getMerchantStoreAuditDraft(parsedStoreId),
      getMerchantStoreAuditOptions(),
    ])
    if (optionsData?.mainIndustries?.length) {
      optionsCache.value = optionsData.mainIndustries
      selectFields[0].options = optionsData.mainIndustries.map(item => ({ label: item.label, value: item.value }))
      const categories = optionsData.mainIndustries.find(item => item.value === form.mainIndustryCode)?.categories || optionsData.mainIndustries[0].categories || []
      selectFields[1].options = categories
    }
    applyDraft(draft)
  }
  catch (error) {
    console.error('加载门店审核资料失败:', error)
    uni.showToast({ title: '审核资料加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
})

function uploadedUrl(result: any) {
  return typeof result === 'string' ? result : result?.url || result?.fileUrl || result?.path || ''
}

const { run: selectAndUpload } = useUpload<'file'>({
  fileType: 'file',
  accept: ['png', 'jpg'],
  maxSize: 5 * 1024 * 1024,
  formData: {
    bizType: 'MERCHANT_AUDIT_MATERIAL',
  },
  success: (result) => {
    const document = documents.value.find(item => item.key === pendingDocumentKey.value)
    const fileUrl = uploadedUrl(result)
    pendingDocumentKey.value = ''

    if (!document || !fileUrl) {
      uni.showToast({ title: '上传结果缺少文件地址', icon: 'none' })
      return
    }

    document.fileUrl = fileUrl
    document.imageUrl = fileUrl
    document.fileName = '已上传文件'
    const fieldKey = ({
      'business-license': 'businessLicenseUrl',
      'food-permit': 'foodPermitUrl',
      'id-front': 'legalPersonIdFrontUrl',
      'id-back': 'legalPersonIdBackUrl',
    } as Record<string, string>)[document.key]
    if (fieldKey) {
      form[fieldKey] = fileUrl
    }
    document.issueMessage = ''
    clearFieldIssue(document.key)
    uni.showToast({ title: `${document.title}上传成功`, icon: 'success' })
  },
  error: () => {
    pendingDocumentKey.value = ''
  },
})

function handleDocumentUpload(document: AuditMaterialsDocumentItem) {
  pendingDocumentKey.value = document.key
  selectAndUpload()
}

async function handleSubmit(value: AuditMaterialsFormValue) {
  if (primaryAction.value === 'workbench') {
    uni.switchTab({ url: '/pages/dashboard/index' })
    return
  }

  if (auditStatus.value === '1' || submitting.value) {
    uni.showToast({ title: '审核中，资料暂不可修改', icon: 'none' })
    return
  }
  const result = validateAuditMaterials(
    value,
    requiredFieldKeys,
    requiredDocumentKeys,
    documents.value
      .filter(document => document.imageUrl || document.fileUrl)
      .map(document => document.key),
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

  submitting.value = true
  try {
    const payload: MerchantStoreAuditMaterials = {
      auditVersion: auditVersion.value,
      mainIndustryCode: value.mainIndustryCode,
      storeCategoryCode: value.storeCategoryCode,
      storeName: value.storeName.trim(),
      legalPersonName: value.legalPersonName.trim(),
      legalPersonPhone: value.legalPersonPhone.trim(),
      storeAddress: value.storeAddress.trim(),
      businessLicenseCode: value.businessLicenseCode.trim().toUpperCase(),
      businessLicenseUrl: form.businessLicenseUrl || documents.value.find(item => item.key === 'business-license')?.fileUrl || '',
      foodPermitUrl: form.foodPermitUrl || documents.value.find(item => item.key === 'food-permit')?.fileUrl || '',
      legalPersonIdFrontUrl: form.legalPersonIdFrontUrl || documents.value.find(item => item.key === 'id-front')?.fileUrl || '',
      legalPersonIdBackUrl: form.legalPersonIdBackUrl || documents.value.find(item => item.key === 'id-back')?.fileUrl || '',
    }
    const draft = await submitMerchantStoreAudit(storeId.value, payload)
    applyDraft(draft)
    uni.showToast({ title: '已提交审核', icon: 'success' })
  }
  catch (error) {
    console.error('提交门店审核资料失败:', error)
    if (String((error as any)?.message || '').includes('版本') || String((error as any)?.message || '').includes('审核中')) {
      try {
        applyDraft(await getMerchantStoreAuditDraft(storeId.value))
      }
      catch {}
    }
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="store-audit-page" @tap="handlePageTap">
    <view class="store-audit-page__content">
      <view class="store-audit-nav">
        <back-button
          fallback-url="/pages/components/store-create-lock"
          fallback-mode="switchTab"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />
        <text class="store-audit-nav__title">审核资料编辑</text>
        <view class="store-audit-nav__spacer" />
      </view>

      <view v-if="!loading" class="store-audit-status" :class="{ 'store-audit-status--warning': auditStatus === '3', 'store-audit-status--locked': auditStatus === '1' }">
        {{ statusLabel }}
      </view>

      <view v-if="auditStatus === '3' && auditSummary" class="store-audit-summary">
        <text class="store-audit-summary__label">整单驳回说明</text>
        <text class="store-audit-summary__content">{{ auditSummary }}</text>
      </view>

      <audit-materials-form
        :model-value="form"
        :select-fields="selectFields"
        :text-fields="textFields"
        :documents="documents"
        :readonly="isReadonly"
        :field-issues="fieldIssues"
        :document-icon="documentIcon"
        :submit-text="primaryButtonText"
        address-field-key="storeAddress"
        :address-icon="locationIcon"
        :address-suggestions="addressSuggestions"
        :address-suggestion-visible="addressSuggestionVisible"
        :loading-address-suggestions="loadingAddressSuggestions"
        @update:model-value="handleFormUpdate"
        @clear-field-issue="clearFieldIssue"
        @address-icon-tap="handleAddressIconTap"
        @select-address-suggestion="selectAddressSuggestion"
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

.store-audit-status {
  margin: 0 0 18rpx;
  padding: 18rpx 22rpx;
  border-radius: 18rpx;
  background: #eef7ff;
  color: #2f6f9f;
  font-size: 26rpx;
  line-height: 1.45;
}

.store-audit-status--warning {
  background: #fff4e8;
  color: #b45b1d;
}

.store-audit-status--locked {
  background: #f1f2f5;
  color: #727780;
}

.store-audit-summary {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin: 0 0 18rpx;
  padding: 18rpx 22rpx;
  border: 1rpx solid #f1c89f;
  border-radius: 18rpx;
  background: #fffaf4;
}

.store-audit-summary__label {
  color: #9a4f1a;
  font-size: 25rpx;
  font-weight: 700;
}

.store-audit-summary__content {
  color: #6f4a2f;
  font-size: 26rpx;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
