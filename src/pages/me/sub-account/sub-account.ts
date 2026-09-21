export type SubAccountStatus = 'enabled' | 'disabled'

export interface SubAccountForm {
  username: string
  password?: string
  mobile: string
  merchantName: string
  storeNames: string[]
}

export interface SubAccount extends SubAccountForm {
  id: string
  status: SubAccountStatus
}

export const subAccountStores = [
  '太平总店',
  '太平万达店',
  '太平城东店',
]

// 原型阶段使用内存中的示例数据；后续由子账号接口提供，暂不写入本地存储。
export function createDemoSubAccounts(): SubAccount[] {
  return [{
    id: 'demo-account-001',
    username: 'kje2831',
    mobile: '15500005552',
    merchantName: '太平',
    storeNames: [],
    status: 'enabled',
  }]
}

export function maskSubAccountMobile(mobile: string) {
  return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}
