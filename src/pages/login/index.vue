<script lang="ts" setup>
import type { IAccountLoginForm } from '@/api/login'
import { getCaptcha } from '@/api/login'
import { useTokenStore } from '@/store'
import { HOME_PAGE } from '@/utils'
import loginImage from '@/static/images/login.png'

defineOptions({
  name: 'MerchantLogin',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '商家登录',
  },
  excludeLoginPath: true,
})

type LoginTab = 'account' | 'phone'

const REMEMBER_ACCOUNT_KEY = 'merchant-login-remember-account'
const REMEMBER_USERNAME_KEY = 'merchant-login-username'
const TABBAR_PAGES = ['/pages/dashboard/index', '/pages/me/me']

const tokenStore = useTokenStore()
const activeTab = ref<LoginTab>('account')
const agreementChecked = ref(false)
const rememberAccount = ref(false)
const isSubmitting = ref(false)
const captchaEnabled = ref(true)
const captchaImageUrl = ref('')
const redirectUrl = ref('')

const form = reactive<IAccountLoginForm>({
  username: '',
  password: '',
  code: '',
  uuid: '',
})

const phoneForm = reactive({
  mobile: '',
  smsCode: '',
})

onLoad((options) => {
  redirectUrl.value = typeof options?.redirect === 'string' ? options.redirect : ''
  restoreRememberedAccount()
  void fetchCaptcha()
})

function restoreRememberedAccount() {
  rememberAccount.value = !!uni.getStorageSync(REMEMBER_ACCOUNT_KEY)
  if (!rememberAccount.value) {
    return
  }

  form.username = uni.getStorageSync(REMEMBER_USERNAME_KEY) || ''
}

function syncRememberedAccount() {
  if (rememberAccount.value) {
    uni.setStorageSync(REMEMBER_ACCOUNT_KEY, true)
    uni.setStorageSync(REMEMBER_USERNAME_KEY, form.username.trim())
    return
  }

  uni.removeStorageSync(REMEMBER_ACCOUNT_KEY)
  uni.removeStorageSync(REMEMBER_USERNAME_KEY)
}

async function fetchCaptcha() {
  try {
    const captcha = await getCaptcha()
    captchaEnabled.value = captcha.captchaEnabled ?? true

    if (!captchaEnabled.value) {
      captchaImageUrl.value = ''
      form.code = ''
      form.uuid = ''
      return
    }

    const base64Image = captcha.image || captcha.img || ''
    captchaImageUrl.value = base64Image ? `data:image/gif;base64,${base64Image}` : ''
    form.uuid = captcha.uuid || ''
  }
  catch (error) {
    console.error('获取验证码失败:', error)
    captchaEnabled.value = false
    captchaImageUrl.value = ''
    form.code = ''
    form.uuid = ''
  }
}

function switchTab(tab: LoginTab) {
  activeTab.value = tab
}

function toggleRememberAccount() {
  rememberAccount.value = !rememberAccount.value
}

function toggleAgreement() {
  agreementChecked.value = !agreementChecked.value
}

function showPendingToast(title: string) {
  uni.showToast({
    title,
    icon: 'none',
  })
}

function handleProtocolTap(protocolName: string) {
  showPendingToast(`${protocolName}待接入`)
}

function validateForm() {
  if (activeTab.value === 'phone') {
    if (!/^1\d{10}$/.test(phoneForm.mobile.trim())) {
      showPendingToast('请输入正确的手机号')
      return false
    }

    if (!phoneForm.smsCode.trim()) {
      showPendingToast('请输入短信验证码')
      return false
    }

    if (!agreementChecked.value) {
      showPendingToast('请先勾选协议')
      return false
    }

    return true
  }

  if (!form.username.trim()) {
    showPendingToast('请输入登录账号')
    return false
  }

  if (!form.password.trim()) {
    showPendingToast('请输入密码')
    return false
  }

  if (captchaEnabled.value && !form.code?.trim()) {
    showPendingToast('请输入验证码')
    return false
  }

  if (!agreementChecked.value) {
    showPendingToast('请先勾选协议')
    return false
  }

  return true
}

function handlePhoneCodeTap() {
  if (!/^1\d{10}$/.test(phoneForm.mobile.trim())) {
    showPendingToast('请先输入正确的手机号')
    return
  }

  showPendingToast('短信验证码发送待接入')
}

function handlePhoneHelpTap() {
  showPendingToast('短信帮助待接入')
}

function goToRegister() {
  uni.navigateTo({
    url: '/pages/register/index',
  })
}

function navigateToResolvedUrl(url: string) {
  const normalizedUrl = url.split('?')[0]

  if (TABBAR_PAGES.includes(normalizedUrl)) {
    uni.switchTab({ url: normalizedUrl })
    return
  }

  uni.reLaunch({ url })
}

function finishLogin() {
  if (redirectUrl.value) {
    navigateToResolvedUrl(redirectUrl.value)
    return
  }

  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.switchTab({
    url: HOME_PAGE,
  })
}

async function handleLogin() {
  if (isSubmitting.value) {
    return
  }

  if (!validateForm()) {
    return
  }

  try {
    isSubmitting.value = true

    if (activeTab.value === 'phone') {
      showPendingToast('手机号登录待接入')
      return
    }

    syncRememberedAccount()

    await tokenStore.login({
      username: form.username.trim(),
      password: form.password,
      code: captchaEnabled.value ? form.code?.trim() : undefined,
      uuid: captchaEnabled.value ? form.uuid : undefined,
    })

    finishLogin()
  }
  catch (error) {
    console.error('商家登录失败:', error)
    form.code = ''

    if (captchaEnabled.value) {
      await fetchCaptcha()
    }
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <view class="login-page">
    <view class="login-hero">
      <view class="login-hero__nav">
        <back-button
          fallback-url="/pages/me/me"
          fallback-mode="switchTab"
          color="#7b5a00"
          background="rgba(255, 255, 255, 0.28)"
          size="68rpx"
        />
      </view>

      <view class="login-hero__content">
        <view class="login-hero__copy">
          <text class="login-hero__title">
            商家登录端
          </text>
          <text class="login-hero__subtitle">
            -欢迎来到省哒-
          </text>
        </view>

        <image class="login-hero__image" :src="loginImage" mode="widthFix" />
      </view>
    </view>

    <view class="login-panel">
      <view class="login-tabs">
        <view class="login-tabs__track">
          <view
            class="login-tabs__item"
            :class="{ 'login-tabs__item--active': activeTab === 'account' }"
            @tap="switchTab('account')"
          >
            账号登录
          </view>

          <view class="login-tabs__divider" />

          <view
            class="login-tabs__item"
            :class="{ 'login-tabs__item--active': activeTab === 'phone' }"
            @tap="switchTab('phone')"
          >
            手机登录
          </view>
        </view>
      </view>

      <view class="login-form">
        <template v-if="activeTab === 'account'">
          <input
            v-model="form.username"
            class="login-input"
            type="text"
            :maxlength="30"
            placeholder="登录账号"
            placeholder-class="login-input__placeholder"
          />

          <input
            v-model="form.password"
            class="login-input login-input--spaced"
            type="text"
            :password="true"
            :maxlength="30"
            placeholder="密码"
            placeholder-class="login-input__placeholder"
          />

          <view v-if="captchaEnabled" class="login-captcha">
            <view class="login-captcha__preview" hover-class="login-captcha__preview--hover" @tap="fetchCaptcha">
              <image
                v-if="captchaImageUrl"
                class="login-captcha__image"
                :src="captchaImageUrl"
                mode="aspectFill"
              />
              <text v-else class="login-captcha__refresh">
                换一张
              </text>
            </view>

            <input
              v-model="form.code"
              class="login-captcha__input"
              type="text"
              :maxlength="10"
              placeholder="请输入验证码"
              placeholder-class="login-input__placeholder"
            />
          </view>

          <view class="login-shortcuts">
            <view class="login-shortcuts__remember" @tap="toggleRememberAccount">
              <view class="login-checkbox" :class="{ 'login-checkbox--checked': rememberAccount }">
                <text class="login-checkbox__icon">✓</text>
              </view>
              <text class="login-shortcuts__text">
                记住账号
              </text>
            </view>

            <text class="login-shortcuts__action" @tap="goToRegister">
              注册账号
            </text>

            <text class="login-shortcuts__action" @tap="showPendingToast('忘记密码入口待接入')">
              忘记密码
            </text>
          </view>
        </template>

        <template v-else>
          <input
            v-model="phoneForm.mobile"
            class="login-input"
            type="number"
            :maxlength="11"
            placeholder="输入手机号"
            placeholder-class="login-input__placeholder"
          />

          <view class="login-phone-code">
            <input
              v-model="phoneForm.smsCode"
              class="login-phone-code__input"
              type="number"
              :maxlength="6"
              placeholder="输入短信验证码"
              placeholder-class="login-input__placeholder"
            />
            <text class="login-phone-code__action" @tap="handlePhoneCodeTap">
              获取验证码
            </text>
          </view>

          <view class="login-phone-help" @tap="handlePhoneHelpTap">
            收不到验证码？
          </view>
        </template>

        <view class="login-agreement" @tap="toggleAgreement">
          <view class="login-checkbox" :class="{ 'login-checkbox--checked': agreementChecked }">
            <text class="login-checkbox__icon">✓</text>
          </view>

          <view class="login-agreement__content">
            <text>登录即代表同意</text>
            <text class="login-agreement__link" @tap.stop="handleProtocolTap('用户协议')">《用户协议》</text>
            <text class="login-agreement__link" @tap.stop="handleProtocolTap('隐私协议')">《隐私协议》</text>
          </view>
        </view>

        <view
          class="login-submit"
          :class="{ 'login-submit--disabled': !agreementChecked || isSubmitting }"
          hover-class="login-submit--hover"
          @tap="handleLogin"
        >
          {{ isSubmitting ? '登录中...' : '登录' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>

.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffcb2f 0%, #ffcb2f 400rpx, #f7f7f7 400rpx, #f7f7f7 100%);
}

.login-hero {
  position: relative;
  z-index: 1;
  padding: calc(env(safe-area-inset-top) + 18rpx) 20rpx 0;
  background: linear-gradient(180deg, #ffcb2f 0%, #ffcb2f 100%);
}

.login-hero__nav {
  position: relative;
  z-index: 2;
}

.login-hero__content {
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

.login-hero__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18rpx;
  padding: 0 12rpx 96rpx;
}

.login-hero__title {
  color: #5d4600;
  font-size: 58rpx;
  font-weight: 800;
  line-height: 1.1;
}

.login-hero__subtitle {
  color: #6f5600;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

.login-hero__image {
  width: 400rpx;
  max-width: 52%;
  flex-shrink: 0;
  display: block;
}

.login-panel {
  position: relative;
  z-index: 3;
  min-height: calc(100vh - env(safe-area-inset-top) - 360rpx);
  margin-top: -82rpx;
  padding: 74rpx 60rpx calc(env(safe-area-inset-bottom) + 52rpx);
  border-top-left-radius: 52rpx;
  border-top-right-radius: 52rpx;
  background: #f7f7f7;
  box-shadow: 0 -6rpx 20rpx rgba(255, 255, 255, 0.18);
  box-sizing: border-box;
}

.login-tabs {
  display: flex;
  justify-content: center;
}

.login-tabs__track {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 470rpx;
  padding: 12rpx 26rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #f0f0f0 0%, #ebebeb 100%);
}

.login-tabs__item {
  padding: 8rpx 0;
  color: #b6b6b6;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1;
}

.login-tabs__item--active {
  color: #ffb200;
}

.login-tabs__divider {
  width: 2rpx;
  height: 54rpx;
  margin: 0 30rpx;
  background: rgba(255, 178, 0, 0.75);
}

.login-form {
  margin-top: 52rpx;
}

.login-input,
.login-captcha__input {
  height: 96rpx;
  padding: 0 34rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #f7f0d0 0%, #f9f4db 100%);
  color: #353535;
  font-size: 32rpx;
  box-sizing: border-box;
}

.login-input--spaced {
  margin-top: 24rpx;
}

.login-input__placeholder {
  color: #d0cab5;
  font-size: 32rpx;
}

.login-captcha {
  display: grid;
  grid-template-columns: 210rpx minmax(0, 1fr);
  gap: 20rpx;
  margin-top: 24rpx;
}

.login-captcha__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #ffffff;
  box-shadow: inset 0 0 0 2rpx rgba(178, 228, 180, 0.85);
}

.login-captcha__preview--hover {
  opacity: 0.92;
}

.login-captcha__image {
  width: 100%;
  height: 100%;
  display: block;
}

.login-captcha__refresh {
  color: #8c8c8c;
  font-size: 26rpx;
}

.login-shortcuts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 68rpx;
}

.login-shortcuts__remember {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 10rpx;
}

.login-shortcuts__text,
.login-shortcuts__action {
  color: #ababab;
  font-size: 28rpx;
  line-height: 1.2;
  white-space: nowrap;
}

.login-phone-code {
  position: relative;
  display: flex;
  align-items: center;
  height: 96rpx;
  margin-top: 24rpx;
  padding: 0 34rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #f7f0d0 0%, #f9f4db 100%);
  box-sizing: border-box;
}

.login-phone-code__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  color: #353535;
  font-size: 32rpx;
}

.login-phone-code__action {
  flex-shrink: 0;
  color: #ffae12;
  font-size: 28rpx;
  font-weight: 500;
}

.login-phone-help {
  margin-top: 58rpx;
  color: #b0b0b0;
  font-size: 28rpx;
  line-height: 1.2;
  text-align: center;
}

.login-agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  margin-top: 58rpx;
  padding: 0 12rpx;
}

.login-agreement__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  color: #8b8b8b;
  font-size: 24rpx;
  line-height: 1.6;
}

.login-agreement__link {
  margin-left: 6rpx;
  color: #4a4a4a;
}

.login-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border: 2rpx solid #d6d6d6;
  border-radius: 50%;
  background: #ffffff;
  box-sizing: border-box;
  flex-shrink: 0;
}

.login-checkbox--checked {
  border-color: #1b1b1b;
  background: #1b1b1b;
}

.login-checkbox__icon {
  color: transparent;
  font-size: 22rpx;
  line-height: 1;
}

.login-checkbox--checked .login-checkbox__icon {
  color: #ffffff;
}

.login-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  margin-top: 72rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #ffd54f 0%, #ffc83b 100%);
  color: #3a3427;
  font-size: 38rpx;
  font-weight: 700;
  box-shadow: 0 18rpx 36rpx rgba(255, 188, 42, 0.26);
}

.login-submit--disabled {
  opacity: 0.58;
}

.login-submit--hover {
  transform: translateY(2rpx);
}
</style>
