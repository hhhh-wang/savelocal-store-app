<script setup lang="ts">
import type { LedgerMaterials, LedgerView } from '@/api/merchant-ledger'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { emptyLedgerMaterials, getLedger, refreshLedger, saveLedger, searchLedgerBankBranches, searchLedgerBanks, uploadLedgerFile } from '@/api/merchant-ledger'
import BankSearchField from './bank-search-field.vue'

const props = defineProps<{ storeId: string }>()
const view = ref<LedgerView>()
const form = reactive<LedgerMaterials>(emptyLedgerMaterials())
const busy = ref(false)
const loading = ref(true)
const error = ref('')
const activeBankField = ref('')
let returningFromAudit = false
type TextKey = Exclude<keyof LedgerMaterials, 'agreementFileIds'>
interface Field { key: TextKey, label: string, hint?: string }
const corporateFields: Field[] = [
  { key: 'licenseNumber', label: '营业执照号码' },
  { key: 'licenseName', label: '营业执照名称' },
  { key: 'licenseAddress', label: '营业执照注册地址' },
  { key: 'licenseBeginDate', label: '营业执照起始日期', hint: 'yyyy-MM-dd' },
  { key: 'licenseEndDate', label: '营业执照截止日期', hint: 'yyyy-MM-dd' },
]
const legalFields: Field[] = [
  { key: 'legalName', label: '法人姓名' },
  { key: 'legalNumber', label: '法人身份证号码' },
  { key: 'mobile', label: '法人手机号' },
  { key: 'legalBeginDate', label: '身份证起始日期', hint: 'yyyy-MM-dd' },
  { key: 'legalEndDate', label: '身份证截止日期', hint: 'yyyy-MM-dd' },
]
const bankFields: Field[] = [
  { key: 'bankCardNo', label: '结算银行卡号' },
  { key: 'bankCardName', label: '结算户名' },
  { key: 'bankName', label: '开户银行' },
  { key: 'bankBranchName', label: '开户支行' },
]
const groups = computed(() => [
  { title: '银行卡及开户行', fields: bankFields },
  { title: '法人资料', fields: legalFields },
  ...(form.merchType === '1' ? [{ title: '营业执照', fields: corporateFields }] : []),
])
const imageFields: Field[] = [
  { key: 'bankFileId', label: '结算银行卡照片' },
]
const disabled = computed(() => busy.value || !view.value?.editable)
const statusLabel = computed(() => view.value?.stateLabel.replace(/嘉联/g, '') || '')
const missingAuditDocuments = computed(() => [
  ...(!view.value?.auditDocuments.legalFront && !form.legalFrontFileId ? ['身份证正面'] : []),
  ...(!view.value?.auditDocuments.legalBack && !form.legalBackFileId ? ['身份证背面'] : []),
  ...(form.merchType === '1' && !view.value?.auditDocuments.license && !form.licenseFileId ? ['营业执照'] : []),
])

async function searchBanks(keyword: string) {
  return (await searchLedgerBanks(props.storeId, keyword)).map(item => ({ code: item.bankCode, name: item.bankName }))
}

async function searchBranches(keyword: string) {
  if (!form.bankCode)
    return []
  return (await searchLedgerBankBranches(props.storeId, form.bankCode, keyword)).map(item => ({ code: item.branchCode, name: item.branchName }))
}

function changeBankName(value: string) {
  form.bankName = value
  form.bankCode = ''
  form.bankBranchName = ''
  form.bankBranchCode = ''
}

function changeBranchName(value: string) {
  form.bankBranchName = value
  form.bankBranchCode = ''
}

function selectBank(option: { code: string, name: string }) {
  changeBankName(option.name)
  form.bankCode = option.code
}

function selectBranch(option: { code: string, name: string }) {
  form.bankBranchName = option.name
  form.bankBranchCode = option.code
}

function openAuditMaterials() {
  returningFromAudit = true
  uni.navigateTo({ url: `/pages/me/store-audit/index?storeId=${props.storeId}` })
}

onShow(async () => {
  if (!returningFromAudit)
    return
  returningFromAudit = false
  try {
    const latest = await getLedger(props.storeId)
    if (view.value?.version === latest.version && latest.editable)
      view.value.auditDocuments = latest.auditDocuments
    else
      apply(latest)
  }
  catch (reason) {
    error.value = message(reason)
  }
})

function message(value: unknown): string {
  if (value instanceof Error)
    return value.message
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string')
    return value.message
  if (value && typeof value === 'object' && 'errMsg' in value && typeof value.errMsg === 'string')
    return value.errMsg
  return '操作失败，请稍后重试'
}

function apply(value: LedgerView) {
  view.value = value
  Object.assign(form, value.materials)
  if (!form.merchType)
    form.merchType = '2'
}

async function load() {
  try {
    apply(await getLedger(props.storeId))
    error.value = ''
  }
  catch (reason) {
    error.value = message(reason)
  }
  finally {
    loading.value = false
  }
}

function changeType(event: { detail: { value: string | number } }) {
  form.merchType = Number(event.detail.value) === 0 ? '2' : '1'
}

async function save(submit: boolean) {
  if (!view.value || disabled.value)
    return
  if (submit && !view.value.enabled) {
    error.value = '开户提交暂未开放，可先保存草稿'
    return
  }
  if (submit && (!form.bankCode || !form.bankBranchCode)) {
    error.value = '请从下拉搜索结果中选择开户银行及支行'
    return
  }
  if (submit && missingAuditDocuments.value.length) {
    error.value = `请先在审核资料中补充${missingAuditDocuments.value.join('、')}`
    return
  }
  busy.value = true
  error.value = ''
  try {
    apply(await saveLedger(props.storeId, view.value.version, { ...form }, submit))
    uni.showToast({ title: submit ? '账户资料已提交' : '草稿已保存', icon: 'success' })
  }
  catch (reason) {
    error.value = message(reason)
  }
  finally {
    busy.value = false
  }
}

async function upload(key?: TextKey) {
  if (disabled.value)
    return
  if (!key && form.agreementFileIds.length >= 20) {
    error.value = '合作协议最多上传20张'
    return
  }
  busy.value = true
  try {
    const selected = await uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
    const path = selected.tempFilePaths[0]
    if (!path)
      return
    const fileId = await uploadLedgerFile(props.storeId, path)
    if (key)
      form[key] = fileId
    else
      form.agreementFileIds.push(fileId)
    error.value = ''
  }
  catch (reason) {
    const text = message(reason)
    if (!text.includes('cancel'))
      error.value = text
  }
  finally {
    busy.value = false
  }
}

async function refresh() {
  if (busy.value)
    return
  busy.value = true
  try {
    apply(await refreshLedger(props.storeId))
    error.value = ''
    uni.showToast({ title: '正在核对最新状态', icon: 'none' })
  }
  catch (reason) {
    error.value = message(reason)
  }
  finally {
    busy.value = false
  }
}

function copySignLink() {
  if (view.value?.signLink)
    uni.setClipboardData({ data: view.value.signLink })
}

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  void load()
  timer = setInterval(() => {
    if (!busy.value && ['READY', 'OPENING', 'SIGNING', 'BIND_READY', 'BINDING', 'BIND_UNKNOWN'].includes(view.value?.state || ''))
      void load()
  }, 10000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <view class="ledger-form" :class="{ 'ledger-form--editable': view?.editable }" @tap="activeBankField = ''">
    <view class="ledger-intro">
      <text class="ledger-intro__title">完善账户信息</text>
      <text class="ledger-hint">填写银行卡及开户行，完成审核与签约后用于门店结算。</text>
    </view>
    <view v-if="loading" class="ledger-panel ledger-loading">
      正在加载账户信息…
    </view>
    <view v-if="error" class="ledger-error">
      {{ error }}
    </view>
    <view v-if="view" class="ledger-panel ledger-status">
      <view class="ledger-status__heading">
        <view class="ledger-status__body">
          <text class="ledger-status__label">当前进度</text>
          <text class="ledger-status__title">{{ statusLabel }}</text>
        </view>
        <button v-if="!view.editable" class="ledger-text-button" :disabled="busy" @click="refresh">
          <view class="i-carbon-renew ledger-inline-icon" />
          <text>{{ busy ? '查询中' : '刷新进度' }}</text>
        </button>
      </view>
      <text v-if="view.lastError" class="ledger-status__error">{{ view.lastError }}</text>
      <text v-if="!view.initialAuditPassed" class="ledger-hint">门店初审通过后，即可填写账户资料。</text>
      <text v-if="view.editable && !view.enabled" class="ledger-hint">开户提交暂未开放，可先填写账户信息、上传照片并保存草稿。</text>
      <text v-else-if="view.editable && !view.profileApproved" class="ledger-hint">可先完善并提交资料，门店二审通过后继续办理开户。</text>
      <text v-else-if="view.initialAuditPassed && !view.editable" class="ledger-hint">当前开户阶段的资料已锁定，如需修改请联系平台处理。</text>
      <view v-if="view.signLink" class="ledger-sign">
        <text class="ledger-hint">请由法人本人打开签约链接，完成电子签约。</text>
        <button class="ledger-button ledger-button--primary ledger-sign__button" @click="copySignLink">
          复制法人签约链接
        </button>
      </view>
    </view>
    <template v-if="view?.initialAuditPassed">
      <view class="ledger-panel">
        <picker :disabled="disabled" :range="['法人对私银行卡', '企业对公账户']" :value="form.merchType === '1' ? 1 : 0" @change="changeType">
          <view class="ledger-account-type">
            <text class="ledger-section-title">账户类型</text>
            <view class="ledger-account-type__value">
              <text>{{ form.merchType === '1' ? '企业对公账户' : '法人对私银行卡' }}</text>
              <view v-if="!disabled" class="i-carbon-chevron-down ledger-inline-icon" />
            </view>
          </view>
        </picker>
        <text class="ledger-hint">{{ form.merchType === '1' ? '请使用与营业执照主体一致的企业账户。' : '请使用法人本人名下的银行卡。' }}</text>
      </view>
      <view v-for="group in groups" :key="group.title" class="ledger-panel ledger-fields">
        <text class="ledger-section-title ledger-fields__title">{{ group.title }}</text>
        <view v-for="field in group.fields" :key="field.key" class="ledger-field">
          <text class="ledger-field__label">{{ field.label }}<text class="ledger-required">*</text></text>
          <BankSearchField
            v-if="field.key === 'bankName' || field.key === 'bankBranchName'"
            :value="form[field.key]"
            :active="activeBankField === field.key"
            :disabled="disabled || (field.key === 'bankBranchName' && !form.bankCode)"
            :placeholder="field.key === 'bankName' ? '输入银行名称搜索' : form.bankCode ? '输入支行名称或地区' : '请先选择开户银行'"
            :search="field.key === 'bankName' ? searchBanks : searchBranches"
            @focus="activeBankField = field.key"
            @input="field.key === 'bankName' ? changeBankName($event) : changeBranchName($event)"
            @select="field.key === 'bankName' ? selectBank($event) : selectBranch($event)"
          />
          <input
            v-else
            v-model="form[field.key]"
            :disabled="disabled"
            :maxlength="256"
            class="ledger-field__input"
            placeholder-class="ledger-field__placeholder"
            :placeholder="field.hint || (`请填写${field.label}`)"
          >
        </view>
      </view>
      <view class="ledger-panel">
        <text class="ledger-section-title">银行卡照片</text>
        <text class="ledger-hint">请上传清晰完整的银行卡照片，支持5MB以内的PNG、JPG图片。</text>
        <view v-if="view.editable && missingAuditDocuments.length" class="ledger-audit-documents">
          <text class="ledger-audit-documents__missing">审核资料还缺少{{ missingAuditDocuments.join('、') }}，请先补齐。</text>
          <button class="ledger-text-button" @click="openAuditMaterials">
            补充审核资料
          </button>
        </view>
        <text v-else class="ledger-hint">{{ form.merchType === '1' ? '身份证正反面及营业执照' : '身份证正反面' }}将复用门店审核资料，无需重复上传。</text>
        <button v-if="view.editable && !missingAuditDocuments.length" class="ledger-text-button" @click="openAuditMaterials">
          查看审核资料
        </button>
        <view class="ledger-upload-grid">
          <button
            v-for="field in imageFields"
            :key="field.key"
            :disabled="disabled"
            class="ledger-upload"
            :class="{ 'ledger-upload--complete': form[field.key] }"
            hover-class="ledger-button--hover"
            @click="upload(field.key)"
          >
            <view v-if="form[field.key]" class="i-carbon-checkmark ledger-upload__icon" />
            <view v-else class="i-carbon-add ledger-upload__icon" />
            <text class="ledger-upload__title">{{ field.label }}</text>
            <text class="ledger-upload__hint">{{ form[field.key] ? (disabled ? '已上传' : '已上传 · 更换') : (disabled ? '未上传' : '点击上传') }}</text>
          </button>
        </view>
      </view>
      <view class="ledger-panel">
        <view class="ledger-agreement-heading">
          <text class="ledger-section-title">合作协议<text class="ledger-required">*</text></text>
          <text class="ledger-agreement-heading__count">{{ form.agreementFileIds.length }}/20</text>
        </view>
        <text class="ledger-hint">上传双方已签署、包含分账比例约定的合作协议。</text>
        <view v-for="(file, index) in form.agreementFileIds" :key="file + index" class="ledger-agreement">
          <view class="ledger-agreement__name">
            <view class="i-carbon-document ledger-inline-icon" />
            <text>协议图片 {{ index + 1 }}</text>
          </view>
          <button v-if="!disabled" class="ledger-text-button" @click="form.agreementFileIds.splice(index, 1)">
            移除
          </button>
          <text v-else class="ledger-agreement__state">已上传</text>
        </view>
        <button v-if="view.editable" :disabled="disabled || form.agreementFileIds.length >= 20" class="ledger-button ledger-agreement__add" @click="upload()">
          <view class="i-carbon-add ledger-inline-icon" />
          <text>添加协议图片</text>
        </button>
        <text v-else-if="!form.agreementFileIds.length" class="ledger-hint">暂无协议图片</text>
      </view>
      <text class="ledger-privacy">资料仅用于账户开通，请确认信息真实、准确。</text>
      <view v-if="view.editable" class="ledger-actions">
        <button class="ledger-button ledger-actions__draft" :disabled="busy" hover-class="ledger-button--hover" @click="save(false)">
          保存草稿
        </button>
        <button class="ledger-button ledger-button--primary ledger-actions__submit" :disabled="busy || !view.enabled" :loading="busy" hover-class="ledger-button--hover" @click="save(true)">
          {{ view.enabled ? '提交账户资料' : '暂未开放提交' }}
        </button>
      </view>
    </template>
    <button v-if="!view && !loading" class="ledger-button ledger-reload" @click="load">
      重新加载
    </button>
  </view>
</template>

<style lang="scss" scoped>
.ledger-form {
  padding: 28rpx 24rpx calc(env(safe-area-inset-bottom) + 40rpx);
  color: #24272b;
}

.ledger-form--editable {
  padding-bottom: calc(env(safe-area-inset-bottom) + 160rpx);
}

.ledger-intro {
  padding: 4rpx 4rpx 26rpx;
}

.ledger-intro__title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
}

.ledger-hint {
  display: block;
  margin-top: 12rpx;
  color: #858a93;
  font-size: 24rpx;
  line-height: 1.7;
}

.ledger-panel {
  margin-bottom: 20rpx;
  padding: 28rpx;
  border: 1rpx solid #eceef1;
  border-radius: 22rpx;
  background: #fff;
}

.ledger-loading {
  padding: 48rpx 28rpx;
  color: #858a93;
  font-size: 26rpx;
  text-align: center;
}

.ledger-error {
  margin-bottom: 20rpx;
  padding: 22rpx 26rpx;
  border-radius: 18rpx;
  background: #fff3f0;
  color: #b64a3d;
  font-size: 25rpx;
  line-height: 1.6;
  word-break: break-word;
}

.ledger-status__heading,
.ledger-account-type,
.ledger-agreement-heading,
.ledger-agreement {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.ledger-status__body {
  flex: 1;
  min-width: 0;
}

.ledger-status__label {
  display: block;
  color: #9298a1;
  font-size: 23rpx;
}

.ledger-status__title {
  display: block;
  margin-top: 10rpx;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.6;
}

.ledger-status__error {
  display: block;
  margin-top: 14rpx;
  color: #b64a3d;
  font-size: 24rpx;
  line-height: 1.6;
  word-break: break-word;
}

.ledger-sign {
  margin-top: 20rpx;
  padding-top: 8rpx;
  border-top: 1rpx solid #f0f1f3;
}

.ledger-section-title {
  display: block;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 1.5;
}

.ledger-account-type__value,
.ledger-agreement__name {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: #555b64;
  font-size: 26rpx;
}

.ledger-inline-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.ledger-fields {
  padding-bottom: 10rpx;
}

.ledger-fields__title {
  padding-bottom: 20rpx;
}

.ledger-field {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-height: 96rpx;
  border-top: 1rpx solid #f0f1f3;
}

.ledger-field__label {
  width: 224rpx;
  flex-shrink: 0;
  padding: 16rpx 0;
  color: #555b64;
  font-size: 26rpx;
  line-height: 1.6;
}

.ledger-required {
  margin-left: 6rpx;
  color: #cb6b56;
  font-size: 24rpx;
}

.ledger-field__input {
  flex: 1;
  min-width: 0;
  height: 88rpx;
  padding: 0;
  color: #24272b;
  font-size: 26rpx;
  text-align: right;
}

.ledger-field__placeholder {
  color: #b1b5bd;
}

.ledger-upload-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18rpx;
  margin-top: 24rpx;
}

.ledger-audit-documents {
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  border-radius: 14rpx;
  background: #fff8e8;
}

.ledger-audit-documents__missing {
  color: #94713b;
  font-size: 24rpx;
  line-height: 1.6;
}

.ledger-audit-documents .ledger-text-button {
  justify-content: flex-start;
  padding-left: 0;
  color: #94713b;
}

.ledger-upload {
  display: flex;
  min-width: 0;
  min-height: 208rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 24rpx 12rpx;
  border: 1rpx dashed #dce0e5;
  border-radius: 16rpx;
  box-sizing: border-box;
  background: #fafbfc;
  color: #666e79;
  line-height: 1.5;
}

.ledger-upload::after,
.ledger-button::after,
.ledger-text-button::after {
  border: 0;
}

.ledger-upload--complete {
  border-style: solid;
  border-color: #eadfbd;
  background: #fffcf4;
}

.ledger-upload[disabled] {
  color: #858a93;
}

.ledger-upload__icon {
  width: 38rpx;
  height: 38rpx;
  margin-bottom: 16rpx;
  color: #9aa0a9;
}

.ledger-upload--complete .ledger-upload__icon {
  color: #9b7a34;
}

.ledger-upload__title {
  font-size: 25rpx;
}

.ledger-upload__hint {
  margin-top: 8rpx;
  color: #9298a1;
  font-size: 22rpx;
}

.ledger-agreement-heading__count,
.ledger-agreement__state {
  color: #9298a1;
  font-size: 23rpx;
}

.ledger-agreement {
  min-height: 80rpx;
  margin-top: 12rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.ledger-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 88rpx;
  margin: 0;
  padding: 18rpx 24rpx;
  border: 1rpx solid #e3e6ea;
  border-radius: 18rpx;
  box-sizing: border-box;
  background: #fff;
  color: #363b42;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1.5;
}

.ledger-button--primary {
  border-color: #ffcf37;
  background: #ffcf37;
  color: #24272b;
  font-weight: 600;
}

.ledger-button[disabled] {
  opacity: 0.5;
}

.ledger-button--hover {
  opacity: 0.82;
}

.ledger-text-button {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  min-height: 64rpx;
  margin: 0;
  padding: 8rpx 0 8rpx 12rpx;
  border: 0;
  background: transparent;
  color: #767d87;
  font-size: 24rpx;
  line-height: 1.5;
}

.ledger-text-button[disabled] {
  background: transparent;
  color: #b1b5bd;
}

.ledger-sign__button,
.ledger-agreement__add {
  width: 100%;
  margin-top: 22rpx;
}

.ledger-agreement__add {
  min-height: 76rpx;
  font-size: 25rpx;
}

.ledger-privacy {
  display: block;
  margin: 24rpx 8rpx 0;
  color: #9298a1;
  font-size: 23rpx;
  line-height: 1.7;
}

.ledger-actions {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 24rpx calc(env(safe-area-inset-bottom) + 20rpx);
  border-top: 1rpx solid #eceef1;
  background: #fff;
}

.ledger-actions__draft {
  flex: 1;
}

.ledger-actions__submit {
  flex: 1.5;
}

.ledger-reload {
  width: 100%;
}
</style>
