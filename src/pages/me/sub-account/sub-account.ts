export type SubAccountStatus = 'enabled' | 'disabled'

export interface SubAccountForm {
  username: string
  mobile: string
  merchantName: string
  roleIds: string[]
  storeNames: string[]
}

export interface SubAccount extends SubAccountForm {
  id: string
  status: SubAccountStatus
}

export const subAccountRoles = [
  { id: 'voucher', name: '代金券项目（系统授权自动创建）' },
  { id: 'group-buy', name: '团购项目管理' },
  { id: 'store', name: '门店运营' },
  { id: 'finance', name: '财务管理' },
]

// 原型阶段使用内存中的示例数据；后续由子账号接口提供，暂不写入本地存储。
export function createDemoSubAccounts(): SubAccount[] {
  return [{
    id: 'demo-account-001',
    username: 'kje2831',
    mobile: '15500005552',
    merchantName: '太平',
    roleIds: subAccountRoles.map(role => role.id),
    storeNames: [],
    status: 'enabled',
  }]
}

export function getSubAccountRoleNames(roleIds: string[]) {
  return roleIds.map(id => subAccountRoles.find(role => role.id === id)?.name).filter(Boolean)
}

export function maskSubAccountMobile(mobile: string) {
  return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}
