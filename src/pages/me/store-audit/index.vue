<script setup lang="ts">
import type { RegionCodes } from '../store-address/store-address'
import type { MerchantFoodAddressSuggestion } from '@/api/types/merchant-food'
import type { MerchantStoreAuditDraft, MerchantStoreAuditMaterials, MerchantStoreAuditOptions } from '@/api/types/merchant-store'
import type {
  AuditMaterialsAddressSuggestion,
  AuditMaterialsDocumentItem,
  AuditMaterialsFormValue,
  AuditMaterialsSelectField,
  AuditMaterialsTextField,
} from '@/components/audit-materials-form/shared'
import { getMerchantFoodAddressSuggestions, getMerchantFoodKeywordAddressSuggestions } from '@/api/merchant-food'
import { getMerchantStoreAuditDraft, getMerchantStoreAuditOptions, submitMerchantStoreAudit } from '@/api/merchant-store'
import { resolveAddressSuggestionText } from '@/components/audit-materials-form/address-suggestion'
import AuditMaterialsForm from '@/components/audit-materials-form/audit-materials-form.vue'
import { validateAuditMaterials } from '@/components/audit-materials-form/shared'
import useUpload from '@/hooks/useUpload'
import { normalizeCoordinate, resolveRegionCodesFromAdcode } from '@/pages/me/store-address/store-address'
import documentIcon from '@/static/icons/document.png'
import locationIcon from '@/static/icons/location-icon.png'
import { debounce } from '@/utils/debounce'
import { resolveStoreAuditPrimaryAction } from './store-audit'

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
const submitError = ref('')
const loading = ref(true)
const submitting = ref(false)
const addressSuggestions = ref<MerchantFoodAddressSuggestion[]>([])
const loadingAddressSuggestions = ref(false)
const addressSuggestionVisible = ref(false)
const addressLocation = reactive({ latitude: 0, longitude: 0 })
const regionCodes = reactive<RegionCodes>({ provinceCode: '', cityCode: '', districtCode: '' })
const ADDRESS_SUGGESTION_LIMIT = 10
const ADDRESS_SUGGESTION_DEBOUNCE_MS = 300
let addressSuggestionRequestSeq = 0

const auditIssueAliases: Record<string, string[]> = {
  'mainIndustryCode': ['industry.mainIndustryCode'],
  'storeCategoryCode': ['industry.storeCategoryCode'],
  'storeName': ['store.storeName'],
  'legalPersonName': ['legalEntity.legalPersonName'],
  'legalPersonPhone': ['legalEntity.legalPersonPhone'],
  'storeAddress': ['store.addressText', 'store.addressDetail', 'store.longitude', 'store.latitude'],
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

function showSubmitError(message: unknown) {
  const errorMessage = String(message || '').trim() || '提交失败，请稍后重试'
  submitError.value = errorMessage
  uni.showToast({ title: errorMessage, icon: 'none', duration: 3500 })
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function getSubmitErrorMessage(error: unknown) {
  const value = error as any
  return value?.message || value?.msg || value?.data?.message || value?.data?.msg || '提交失败，请稍后重试'
}

function clearAddressSuggestions() {
  addressSuggestionRequestSeq += 1
  loadingAddressSuggestions.value = false
  addressSuggestions.value = []
  addressSuggestionVisible.value = false
}

function resetRegionCodes() {
  regionCodes.provinceCode = ''
  regionCodes.cityCode = ''
  regionCodes.districtCode = ''
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

async function requestKeywordSearchLocation() {
  const currentLatitude = normalizeCoordinate(addressLocation.latitude)
  const currentLongitude = normalizeCoordinate(addressLocation.longitude)
  if (currentLatitude !== undefined && currentLongitude !== undefined && (currentLatitude !== 0 || currentLongitude !== 0)) {
    return {
      latitude: currentLatitude,
      longitude: currentLongitude,
    }
  }

  try {
    return await requestAddressLocation()
  }
  catch {
    // 关键词检索可在未授予定位权限时由腾讯地图完成全国范围匹配。
    return undefined
  }
}

async function loadKeywordAddressSuggestions(keyword: string) {
  const normalizedKeyword = keyword.trim()
  if (normalizedKeyword.length < 2 || normalizedKeyword !== form.storeAddress.trim()) {
    return
  }

  const requestSeq = ++addressSuggestionRequestSeq
  loadingAddressSuggestions.value = true
  addressSuggestionVisible.value = false

  try {
    const location = await requestKeywordSearchLocation()
    if (requestSeq !== addressSuggestionRequestSeq || normalizedKeyword !== form.storeAddress.trim()) {
      return
    }

    const suggestions = await getMerchantFoodKeywordAddressSuggestions({
      keyword: normalizedKeyword,
      ...location,
      limit: ADDRESS_SUGGESTION_LIMIT,
    })
    if (requestSeq !== addressSuggestionRequestSeq || normalizedKeyword !== form.storeAddress.trim()) {
      return
    }

    addressSuggestions.value = (suggestions || []).filter(item =>
      !!(item.detailAddress || item.title || item.address),
    )
    addressSuggestionVisible.value = addressSuggestions.value.length > 0
  }
  catch (error) {
    if (requestSeq !== addressSuggestionRequestSeq) {
      return
    }

    console.error('搜索审核地址候选失败:', error)
  }
  finally {
    if (requestSeq === addressSuggestionRequestSeq) {
      loadingAddressSuggestions.value = false
    }
  }
}

const debouncedLoadKeywordAddressSuggestions = debounce((keyword: string) => {
  void loadKeywordAddressSuggestions(keyword)
}, ADDRESS_SUGGESTION_DEBOUNCE_MS)

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
  const latitude = normalizeCoordinate(item.latitude)
  const longitude = normalizeCoordinate(item.longitude)
  const codes = resolveRegionCodesFromAdcode(item.adcode)
  if (!address || latitude === undefined || longitude === undefined || !codes.districtCode) {
    uni.showToast({ title: '该地址缺少完整定位信息，请重新选择', icon: 'none' })
    return
  }

  form.storeAddress = address
  regionCodes.provinceCode = codes.provinceCode
  regionCodes.cityCode = codes.cityCode
  regionCodes.districtCode = codes.districtCode
  addressLocation.latitude = latitude
  addressLocation.longitude = longitude
  submitError.value = ''
  clearFieldIssue('storeAddress')
  clearAddressSuggestions()
}

function applyDraft(draft: MerchantStoreAuditDraft) {
  storeId.value = draft.storeId
  auditStatus.value = draft.auditStatus || '0'
  auditVersion.value = draft.auditVersion || 0
  auditSummary.value = draft.auditSummary || ''
  auditIssues.value = draft.auditIssues || []
  const materials = draft.materials || {} as MerchantStoreAuditMaterials
  const {
    longitude: materialLongitude,
    latitude: materialLatitude,
    provinceCode: materialProvinceCode,
    cityCode: materialCityCode,
    districtCode: materialDistrictCode,
    ...formMaterials
  } = materials
  Object.assign(form, {
    ...formMaterials,
    auditVersion: String(draft.auditVersion || 0),
  })
  const pending = draft.pendingSnapshot ?? draft.activeSnapshot
  const latitude = normalizeCoordinate(materialLatitude ?? pending?.store.latitude)
  const longitude = normalizeCoordinate(materialLongitude ?? pending?.store.longitude)
  regionCodes.provinceCode = materialProvinceCode || pending?.store.provinceCode || ''
  regionCodes.cityCode = materialCityCode || pending?.store.cityCode || ''
  regionCodes.districtCode = materialDistrictCode || pending?.store.districtCode || ''
  addressLocation.latitude = latitude ?? 0
  addressLocation.longitude = longitude ?? 0
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
  submitError.value = ''
  if (value.storeAddress !== form.storeAddress) {
    resetRegionCodes()
    addressLocation.latitude = 0
    addressLocation.longitude = 0
    clearAddressSuggestions()
  }
  Object.assign(form, value)
}

function handleAddressInput(value: string) {
  debouncedLoadKeywordAddressSuggestions.cancel()
  const keyword = value.trim()
  if (keyword.length >= 2) {
    debouncedLoadKeywordAddressSuggestions(keyword)
  }
}

onLoad(async (options) => {
  const parsedStoreId = Number(options?.storeId)
  if (!Number.isFinite(parsedStoreId) || parsedStoreId <= 0) {
    loading.value = false
    showSubmitError('缺少门店ID，请从开新店入口进入')
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
    showSubmitError(getSubmitErrorMessage(error))
  }
  finally {
    loading.value = false
  }
})

onUnmounted(() => {
  debouncedLoadKeywordAddressSuggestions.cancel()
  clearAddressSuggestions()
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
    submitError.value = ''
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
  submitError.value = ''

  if (primaryAction.value === 'workbench') {
    uni.switchTab({ url: '/pages/dashboard/index' })
    return
  }

  if (loading.value) {
    showSubmitError('审核资料正在加载，请稍后再试')
    return
  }

  if (auditStatus.value === '1' || submitting.value) {
    showSubmitError(submitting.value ? '正在提交，请勿重复操作' : '审核中，资料暂不可修改')
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
    showSubmitError(field ? `请填写${field.label}` : `请上传${document?.title || '必填资料'}`)
    return
  }

  const latitude = normalizeCoordinate(addressLocation.latitude)
  const longitude = normalizeCoordinate(addressLocation.longitude)
  if (
    latitude === undefined
    || longitude === undefined
    || (latitude === 0 && longitude === 0)
  ) {
    showSubmitError('请通过地址定位选择完整的门店地址')
    return
  }
  if (!regionCodes.provinceCode || !regionCodes.cityCode || !regionCodes.districtCode) {
    showSubmitError('请从地址候选中选择门店地址')
    return
  }

  submitting.value = true
  try {
    const payload: MerchantStoreAuditMaterials = {
      auditVersion: auditVersion.value,
      mainIndustryCode: normalizeText(value.mainIndustryCode),
      storeCategoryCode: normalizeText(value.storeCategoryCode),
      storeName: normalizeText(value.storeName),
      legalPersonName: normalizeText(value.legalPersonName),
      legalPersonPhone: normalizeText(value.legalPersonPhone),
      storeAddress: normalizeText(value.storeAddress),
      provinceCode: regionCodes.provinceCode,
      cityCode: regionCodes.cityCode,
      districtCode: regionCodes.districtCode,
      longitude,
      latitude,
      businessLicenseCode: normalizeText(value.businessLicenseCode).toUpperCase(),
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
    showSubmitError(getSubmitErrorMessage(error))
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

      <view v-if="submitError" class="store-audit-submit-error">
        <text class="store-audit-submit-error__label">提交失败</text>
        <text class="store-audit-submit-error__content">{{ submitError }}</text>
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
        @address-input="handleAddressInput"
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

.store-audit-submit-error {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin: 0 0 18rpx;
  padding: 18rpx 22rpx;
  border: 1rpx solid #efb6b2;
  border-radius: 18rpx;
  background: #fff5f4;
}

.store-audit-submit-error__label {
  color: #b42318;
  font-size: 25rpx;
  font-weight: 700;
}

.store-audit-submit-error__content {
  color: #8f2d25;
  font-size: 26rpx;
  line-height: 1.5;
  word-break: break-word;
}
</style>
