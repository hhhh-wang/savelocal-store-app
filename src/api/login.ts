import type { IAuthLoginRes, ICaptcha, IUpdateInfo, IUpdatePassword, IUserInfoRes } from './types/login'
import { http } from '@/http/http'

/**
 * 登录表单
 */
export interface IAccountLoginForm {
  username: string
  password: string
}

export type ILoginForm = IAccountLoginForm

/**
 * 获取验证码
 * @returns ICaptcha 验证码
 */
export function getCaptcha() {
  return http.get<ICaptcha>('/user/getCode')
}

export const getCode = getCaptcha

/**
 * 用户登录
 * @param loginForm 登录表单
 */
export function accountLogin(loginForm: IAccountLoginForm) {
  return http.post<IAuthLoginRes>('/auth/login', loginForm)
}

export const login = accountLogin

/**
 * 获取用户信息
 */
export function getCurrentUserInfo() {
  return http.get<IUserInfoRes>('/user/info')
}

export const getUserInfo = getCurrentUserInfo

/**
 * 退出登录
 */
export function logout() {
  return http.get<void>('/auth/logout')
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
  return http.post<IAuthLoginRes>('/auth/wxLogin', data)
}
