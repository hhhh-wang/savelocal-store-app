<script setup lang="ts">
import type { LedgerMaterials, LedgerView } from '@/api/merchant-ledger'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { emptyLedgerMaterials, getLedger, refreshLedger, saveLedger, uploadLedgerFile } from '@/api/merchant-ledger'

const props = defineProps<{ storeId: string }>()
const view = ref<LedgerView>()
const form = reactive<LedgerMaterials>(emptyLedgerMaterials())
const busy = ref(false)
const loading = ref(true)
const error = ref('')
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
  { key: 'bankCode', label: '开户总行代码' },
  { key: 'bankName', label: '开户总行名称' },
  { key: 'bankBranchCode', label: '开户支行联行号' },
  { key: 'bankBranchName', label: '开户支行名称' },
]
const groups = computed(() => [
  ...(form.merchType === '1' ? [{ title: '营业执照', fields: corporateFields }] : []),
  { title: '法人资料', fields: legalFields },
  { title: '结算银行卡', fields: bankFields },
])
const imageFields = computed<Field[]>(() => [
  ...(form.merchType === '1' ? [{ key: 'licenseFileId' as const, label: '营业执照照片' }] : []),
  { key: 'legalFrontFileId', label: '法人身份证正面' },
  { key: 'legalBackFileId', label: '法人身份证反面' },
  { key: 'bankFileId', label: '结算银行卡照片' },
])
const disabled = computed(() => busy.value || !view.value?.editable)

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
  busy.value = true
  error.value = ''
  try {
    apply(await saveLedger(props.storeId, view.value.version, { ...form }, submit))
    uni.showToast({ title: submit ? '收款资料已提交' : '草稿已保存', icon: 'success' })
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
  <view class="min-h-screen bg-[#f5f7fa] p-4 text-[#23262c]">
    <view class="mb-4 rounded-3 bg-white p-4">
      <text class="block text-lg font-semibold">开通商家收款</text>
      <text class="mt-2 block text-sm text-[#667085]">完善资料 → 门店二审通过 → 嘉联开户 → 法人签约 → 绑定审核通过</text>
      <text class="mt-2 block text-sm text-[#667085]">硕米为出账方，商家为入账方。对私账户须使用法人本人银行卡，对公账户使用企业账户。</text>
    </view>
    <view v-if="loading" class="p-4 text-center">
      正在加载收款资料…
    </view>
    <view v-if="error" class="mb-4 rounded-3 bg-[#fff1f0] p-4 text-sm text-[#d4380d]">
      {{ error }}
    </view>
    <view v-if="view" class="mb-4 rounded-3 bg-white p-4">
      <text class="block font-semibold">{{ view.stateLabel }}</text>
      <text v-if="view.lastError" class="mt-2 block text-sm text-[#d4380d]">{{ view.lastError }}</text>
      <text v-if="!view.initialAuditPassed" class="mt-2 block text-sm text-[#667085]">门店初审通过后，可在这里继续填写收款资料。</text>
      <text v-if="view.enabled && view.initialAuditPassed && !view.profileApproved" class="mt-2 block text-sm text-[#667085]">可先保存或提交收款资料，门店资料二审通过后才会发起嘉联开户。</text>
      <view v-if="view.signLink" class="mt-3">
        <text class="mb-2 block text-sm">请将签约链接交给法人本人，用浏览器打开并完成嘉联电子签约。</text>
        <button class="bg-[#1677ff] text-white" @click="copySignLink">
          复制法人签约链接
        </button>
      </view>
      <button v-if="view.enabled && !view.editable" class="mt-3 text-sm" :disabled="busy" @click="refresh">
        刷新开户进度
      </button>
    </view>
    <template v-if="view?.enabled && view.initialAuditPassed">
      <view class="mb-4 rounded-3 bg-white p-4">
        <text class="mb-2 block font-semibold">收款账户类型</text>
        <picker :disabled="disabled" :range="['法人对私银行卡', '企业对公账户']" :value="form.merchType === '1' ? 1 : 0" @change="changeType">
          <view class="rounded-2 bg-[#f5f7fa] p-3">
            {{ form.merchType === '1' ? '企业对公账户' : '法人对私银行卡' }}
          </view>
        </picker>
      </view>
      <view v-for="group in groups" :key="group.title" class="mb-4 rounded-3 bg-white p-4">
        <text class="mb-3 block font-semibold">{{ group.title }}</text>
        <view v-for="field in group.fields" :key="field.key" class="mb-3">
          <text class="mb-1 block text-sm">{{ field.label }} *</text>
          <input v-model="form[field.key]" :disabled="disabled" :maxlength="256" class="h-11 rounded-2 bg-[#f5f7fa] px-3 text-sm" :placeholder="field.hint || (`请填写${field.label}`)">
        </view>
      </view>
      <view class="mb-4 rounded-3 bg-white p-4">
        <text class="mb-3 block font-semibold">证件及银行卡照片</text>
        <view v-for="field in imageFields" :key="field.key" class="mb-3 flex items-center justify-between gap-2">
          <text class="text-sm">{{ field.label }}</text>
          <button :disabled="disabled" class="m-0 text-sm" @click="upload(field.key)">
            {{ form[field.key] ? '已上传，点击更换' : '上传图片' }}
          </button>
        </view>
        <text class="text-xs text-[#667085]">支持5MB以内的PNG、JPG图片，资料仅用于收款开户。</text>
      </view>
      <view class="mb-4 rounded-3 bg-white p-4">
        <text class="block font-semibold">分账合作协议 *</text>
        <text class="my-2 block text-sm text-[#667085]">上传硕米与商家双方签署的合作协议，包含分账比例约定，最多20张。</text>
        <view v-for="(file, index) in form.agreementFileIds" :key="file + index" class="mb-2 flex items-center justify-between">
          <text class="text-sm">协议图片 {{ index + 1 }} · 已上传</text>
          <button v-if="!disabled" class="m-0 text-sm" @click="form.agreementFileIds.splice(index, 1)">
            移除
          </button>
        </view>
        <button :disabled="disabled" class="text-sm" @click="upload()">
          添加协议图片
        </button>
      </view>
      <view v-if="view.editable" class="mb-8 flex gap-3">
        <button class="flex-1 text-sm" :disabled="busy" @click="save(false)">
          保存草稿
        </button>
        <button class="flex-1 bg-[#1677ff] text-sm text-white" :disabled="busy" :loading="busy" @click="save(true)">
          提交收款资料
        </button>
      </view>
    </template>
    <button v-if="!view && !loading" @click="load">
      重新加载
    </button>
  </view>
</template>
