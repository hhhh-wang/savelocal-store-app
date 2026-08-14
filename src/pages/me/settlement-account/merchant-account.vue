<script lang="ts" setup>
import {
  bindMerchantProfitSharingReceiver,
  getMerchantProfitSharingReceiver,
} from '@/api/merchant-profit-sharing'
import { useMerchantFoodStore } from '@/store'
import {
  buildMerchantBindRequest,
  resolveBoundAccountType,
  validateMerchantAccount,
} from './settlement-account'

defineOptions({ name: 'SettlementMerchantAccount' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '微信支付商户号',
  },
})

const merchantFoodStore = useMerchantFoodStore()
const loading = ref(false)
const submitting = ref(false)
const receiver = ref<Awaited<ReturnType<typeof getMerchantProfitSharingReceiver>>>()
const form = reactive({
  merchantId: '',
  merchantName: '',
})

const storeName = computed(() => merchantFoodStore.currentStore?.storeName || '当前门店')
const boundAccountType = computed(() => resolveBoundAccountType(receiver.value))
const isMerchantBound = computed(() => boundAccountType.value === 'merchant')
const isPersonalBound = computed(() => boundAccountType.value === 'personal')

onShow(() => {
  void loadPage()
})

async function loadPage() {
  loading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    receiver.value = await getMerchantProfitSharingReceiver(storeId)
  }
  catch (error) {
    console.error('加载商户号结算账户失败:', error)
  }
  finally {
    loading.value = false
  }
}

function confirmBinding() {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '确认绑定商户号',
      content: '提交后系统将向微信支付登记该分账接收方，请确认商户号和名称填写正确。',
      confirmText: '确认绑定',
      success: result => resolve(result.confirm),
      fail: () => resolve(false),
    })
  })
}

async function submitBinding() {
  if (submitting.value || boundAccountType.value)
    return

  const validationMessage = validateMerchantAccount(form.merchantId, form.merchantName)
  if (validationMessage) {
    uni.showToast({ title: validationMessage, icon: 'none' })
    return
  }

  if (!await confirmBinding())
    return

  submitting.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    receiver.value = await bindMerchantProfitSharingReceiver(buildMerchantBindRequest(storeId, form))
    uni.showToast({ title: '商户号绑定成功', icon: 'success' })
  }
  catch (error) {
    console.error('绑定微信支付商户号失败:', error)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="merchant-page">
    <view class="merchant-header">
      <back-button color="#25282d" background="transparent" size="64rpx" />
      <text class="merchant-header__title">微信支付商户号</text>
      <view class="merchant-header__spacer" />
    </view>

    <view class="merchant-content">
      <view class="merchant-status">
        <view class="merchant-status__topline">
          <view class="merchant-status__identity">
            <view class="i-carbon-store merchant-status__icon" />
            <view class="merchant-status__copy">
              <text class="merchant-status__eyebrow">{{ storeName }}</text>
              <text class="merchant-status__title">商户号结算</text>
            </view>
          </view>
          <view
            class="merchant-status__badge"
            :class="{ 'merchant-status__badge--bound': isMerchantBound }"
          >
            {{ loading ? '查询中' : isMerchantBound ? '已绑定' : '未绑定' }}
          </view>
        </view>

        <text v-if="isMerchantBound" class="merchant-status__account">
          {{ receiver?.receiverName || '微信支付商户' }} · {{ receiver?.receiverAccountMasked || '已绑定' }}
        </text>
        <text v-else-if="isPersonalBound" class="merchant-status__warning">
          当前门店已绑定个人微信，不能同时绑定微信支付商户号。
        </text>
        <text v-else-if="receiver?.syncFailReason" class="merchant-status__error">
          上次绑定失败：{{ receiver.syncFailReason }}
        </text>
      </view>

      <view v-if="loading && !receiver" class="merchant-panel merchant-panel--loading">
        <text>正在加载账户信息</text>
      </view>

      <view v-else-if="isPersonalBound" class="merchant-panel merchant-panel--notice">
        <view class="i-carbon-locked merchant-panel__notice-icon" />
        <text class="merchant-panel__title">暂时无法绑定</text>
        <text class="merchant-panel__desc">如需改用微信支付商户号，请联系平台运营解绑当前个人微信后再操作。</text>
      </view>

      <view v-else-if="isMerchantBound" class="merchant-panel merchant-panel--notice">
        <view class="i-carbon-checkmark-filled merchant-panel__notice-icon merchant-panel__notice-icon--success" />
        <text class="merchant-panel__title">绑定已完成</text>
        <text class="merchant-panel__desc">符合条件的订单会按分账规则结算到该微信支付商户号。</text>
        <text class="merchant-panel__hint">如需更换收款方式，请联系平台运营解绑。</text>
      </view>

      <view v-else class="merchant-panel">
        <text class="merchant-panel__title">填写商户信息</text>
        <text class="merchant-panel__desc">请填写作为分账接收方的微信支付商户信息。</text>

        <view class="merchant-form">
          <view class="merchant-field">
            <view class="merchant-field__label">
              <text>微信支付商户号</text>
              <text class="merchant-field__required">*</text>
            </view>
            <input
              v-model="form.merchantId"
              class="merchant-field__input"
              type="number"
              :maxlength="32"
              placeholder="请输入6至32位数字商户号"
              placeholder-class="merchant-field__placeholder"
              confirm-type="next"
            >
          </view>

          <view class="merchant-field">
            <view class="merchant-field__label">
              <text>商户全称</text>
              <text class="merchant-field__required">*</text>
            </view>
            <input
              v-model="form.merchantName"
              class="merchant-field__input"
              :maxlength="128"
              placeholder="企业填全称，个体户填开户人姓名"
              placeholder-class="merchant-field__placeholder"
              confirm-type="done"
              @confirm="submitBinding"
            >
          </view>
        </view>

        <view class="merchant-panel__safe">
          <view class="i-carbon-security merchant-panel__safe-icon" />
          <text>商户信息将通过微信支付接口登记</text>
        </view>

        <button class="merchant-submit" :loading="submitting" :disabled="submitting" @tap="submitBinding">
          确认绑定
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.merchant-page {
  min-height: 100vh;
  background: #f4f5f7;
  color: #202328;
}

.merchant-header {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  min-height: 88rpx;
  padding: calc(env(safe-area-inset-top) + 12rpx) 24rpx 12rpx;
  border-bottom: 1rpx solid #eceef1;
  background: #fff;
}

.merchant-header__title {
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
}

.merchant-header__spacer {
  width: 64rpx;
  height: 64rpx;
}

.merchant-content {
  padding: 28rpx 28rpx calc(env(safe-area-inset-bottom) + 48rpx);
}

.merchant-status,
.merchant-panel {
  border: 1rpx solid #e7e9ec;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 10rpx 24rpx rgba(26, 32, 44, 0.05);
}

.merchant-status {
  padding: 26rpx;
}

.merchant-status__topline,
.merchant-status__identity {
  display: flex;
  align-items: center;
}

.merchant-status__topline {
  justify-content: space-between;
  gap: 18rpx;
}

.merchant-status__identity {
  min-width: 0;
  gap: 18rpx;
}

.merchant-status__icon {
  width: 58rpx;
  height: 58rpx;
  flex-shrink: 0;
  color: #a76700;
}

.merchant-status__copy {
  min-width: 0;
}

.merchant-status__eyebrow,
.merchant-status__title,
.merchant-status__account,
.merchant-status__warning,
.merchant-status__error {
  display: block;
}

.merchant-status__eyebrow {
  overflow: hidden;
  color: #808790;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.merchant-status__title {
  margin-top: 6rpx;
  font-size: 31rpx;
  font-weight: 700;
}

.merchant-status__badge {
  flex-shrink: 0;
  color: #8c929a;
  font-size: 23rpx;
}

.merchant-status__badge--bound {
  color: #14855d;
}

.merchant-status__account,
.merchant-status__warning,
.merchant-status__error {
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #eef0f2;
  color: #59616b;
  font-size: 25rpx;
  line-height: 1.5;
}

.merchant-status__warning {
  color: #8a6415;
}

.merchant-status__error {
  color: #c94444;
}

.merchant-panel {
  margin-top: 20rpx;
  padding: 32rpx 28rpx;
}

.merchant-panel--loading,
.merchant-panel--notice {
  text-align: center;
}

.merchant-panel--loading {
  color: #8a9098;
  font-size: 26rpx;
}

.merchant-panel__title,
.merchant-panel__desc,
.merchant-panel__hint {
  display: block;
}

.merchant-panel__title {
  font-size: 31rpx;
  font-weight: 700;
}

.merchant-panel__desc {
  margin-top: 12rpx;
  color: #737b84;
  font-size: 25rpx;
  line-height: 1.65;
}

.merchant-panel__hint {
  margin-top: 12rpx;
  color: #969ca4;
  font-size: 23rpx;
  line-height: 1.55;
}

.merchant-panel__notice-icon {
  width: 54rpx;
  height: 54rpx;
  margin: 0 auto 18rpx;
  color: #a07018;
}

.merchant-panel__notice-icon--success {
  color: #14855d;
}

.merchant-form {
  margin-top: 26rpx;
  border-top: 1rpx solid #eceef1;
}

.merchant-field {
  padding: 24rpx 0 20rpx;
  border-bottom: 1rpx solid #eceef1;
}

.merchant-field__label {
  display: flex;
  align-items: center;
  gap: 4rpx;
  color: #34383e;
  font-size: 26rpx;
  font-weight: 600;
}

.merchant-field__required {
  color: #d93f3f;
}

.merchant-field__input {
  width: 100%;
  height: 72rpx;
  margin-top: 8rpx;
  color: #202328;
  font-size: 29rpx;
  line-height: 72rpx;
}

.merchant-field__placeholder {
  color: #a8adb4;
}

.merchant-panel__safe {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 20rpx;
  color: #668073;
  font-size: 23rpx;
  line-height: 1.5;
}

.merchant-panel__safe-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.merchant-submit {
  width: 100%;
  height: 84rpx;
  margin-top: 28rpx;
  border: 0;
  border-radius: 16rpx;
  background: #222a32;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 84rpx;
}

.merchant-submit[disabled] {
  opacity: 0.62;
}

.merchant-submit::after {
  border: 0;
}
</style>
