<script lang="ts" setup>
import loginImage from '@/static/images/login.png'

defineOptions({
  name: 'ForgotPassword',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '找回密码',
  },
  excludeLoginPath: true,
})

const isSubmitting = ref(false)

const form = reactive({
  mobile: '',
  smsCode: '',
  password: '',
  confirmPassword: '',
})

function showPendingToast(title: string) {
  uni.showToast({
    title,
    icon: 'none',
  })
}

function validateForm() {
  const mobile = form.mobile.trim()
  const smsCode = form.smsCode.trim()
  const password = form.password.trim()
  const confirmPassword = form.confirmPassword.trim()

  if (!/^1\d{10}$/.test(mobile)) {
    showPendingToast('请输入正确的手机号')
    return false
  }

  if (!smsCode) {
    showPendingToast('请输入短信验证码')
    return false
  }

  if (!password) {
    showPendingToast('请输入新密码')
    return false
  }

  if (password.length < 5 || password.length > 20) {
    showPendingToast('密码长度需为5到20位')
    return false
  }

  if (password !== confirmPassword) {
    showPendingToast('两次输入的密码不一致')
    return false
  }

  return true
}

function handleSendCode() {
  if (!/^1\d{10}$/.test(form.mobile.trim())) {
    showPendingToast('请先输入正确的手机号')
    return
  }

  showPendingToast('短信验证码发送待接入')
}

function handleLoginBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: '/pages/login/index',
  })
}

async function handleSubmit() {
  if (isSubmitting.value) {
    return
  }

  if (!validateForm()) {
    return
  }

  try {
    isSubmitting.value = true
    showPendingToast('找回密码接口待接入')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <view class="forgot-page">
    <view class="forgot-hero">
      <view class="forgot-hero__nav">
        <back-button
          fallback-url="/pages/login/index"
          fallback-mode="navigateTo"
          color="#7b5a00"
          background="rgba(255, 255, 255, 0.28)"
          size="68rpx"
        />
      </view>

      <view class="forgot-hero__content">
        <view class="forgot-hero__copy">
          <text class="forgot-hero__title">
            找回密码
          </text>
          <text class="forgot-hero__subtitle">
            通过手机号重置密码
          </text>
        </view>

        <image class="forgot-hero__image" :src="loginImage" mode="widthFix" />
      </view>
    </view>

    <view class="forgot-panel">
      <view class="forgot-form">
        <input
          v-model="form.mobile"
          class="forgot-input"
          type="number"
          :maxlength="11"
          placeholder="输入手机号"
          placeholder-class="forgot-input__placeholder"
        />

        <view class="forgot-code">
          <input
            v-model="form.smsCode"
            class="forgot-code__input"
            type="number"
            :maxlength="6"
            placeholder="输入短信验证码"
            placeholder-class="forgot-input__placeholder"
          />

          <text class="forgot-code__action" @tap="handleSendCode">
            获取验证码
          </text>
        </view>

        <input
          v-model="form.password"
          class="forgot-input forgot-input--spaced"
          type="text"
          :password="true"
          :maxlength="20"
          placeholder="输入新密码"
          placeholder-class="forgot-input__placeholder"
        />

        <input
          v-model="form.confirmPassword"
          class="forgot-input forgot-input--spaced"
          type="text"
          :password="true"
          :maxlength="20"
          placeholder="确认新密码"
          placeholder-class="forgot-input__placeholder"
        />

        <view class="forgot-login-link" @tap="handleLoginBack">
          返回登录
        </view>

        <view class="forgot-submit" hover-class="forgot-submit--hover" @tap="handleSubmit">
          {{ isSubmitting ? '提交中...' : '确认找回' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.forgot-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffcb2f 0%, #ffcb2f 400rpx, #f7f7f7 400rpx, #f7f7f7 100%);
}

.forgot-hero {
  position: relative;
  z-index: 1;
  padding: calc(env(safe-area-inset-top) + 18rpx) 20rpx 0;
  background: linear-gradient(180deg, #ffcb2f 0%, #ffcb2f 100%);
}

.forgot-hero__nav {
  position: relative;
  z-index: 2;
}

.forgot-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 320rpx;
  margin-top: 24rpx;
  margin-bottom: 40rpx;
}

.forgot-hero__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18rpx;
  padding: 0 12rpx 96rpx;
}

.forgot-hero__title {
  color: #5d4600;
  font-size: 58rpx;
  font-weight: 800;
  line-height: 1.1;
}

.forgot-hero__subtitle {
  color: #6f5600;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

.forgot-hero__image {
  width: 400rpx;
  max-width: 52%;
  flex-shrink: 0;
  display: block;
}

.forgot-panel {
  position: relative;
  z-index: 3;
  min-height: calc(100vh - env(safe-area-inset-top) - 360rpx);
  margin-top: -82rpx;
  padding: 72rpx 28rpx calc(env(safe-area-inset-bottom) + 52rpx);
  border-top-left-radius: 52rpx;
  border-top-right-radius: 52rpx;
  background: #f7f7f7;
  box-shadow: 0 -6rpx 20rpx rgba(255, 255, 255, 0.18);
  box-sizing: border-box;
}

.forgot-form {
  padding: 0 16rpx;
}

.forgot-input {
  width: 100%;
  height: 96rpx;
  padding: 0 40rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #f7f0d0 0%, #f9f4db 100%);
  color: #353535;
  font-size: 32rpx;
  box-sizing: border-box;
}

.forgot-input--spaced {
  margin-top: 28rpx;
}

.forgot-input__placeholder {
  color: #d0cab5;
  font-size: 32rpx;
}

.forgot-code {
  display: flex;
  align-items: center;
  height: 96rpx;
  margin-top: 28rpx;
  padding: 0 34rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #f7f0d0 0%, #f9f4db 100%);
  box-sizing: border-box;
}

.forgot-code__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  color: #353535;
  font-size: 32rpx;
}

.forgot-code__action {
  flex-shrink: 0;
  color: #ffae12;
  font-size: 28rpx;
  font-weight: 500;
}

.forgot-login-link {
  margin-top: 42rpx;
  color: #ababab;
  font-size: 28rpx;
  line-height: 1.2;
  text-align: center;
}

.forgot-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  margin-top: 42rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #ffd54f 0%, #ffc83b 100%);
  color: #2e2410;
  font-size: 40rpx;
  font-weight: 700;
  box-shadow: 0 18rpx 36rpx rgba(255, 188, 42, 0.26);
}

.forgot-submit--hover {
  transform: translateY(2rpx);
}
</style>
