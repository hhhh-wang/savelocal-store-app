<script lang="ts" setup>
import type { IMerchantRegisterForm } from '@/api/login'
import type { ICaptcha } from '@/api/types/login'
import { getCaptcha, register, sendVerificationCodeSms } from '@/api/login'
import registerImage from '@/static/images/register.png'

defineOptions({
  name: 'MerchantRegister',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '账号注册',
  },
  excludeLoginPath: true,
})

interface RegisterFormState extends IMerchantRegisterForm {
  confirmPassword: string
  captchaCode: string
  captchaUuid: string
}

const isSubmitting = ref(false)
const SMS_COUNTDOWN_SECONDS = 60
const smsCountdown = ref(0)
const isSendingSms = ref(false)
const captchaEnabled = ref(true)
const captchaImageUrl = ref('')
let smsCountdownTimer: ReturnType<typeof setInterval> | null = null

const form = reactive<RegisterFormState>({
  password: '',
  confirmPassword: '',
  mobile: '',
  smsCode: '',
  captchaCode: '',
  captchaUuid: '',
})

onLoad(() => {
  void fetchCaptcha()
})

onUnload(() => {
  clearSmsCountdown()
})

async function fetchCaptcha() {
  try {
    const captcha: ICaptcha = await getCaptcha()
    captchaEnabled.value = captcha.captchaEnabled ?? true

    if (!captchaEnabled.value) {
      captchaImageUrl.value = ''
      form.captchaCode = ''
      form.captchaUuid = ''
      return
    }

    const base64Image = captcha.image || captcha.img || ''
    captchaImageUrl.value = base64Image ? `data:image/gif;base64,${base64Image}` : ''
    form.captchaCode = ''
    form.captchaUuid = captcha.uuid || ''
  }
  catch (error) {
    console.error('获取注册验证码失败:', error)
    captchaEnabled.value = false
    captchaImageUrl.value = ''
    form.captchaCode = ''
    form.captchaUuid = ''
  }
}

function clearSmsCountdown() {
  if (smsCountdownTimer) {
    clearInterval(smsCountdownTimer)
    smsCountdownTimer = null
  }
  smsCountdown.value = 0
}

function startSmsCountdown() {
  clearSmsCountdown()
  smsCountdown.value = SMS_COUNTDOWN_SECONDS
  smsCountdownTimer = setInterval(() => {
    if (smsCountdown.value <= 1) {
      clearSmsCountdown()
      return
    }
    smsCountdown.value -= 1
  }, 1000)
}

function showPendingToast(title: string) {
  uni.showToast({
    title,
    icon: 'none',
  })
}

async function handleSendSmsCode() {
  if (isSendingSms.value || smsCountdown.value > 0) {
    return
  }

  const mobile = form.mobile.trim()
  const captchaCode = form.captchaCode.trim()
  if (!/^1\d{10}$/.test(mobile)) {
    showPendingToast('请先输入正确的手机号')
    return
  }

  if (captchaEnabled.value && !captchaCode) {
    showPendingToast('请输入图形验证码')
    return
  }

  try {
    isSendingSms.value = true
    await sendVerificationCodeSms(
      mobile,
      captchaEnabled.value ? captchaCode : undefined,
      captchaEnabled.value ? form.captchaUuid : undefined,
    )
    startSmsCountdown()
    uni.showToast({
      title: '验证码已发送',
      icon: 'success',
    })
  }
  catch (error) {
    console.error('发送注册短信验证码失败:', error)
  }
  finally {
    isSendingSms.value = false
    if (captchaEnabled.value) {
      await fetchCaptcha()
    }
  }
}

function validateRegisterForm() {
  const password = form.password.trim()
  const confirmPassword = form.confirmPassword.trim()
  const mobile = form.mobile.trim()
  const smsCode = form.smsCode.trim()

  if (!/^1\d{10}$/.test(mobile)) {
    showPendingToast('请输入正确的手机号')
    return false
  }

  if (!password) {
    showPendingToast('请输入您的密码')
    return false
  }

  if (password.length < 5 || password.length > 20) {
    showPendingToast('密码长度需为5到20位')
    return false
  }

  if (confirmPassword !== password) {
    showPendingToast('两次输入的密码不一致')
    return false
  }

  if (!smsCode) {
    showPendingToast('请输入短信验证码')
    return false
  }

  return true
}

function goToLogin() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: '/pages/login/index',
  })
}

async function handleRegister() {
  if (isSubmitting.value) {
    return
  }

  if (!validateRegisterForm()) {
    return
  }

  try {
    isSubmitting.value = true
    await register({
      password: form.password,
      mobile: form.mobile.trim(),
      smsCode: form.smsCode.trim(),
    })

    uni.showToast({
      title: '注册成功',
      icon: 'success',
    })

    setTimeout(() => {
      uni.redirectTo({
        url: '/pages/login/index',
      })
    }, 600)
  }
  catch (error) {
    console.error('商家注册失败:', error)
    form.smsCode = ''
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <view class="register-page">
    <view class="register-hero">
      <view class="register-hero__nav">
        <back-button
          fallback-url="/pages/login/index"
          fallback-mode="navigateTo"
          color="#7b5a00"
          background="rgba(255, 255, 255, 0.28)"
          size="68rpx"
        />
      </view>

      <view class="register-hero__content">
        <view class="register-hero__copy">
          <text class="register-hero__title">
            账号注册
          </text>
          <text class="register-hero__subtitle">
            欢迎来到省哒
          </text>
        </view>

        <image class="register-hero__image" :src="registerImage" mode="widthFix" />
      </view>
    </view>

    <view class="register-panel">
      <view class="register-form">
        <view class="register-field">
          <input
            v-model="form.mobile"
            class="register-input"
            type="number"
            :maxlength="11"
            placeholder="手机号"
            placeholder-class="register-input__placeholder"
          >
          <text class="register-field__required">
            *
          </text>
        </view>

        <view class="register-field register-field--spaced">
          <input
            v-model="form.password"
            class="register-input"
            type="text"
            :password="true"
            :maxlength="20"
            placeholder="您的密码"
            placeholder-class="register-input__placeholder"
          >
          <text class="register-field__required register-field__required--success">
            *
          </text>
        </view>

        <view class="register-field register-field--spaced">
          <input
            v-model="form.confirmPassword"
            class="register-input"
            type="text"
            :password="true"
            :maxlength="20"
            placeholder="确认密码"
            placeholder-class="register-input__placeholder"
          >
          <text class="register-field__required">
            *
          </text>
        </view>

        <view v-if="captchaEnabled" class="register-captcha">
          <view class="register-captcha__preview" hover-class="register-captcha__preview--hover" @tap="fetchCaptcha">
            <image
              v-if="captchaImageUrl"
              class="register-captcha__image"
              :src="captchaImageUrl"
              mode="aspectFill"
            />
            <text v-else class="register-captcha__refresh">
              换一张
            </text>
          </view>

          <input
            v-model="form.captchaCode"
            class="register-captcha__input"
            type="text"
            :maxlength="10"
            placeholder="请输入验证码"
            placeholder-class="register-input__placeholder"
          >
        </view>

        <view class="register-phone-code">
          <input
            v-model="form.smsCode"
            class="register-phone-code__input"
            type="number"
            :maxlength="6"
            placeholder="请输入短信验证码"
            placeholder-class="register-input__placeholder"
          >
          <text
            class="register-phone-code__action"
            :class="{ 'register-phone-code__action--disabled': isSendingSms || smsCountdown > 0 }"
            @tap="handleSendSmsCode"
          >
            {{ isSendingSms ? '发送中...' : smsCountdown > 0 ? `${smsCountdown}秒后重发` : '获取验证码' }}
          </text>
        </view>

        <view class="register-login-link" @tap="goToLogin">
          已有账号，去登录
        </view>

        <view class="register-submit" hover-class="register-submit--hover" @tap="handleRegister">
          {{ isSubmitting ? '注册中...' : '立即注册' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffcb2f 0%, #ffcb2f 400rpx, #f7f7f7 400rpx, #f7f7f7 100%);
}

.register-hero {
  position: relative;
  z-index: 1;
  padding: calc(env(safe-area-inset-top) + 18rpx) 20rpx 0;
  background: linear-gradient(180deg, #ffcb2f 0%, #ffcb2f 100%);
}

.register-hero__nav {
  position: relative;
  z-index: 2;
}

.register-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12rpx;
  min-height: 340rpx;
  margin-top: 24rpx;
  margin-bottom: 40rpx;
}

.register-hero__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18rpx;
  padding: 0 12rpx 96rpx;
  text-align: center;
}

.register-hero__title {
  color: #5d4600;
  font-size: 58rpx;
  font-weight: 800;
  line-height: 1.1;
}

.register-hero__subtitle {
  color: #6f5600;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

.register-hero__image {
  width: 440rpx;
  max-width: 58%;
  flex-shrink: 0;
  display: block;
}

.register-panel {
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

.register-form {
  padding: 0 16rpx;
}

.register-field {
  position: relative;
}

.register-field--spaced {
  margin-top: 30rpx;
}

.register-input,
.register-captcha__input,
.register-phone-code__input {
  width: 100%;
  height: 96rpx;
  padding: 0 92rpx 0 46rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #f7f0d0 0%, #f9f4db 100%);
  color: #353535;
  font-size: 32rpx;
  box-sizing: border-box;
}

.register-input__placeholder {
  color: #d0cab5;
  font-size: 32rpx;
}

.register-field__required {
  position: absolute;
  top: 50%;
  right: 44rpx;
  color: #f38e80;
  font-size: 48rpx;
  line-height: 1;
  transform: translateY(-50%);
}

.register-field__required--success {
  color: #86cd77;
}

.register-captcha {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210rpx;
  gap: 20rpx;
  margin-top: 30rpx;
}

.register-phone-code {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210rpx;
  gap: 20rpx;
  margin-top: 30rpx;
}

.register-phone-code__action {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #ffffff;
  color: #7f765b;
  font-size: 26rpx;
  white-space: nowrap;
  box-shadow: inset 0 0 0 2rpx rgba(178, 228, 180, 0.85);
  box-sizing: border-box;
}

.register-phone-code__action--disabled {
  opacity: 0.55;
}

.register-captcha__preview {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #ffffff;
  box-shadow: inset 0 0 0 2rpx rgba(178, 228, 180, 0.85);
}

.register-captcha__preview--hover {
  opacity: 0.92;
}

.register-captcha__image {
  width: 100%;
  height: 100%;
  display: block;
}

.register-captcha__refresh {
  color: #8c8c8c;
  font-size: 26rpx;
}

.register-login-link {
  margin-top: 38rpx;
  color: #ababab;
  font-size: 28rpx;
  line-height: 1.2;
  text-align: center;
}

.register-submit {
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

.register-submit--hover {
  transform: translateY(2rpx);
}
</style>
