export const WITHDRAWAL_PATHS = {
  overview: '/pages/dashboard/merchant-reconciliation/account-withdrawal',
  records: '/pages/dashboard/merchant-reconciliation/withdrawal-records',
  bills: '/pages/dashboard/merchant-reconciliation/bill-details',
  form: '/pages/dashboard/merchant-reconciliation/withdraw',
} as const

export const ACCOUNT_BALANCE = {
  total: 1807.05,
  available: 1765.5,
  singleLimit: 200,
  minimum: 1,
} as const

export const ARRIVAL_ACCOUNT = {
  name: '13574300595（个人）',
  maskedId: 'o6Zd****KcD8',
} as const

export interface WithdrawalRecord {
  id: string
  destination: string
  owner: string
  maskedAccount: string
  submittedAt: string
  amount: string
  status: string
}

export const WITHDRAWAL_RECORDS: WithdrawalRecord[] = [
  {
    id: '20260807151040',
    destination: '提现至微信商户:12359552357',
    owner: '（龙洋）',
    maskedAccount: '湖**********',
    submittedAt: '2026-08-07 15:10:40',
    amount: '2,886.82',
    status: '受理成功',
  },
  {
    id: '20260731190136',
    destination: '提现至微信商户:12359552357',
    owner: '（龙洋）',
    maskedAccount: '湖**********',
    submittedAt: '2026-07-31 19:01:36',
    amount: '2,649.60',
    status: '受理成功',
  },
  {
    id: '20260722121034',
    destination: '提现至微信用户:12445816357',
    owner: '（高总）',
    maskedAccount: '湖**********',
    submittedAt: '2026-07-22 12:10:34',
    amount: '2,509.08',
    status: '受理成功',
  },
]

export type BillKind = 'coupon' | 'fee' | 'income'

export interface BillDetailItem {
  id: string
  kind: BillKind
  description: string
  time: string
  amount: string
}

export interface BillDetailGroup {
  date: string
  expense: string
  income: string
  items: BillDetailItem[]
}

export const BILL_DETAIL_GROUPS: BillDetailGroup[] = [
  {
    date: '2026年08月14日',
    expense: '1.62',
    income: '272.40',
    items: [
      { id: '260803-53823-coupon', kind: 'coupon', description: '优惠券结算-订单结算260803-53823...', time: '10:24:43', amount: '+6.35' },
      { id: '260803-53823-fee', kind: 'fee', description: '技术服务费-订单结算260803-53823...', time: '10:24:43', amount: '-0.54' },
      { id: '260803-53823-income', kind: 'income', description: '交易收入-订单结算260803-53823...', time: '10:24:43', amount: '+84.45' },
      { id: '260803-53054-fee', kind: 'fee', description: '技术服务费-订单结算260803-53054...', time: '10:19:47', amount: '-0.54' },
      { id: '260803-53054-income', kind: 'income', description: '交易收入-订单结算260803-53054...', time: '10:19:47', amount: '+90.80' },
      { id: '260803-310042-fee', kind: 'fee', description: '技术服务费-订单结算260803-310042...', time: '10:19:47', amount: '-0.54' },
      { id: '260803-310042-income', kind: 'income', description: '交易收入-订单结算260803-310042...', time: '10:19:47', amount: '+90.80' },
    ],
  },
  {
    date: '2026年08月13日',
    expense: '92.97',
    income: '363.84',
    items: [
      { id: '260808-113644-income', kind: 'income', description: '交易收入-订单结算260808-113644...', time: '16:54:45', amount: '+90.80' },
    ],
  },
]

export function validateWithdrawalAmount(value: string, availableBalance: number): string | undefined {
  const normalizedValue = value.trim()

  if (!normalizedValue)
    return '请输入提现金额'

  if (/^\d+\.\d{3,}$/.test(normalizedValue))
    return '提现金额最多保留两位小数'

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue))
    return '请输入正确的提现金额'

  const amount = Number(normalizedValue)

  if (amount < ACCOUNT_BALANCE.minimum)
    return '最低提现金额为¥1.00'

  if (amount > ACCOUNT_BALANCE.singleLimit)
    return '单笔提现金额不能超过¥200.00'

  if (amount > availableBalance)
    return '提现金额不能超过可提现余额'

  return undefined
}
