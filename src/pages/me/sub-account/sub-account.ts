export type SubAccountStatus = 'enabled' | 'disabled'

export interface SubAccountStore {
  storeId: number
  storeName: string
}

export interface SubAccountForm {
  loginName: string
  nickName: string
  password?: string
  mobile: string
  storeIds: number[]
}

export interface SubAccount {
  merchantUserId: number
  merchantId: number
  merchantName: string
  loginName: string
  nickName: string
  mobile: string
  status: SubAccountStatus
  storeIds: number[]
  stores: SubAccountStore[]
  storeNames?: string
}

export function toSubAccountStatus(status: string): SubAccountStatus {
  return status === '0' ? 'enabled' : 'disabled'
}

export function fromSubAccountStatus(status: SubAccountStatus): string {
  return status === 'enabled' ? '0' : '1'
}

export function maskSubAccountMobile(mobile: string) {
  return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}
