import { http } from '@/http/http'
import type { SubAccount, SubAccountForm, SubAccountStore } from '@/pages/me/sub-account/sub-account'

interface MerchantUserResponse {
  merchantUserId: number
  merchantId: number
  merchantName?: string
  loginName: string
  nickName: string
  mobile?: string
  status: string
  storeIds?: number[]
  stores?: SubAccountStore[]
  storeNames?: string
}

interface MerchantUserPageResponse {
  rows: MerchantUserResponse[]
  total: number
}

function toSubAccount(value: MerchantUserResponse): SubAccount {
  return {
    merchantUserId: value.merchantUserId,
    merchantId: value.merchantId,
    merchantName: value.merchantName || '',
    loginName: value.loginName,
    nickName: value.nickName || value.loginName,
    mobile: value.mobile || '',
    status: value.status === '0' ? 'enabled' : 'disabled',
    storeIds: value.storeIds || value.stores?.map(store => store.storeId) || [],
    stores: value.stores || [],
    storeNames: value.storeNames,
  }
}

export async function getMerchantSubAccounts(params: {
  pageNum: number
  pageSize: number
  loginName?: string
  mobile?: string
  status?: string
  storeId?: number
}) {
  const page = await http.get<MerchantUserPageResponse>('/merchant/user/list', params)
  return {
    rows: (page.rows || []).map(toSubAccount),
    total: page.total || 0,
  }
}

export async function getMerchantSubAccount(merchantUserId: number) {
  return toSubAccount(await http.get<MerchantUserResponse>(`/merchant/user/${merchantUserId}`))
}

export function getMerchantSubAccountStores() {
  return http.get<SubAccountStore[]>('/merchant/user/stores')
}

export function createMerchantSubAccount(form: SubAccountForm) {
  return http.post<MerchantUserResponse>('/merchant/user', form)
}

export function updateMerchantSubAccount(merchantUserId: number, form: SubAccountForm & { status?: string }) {
  return http.put<MerchantUserResponse>('/merchant/user', {
    merchantUserId,
    ...form,
  })
}

export function changeMerchantSubAccountStatus(merchantUserId: number, status: string) {
  return http.put<void>('/merchant/user/changeStatus', { merchantUserId, status })
}
