import type {
  IAccountLoginForm,
} from '@/api/login'
import type { IAuthLoginRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  accountLogin as _accountLogin,
  getWxCode,
  logout as _logout,
  wxLogin as _wxLogin,
} from '@/api/login'
import { useUserStore } from './user'

// 初始化状态
const tokenInfoState: IAuthLoginRes = {
  token: '',
  expiresIn: 0,
}

export const useTokenStore = defineStore(
  'token',
  () => {
    // 定义用户信息
    const tokenInfo = ref<IAuthLoginRes>({ ...tokenInfoState })

    // 添加一个时间戳 ref 作为响应式依赖
    const nowTime = ref(Date.now())
    /**
     * 更新响应式数据:now
     * 确保 isTokenExpired 重新计算,而不是用错误过期缓存值
     * 可 useTokenStore 内部适时调用;也可链式调用: tokenStore.updateNowTime().hasLogin
     * @returns 最新的 tokenStore 实例
     */
    const updateNowTime = () => {
      nowTime.value = Date.now()
      return useTokenStore()
    }

    // 设置 token 信息
    const setTokenInfo = (val: IAuthLoginRes) => {
      updateNowTime()
      tokenInfo.value = val

      const expireTime = Date.now() + val.expiresIn * 1000
      uni.setStorageSync('accessTokenExpireTime', expireTime)
    }

    /**
     * 判断 token 是否过期
     */
    const isTokenExpired = computed(() => {
      if (!tokenInfo.value) {
        return true
      }

      const now = nowTime.value
      const expireTime = uni.getStorageSync('accessTokenExpireTime')

      if (!expireTime)
        return true
      return now >= expireTime
    })

    /**
     * 登录成功后处理逻辑
     * @param nextTokenInfo 登录返回的 token 信息
     */
    async function _postLogin(nextTokenInfo: IAuthLoginRes) {
      setTokenInfo(nextTokenInfo)
      const userStore = useUserStore()
      await userStore.fetchUserInfo()
    }

    /**
     * 用户登录
     * @param loginForm 登录参数
     * @returns 登录结果
     */
    const login = async (loginForm: IAccountLoginForm) => {
      try {
        const res = await _accountLogin(loginForm)
        console.log('普通登录-res: ', res)
        await _postLogin(res)
        uni.showToast({
          title: '登录成功',
          icon: 'success',
        })
        return res
      }
      catch (error) {
        console.error('登录失败:', error)
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'error',
        })
        throw error
      }
      finally {
        updateNowTime()
      }
    }

    /**
     * 微信登录
     * 非小程序端如不需要可忽略该能力
     * @returns 登录结果
     */
    const wxLogin = async () => {
      try {
        const code = await getWxCode()
        if (!code.code) {
          throw new Error('获取微信登录凭证失败')
        }
        console.log('微信登录-code: ', code)
        const res = await _wxLogin({ code: code.code })
        console.log('微信登录-res: ', res)
        await _postLogin(res)
        uni.showToast({
          title: '登录成功',
          icon: 'success',
        })
        return res
      }
      catch (error) {
        console.error('微信登录失败:', error)
        uni.showToast({
          title: '微信登录失败，请重试',
          icon: 'error',
        })
        throw error
      }
      finally {
        updateNowTime()
      }
    }

    /**
     * 退出登录并清除用户信息
     */
    const logout = async () => {
      try {
        await _logout()
      }
      catch (error) {
        console.error('退出登录失败:', error)
      }
      finally {
        updateNowTime()
        uni.removeStorageSync('accessTokenExpireTime')
        console.log('退出登录-清除用户信息')
        tokenInfo.value = { ...tokenInfoState }
        uni.removeStorageSync('token')
        const userStore = useUserStore()
        userStore.clearUserInfo()
      }
    }

    /**
     * 获取有效 token
     * 建议这样使用 tokenStore.updateNowTime().validToken
     */
    const getValidToken = computed(() => {
      if (isTokenExpired.value) {
        return ''
      }
      return tokenInfo.value.token || ''
    })

    /**
     * 检查是否有登录信息（不考虑 token 是否过期）
     */
    const hasLoginInfo = computed(() => {
      if (!tokenInfo.value) {
        return false
      }
      return !!tokenInfo.value.token
    })

    /**
     * 检查是否已登录且 token 有效
     * 建议这样使用 tokenStore.updateNowTime().hasLogin
     */
    const hasValidLogin = computed(() => {
      console.log('hasValidLogin', hasLoginInfo.value, !isTokenExpired.value)
      return hasLoginInfo.value && !isTokenExpired.value
    })

    /**
     * 获取当前有效 token
     * @returns 有效的 token 或空字符串
     */
    const tryGetValidToken = async (): Promise<string> => {
      updateNowTime()
      return getValidToken.value
    }

    return {
      login,
      wxLogin,
      logout,
      hasLogin: hasValidLogin,
      tryGetValidToken,
      validToken: getValidToken,
      tokenInfo,
      setTokenInfo,
      updateNowTime,
    }
  },
  {
    persist: true,
  },
)
