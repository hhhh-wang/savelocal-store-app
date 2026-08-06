import type { IAuthLoginRes, ICaptcha, IUpdateInfo, IUpdatePassword, IUserInfoRes } from './types/login'
import { http } from '@/http/http'

const MERCHANT_TOKEN_EXPIRES_IN_SECONDS = 43200 * 60

interface MerchantProfileResponse {
  user?: Record<string, any>
  userInfo?: Record<string, any>
  merchantInfo?: Record<string, any>
  roles?: string[]
  permissions?: string[]
  [key: string]: any
}

/**
 * 登录表单
 */
export interface IAccountLoginForm {
  username: string
  password: string
  code?: string
  uuid?: string
}

export type ILoginForm = IAccountLoginForm

export interface IMerchantRegisterForm {
  password: string
  mobile: string
  code?: string
  uuid?: string
}

/**
 * 获取验证码
 * @returns ICaptcha 验证码
 */
export function getCaptcha() {
  return http.get<ICaptcha>('/captchaImage', undefined, undefined, {
    withAuth: false,
  })
}

export const getCode = getCaptcha

/**
 * 用户登录
 * @param loginForm 登录表单
 */
export function accountLogin(loginForm: IAccountLoginForm) {
  return http.post<{ token: string }>('/merchant/auth/login', loginForm, undefined, undefined, {
    withAuth: false,
  }).then((res) => {
    return {
      token: res.token || '',
      expiresIn: MERCHANT_TOKEN_EXPIRES_IN_SECONDS,
    } satisfies IAuthLoginRes
  })
}

export const login = accountLogin

/**
 * 商家注册
 * @param registerForm 注册表单
 */
export function merchantRegister(registerForm: IMerchantRegisterForm) {
  return http.post('/merchant/auth/register', registerForm, undefined, undefined, {
    withAuth: false,
  })
}

export const register = merchantRegister

/**
 * 获取用户信息
 */
export function getCurrentUserInfo() {
  return http.get<MerchantProfileResponse>('/merchant/auth/profile').then((res) => {
    const source = res.userInfo || res.user || {}

    return {
      userId: Number(source.merchantUserId || source.userId || -1),
      username: source.loginName || source.username || source.userName || '',
      nickname: source.nickName || source.nickname || source.loginName || source.username || '',
      avatar: source.avatar || '/static/images/default-avatar.png',
      role: Array.isArray(res.roles) ? res.roles[0] : source.role,
      roles: Array.isArray(res.roles) ? res.roles : source.roles,
      permissions: Array.isArray(res.permissions) ? res.permissions : source.permissions,
      merchantInfo: res.merchantInfo,
      ...source,
    } satisfies IUserInfoRes
  })
}

export const getUserInfo = getCurrentUserInfo

/**
 * 退出登录
 */
export function logout() {
  return http.post<void>('/merchant/auth/logout', undefined, undefined, undefined, {
    hideErrorToast: true,
    skipAuthHandling: true,
  })
}

/**
 * 修改用户信息
 */
export function updateUserInfo(data: IUpdateInfo) {
  return http.post('/user/updateInfo', data)
}

export const updateInfo = updateUserInfo

/**
 * 修改用户密码
 */
export function changeUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data)
}

export const updateUserPassword = changeUserPassword

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err)),
    })
  })
}

/**
 * 微信登录
 * 非小程序端如不需要可忽略该能力
 * @param data 微信登录参数，包含 code
 * @returns Promise 包含登录结果
 */
export function wxLogin(data: { code: string }) {
  return http.post<IAuthLoginRes>('/auth/wxLogin', data, undefined, undefined, {
    withAuth: false,
  })
}
