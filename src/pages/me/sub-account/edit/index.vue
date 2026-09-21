<script lang="ts" setup>
import type { SubAccount, SubAccountForm } from '../sub-account'
import { subAccountStores } from '../sub-account'

interface OpenerEventChannel {
  emit: (eventName: string, ...args: any[]) => void
}

defineOptions({ name: 'SubAccountEdit' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '新建子账号',
    backgroundColor: '#f5f5f5',
  },
})

const fallbackUrl = '/pages/me/sub-account/index'
const accountId = ref('')
const selectionVisible = ref(false)
const pendingStoreNames = ref<string[]>([])
const errorMessage = ref('')
let openerEventChannel: OpenerEventChannel | null = null

const form = reactive({
  username: '',
  password: '',
  mobile: '',
  merchantName: '',
  storeNames: [] as string[],
})

const isEditing = computed(() => !!accountId.value)
const pageTitle = computed(() => isEditing.value ? '编辑子账号' : '新建子账号')
const selectedStoreText = computed(() => form.storeNames.join('、'))

function parseAccount(rawAccount?: string) {
  if (!rawAccount)
    return
  try {
    const account = JSON.parse(decodeURIComponent(rawAccount)) as SubAccount
    accountId.value = account.id
    form.username = account.username
    form.mobile = account.mobile
    form.merchantName = account.merchantName
    form.storeNames = [...account.storeNames]
  }
  catch {
    uni.showToast({ title: '账号数据读取失败', icon: 'none' })
  }
}

function openStoreSelection() {
  errorMessage.value = ''
  pendingStoreNames.value = [...form.storeNames]
  selectionVisible.value = true
}

function closeSelection() {
  selectionVisible.value = false
}

function togglePendingStore(storeName: string) {
  pendingStoreNames.value = pendingStoreNames.value.includes(storeName)
    ? pendingStoreNames.value.filter(name => name !== storeName)
    : [...pendingStoreNames.value, storeName]
}

function confirmSelection() {
  form.storeNames = [...pendingStoreNames.value]
  closeSelection()
}

function validatePassword() {
  const password = form.password
  if (isEditing.value && !password)
    return true
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,20}$/.test(password)
}

function saveAccount() {
  const username = form.username.trim()
  const mobile = form.mobile.trim()
  if (!/^\w{5,20}$/.test(username)) {
    errorMessage.value = '账号名称需为5-20位数字、字母或下划线'
    return
  }
  if (!validatePassword()) {
    errorMessage.value = '密码需为8-20位，并包含大小写字母和数字或特殊字符'
    return
  }
  if (mobile && !/^1[3-9]\d{9}$/.test(mobile)) {
    errorMessage.value = '请输入正确的11位手机号'
    return
  }
  if (!form.storeNames.length) {
    errorMessage.value = '请选择管理门店'
    return
  }

  errorMessage.value = ''
  uni.hideKeyboard()
  const payload: SubAccountForm = {
    username,
    password: form.password || undefined,
    mobile,
    merchantName: form.merchantName.trim() || '未填写',
    storeNames: [...form.storeNames],
  }
  openerEventChannel?.emit('save', payload)
  uni.navigateBack()
}

onLoad((options) => {
  parseAccount(options?.account)
  const currentPage = getCurrentPages()[getCurrentPages().length - 1] as {
    getOpenerEventChannel?: () => OpenerEventChannel
  } | undefined
  openerEventChannel = currentPage?.getOpenerEventChannel?.() || null
})
</script>

<template>
  <view class="sub-account-edit-page">
    <view class="sub-account-edit-nav">
      <back-button
        :fallback-url="fallbackUrl"
        fallback-mode="navigateTo"
        color="#262626"
        background="transparent"
        size="64rpx"
      />
      <text class="sub-account-edit-nav__title">{{ pageTitle }}</text>
      <view class="sub-account-edit-nav__spacer" />
    </view>

    <scroll-view class="sub-account-edit-content" scroll-y>
      <view class="sub-account-edit-fields">
        <view class="sub-account-edit-field">
          <view class="sub-account-edit-field__label">
            <text>账号名称</text>
            <text class="sub-account-edit-field__required">*</text>
          </view>
          <input
            v-model="form.username"
            class="sub-account-edit-field__input"
            placeholder="5-20位，可使用数字、字母及下划线"
            placeholder-class="sub-account-edit-field__placeholder"
            :maxlength="20"
          >
        </view>

        <view class="sub-account-edit-field">
          <view class="sub-account-edit-field__label">
            <text>密码</text>
            <text class="sub-account-edit-field__required">*</text>
          </view>
          <input
            v-model="form.password"
            class="sub-account-edit-field__input"
            :placeholder="isEditing ? '不修改请留空' : '8~20位,需包含大小写字母和数字或特殊字符'"
            placeholder-class="sub-account-edit-field__placeholder"
            password
            :maxlength="20"
          >
        </view>

        <view class="sub-account-edit-field">
          <text class="sub-account-edit-field__label">手机号</text>
          <input
            v-model="form.mobile"
            class="sub-account-edit-field__input sub-account-edit-field__input--right"
            type="number"
            placeholder="请输入"
            placeholder-class="sub-account-edit-field__placeholder"
            :maxlength="11"
          >
        </view>

        <view class="sub-account-edit-field sub-account-edit-field--merchant">
          <text class="sub-account-edit-field__label">商家名称</text>
          <input
            v-model="form.merchantName"
            class="sub-account-edit-field__input sub-account-edit-field__input--right"
            placeholder="请输入"
            placeholder-class="sub-account-edit-field__placeholder"
            :maxlength="30"
          >
          <text class="sub-account-edit-field__description">商家名称将显示在账号登录页，用于备注或区分账号</text>
        </view>

        <button class="sub-account-edit-field sub-account-edit-field--selector" @tap="openStoreSelection">
          <view class="sub-account-edit-field__label">
            <text>管理门店</text>
            <text class="sub-account-edit-field__required">*</text>
          </view>
          <text class="sub-account-edit-field__selection" :class="{ 'sub-account-edit-field__selection--chosen': selectedStoreText }">
            {{ selectedStoreText || '请选择' }}
          </text>
          <view class="sub-account-edit-field__arrow" />
        </button>
      </view>
      <text v-if="errorMessage" class="sub-account-edit-error" role="alert">{{ errorMessage }}</text>
    </scroll-view>

    <view class="sub-account-edit-footer">
      <button class="sub-account-edit-footer__button" hover-class="sub-account-edit-footer__button--hover" @tap="saveAccount">
        保存
      </button>
    </view>

    <view v-if="selectionVisible" class="sub-account-selector">
      <view class="sub-account-selector__mask" @tap="closeSelection" @touchmove.stop.prevent />
      <view class="sub-account-selector__panel" @touchmove.stop>
        <view class="sub-account-selector__header">
          <text class="sub-account-selector__title">选择管理门店</text>
          <button class="sub-account-selector__close" aria-label="关闭" @tap="closeSelection">
            <view class="i-carbon-close" />
          </button>
        </view>
        <scroll-view class="sub-account-selector__list" scroll-y>
          <button
            v-for="storeName in subAccountStores"
            :key="storeName"
            class="sub-account-selector__item"
            :class="{ 'sub-account-selector__item--selected': pendingStoreNames.includes(storeName) }"
            :aria-pressed="pendingStoreNames.includes(storeName)"
            @tap="togglePendingStore(storeName)"
          >
            <text>{{ storeName }}</text>
            <view class="sub-account-selector__check">
              <view v-if="pendingStoreNames.includes(storeName)" class="i-carbon-checkmark" />
            </view>
          </button>
        </scroll-view>
        <view class="sub-account-selector__footer">
          <button class="sub-account-selector__cancel" @tap="closeSelection">
            取消
          </button>
          <button class="sub-account-selector__confirm" @tap="confirmSelection">
            确定
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sub-account-edit-page {
  min-height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
  color: #262626;
}

.sub-account-edit-nav {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  min-height: 88rpx;
  padding: var(--status-bar-height, 0px) 12rpx 0;
  background: #fff;
}

.sub-account-edit-nav__title {
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
}

.sub-account-edit-nav__spacer {
  width: 64rpx;
}

.sub-account-edit-content {
  height: calc(100vh - var(--status-bar-height, 0px) - 208rpx);
}

.sub-account-edit-fields {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 20rpx 12rpx 136rpx;
}

.sub-account-edit-field {
  display: flex;
  align-items: center;
  gap: 22rpx;
  min-height: 102rpx;
  padding: 16rpx 24rpx;
  border-radius: 18rpx;
  box-sizing: border-box;
  background: #fff;
}

.sub-account-edit-field--merchant {
  position: relative;
  min-height: 150rpx;
  padding-bottom: 50rpx;
}

.sub-account-edit-field--selector {
  width: 100%;
  margin: 0;
  border: 0;
  color: inherit;
  text-align: left;
}

.sub-account-edit-field__label {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: #555;
  font-size: 30rpx;
  line-height: 42rpx;
}

.sub-account-edit-field__required {
  margin-left: 8rpx;
  color: #e55050;
}

.sub-account-edit-field__input {
  min-width: 0;
  height: 70rpx;
  flex: 1;
  color: #333;
  font-size: 29rpx;
}

.sub-account-edit-field__input--right {
  text-align: right;
}

.sub-account-edit-field__placeholder,
.sub-account-edit-field__selection {
  color: #c1c1c1;
}

.sub-account-edit-field__description {
  position: absolute;
  right: 24rpx;
  bottom: 16rpx;
  left: 24rpx;
  overflow: hidden;
  color: #a4a4a4;
  font-size: 23rpx;
  line-height: 32rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-account-edit-field__selection {
  min-width: 0;
  overflow: hidden;
  flex: 1;
  font-size: 29rpx;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-account-edit-field__selection--chosen {
  color: #555;
}

.sub-account-edit-field__arrow {
  width: 17rpx;
  height: 17rpx;
  flex-shrink: 0;
  margin-left: 4rpx;
  border-top: 4rpx solid #999;
  border-right: 4rpx solid #999;
  transform: rotate(45deg);
}

.sub-account-edit-error {
  display: block;
  margin: -4rpx 24rpx 0;
  color: #e55050;
  font-size: 24rpx;
}

.sub-account-edit-footer {
  position: fixed;
  z-index: 10;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 20rpx 24rpx calc(env(safe-area-inset-bottom) + 20rpx);
  background: #fff;
}

.sub-account-edit-footer__button {
  height: 88rpx;
  margin: 0;
  padding: 0;
  border-radius: 12rpx;
  background: #ffd600;
  color: #262626;
  font-size: 32rpx;
  line-height: 88rpx;
}

.sub-account-edit-footer__button--hover {
  opacity: 0.75;
}

.sub-account-selector {
  position: fixed;
  z-index: 100;
  inset: 0;
}

.sub-account-selector__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.sub-account-selector__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  border-radius: 24rpx 24rpx 0 0;
  background: #fff;
}

.sub-account-selector__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.sub-account-selector__title {
  font-size: 30rpx;
  font-weight: 600;
}

.sub-account-selector__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  margin: 0;
  padding: 0;
  background: transparent;
  color: #888;
  font-size: 34rpx;
}

.sub-account-selector__list {
  max-height: 620rpx;
}

.sub-account-selector__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  width: 100%;
  min-height: 92rpx;
  margin: 0;
  padding: 18rpx 28rpx;
  border-bottom: 1rpx solid #f3f3f3;
  border-radius: 0;
  box-sizing: border-box;
  background: #fff;
  color: #444;
  font-size: 28rpx;
  text-align: left;
}

.sub-account-selector__item--selected {
  background: #fffdf1;
}

.sub-account-selector__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
  border: 1rpx solid #d4d4d4;
  border-radius: 6rpx;
}

.sub-account-selector__item--selected .sub-account-selector__check {
  border-color: #ffd600;
  background: #ffd600;
}

.sub-account-selector__footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 24rpx calc(env(safe-area-inset-bottom) + 20rpx);
}

.sub-account-selector__cancel,
.sub-account-selector__confirm {
  height: 80rpx;
  flex: 1;
  margin: 0;
  padding: 0;
  border-radius: 12rpx;
  font-size: 30rpx;
  line-height: 80rpx;
}

.sub-account-selector__cancel {
  background: #f4f4f4;
  color: #666;
}

.sub-account-selector__confirm {
  background: #ffd600;
  color: #262626;
}

.sub-account-edit-field--selector::after,
.sub-account-edit-footer__button::after,
.sub-account-selector__close::after,
.sub-account-selector__item::after,
.sub-account-selector__cancel::after,
.sub-account-selector__confirm::after {
  border: 0;
}
</style>
