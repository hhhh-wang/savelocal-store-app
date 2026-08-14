export type SettlementAccountType = 'personal' | 'merchant'

export interface SettlementReceiverLike {
  receiverType?: string
  bindStatus?: string
}

export interface MerchantAccountForm {
  merchantId: string
  merchantName: string
}

export interface MerchantBindRequest {
  storeId: number
  tradeScene: 'STORE_BUYOUT'
  receiverType: 'MERCHANT_ID'
  receiverAccount: string
  receiverName: string
  relationType: 'STORE_OWNER'
  remark: string
}

export const personalAccountPath = '/pages/me/settlement-account/personal-account'
export const merchantAccountPath = '/pages/me/settlement-account/merchant-account'

export function resolveBoundAccountType(receiver?: SettlementReceiverLike): SettlementAccountType | undefined {
  if (receiver?.bindStatus !== 'BOUND')
    return undefined

  if (receiver.receiverType === 'MERCHANT_ID')
    return 'merchant'

  if (receiver.receiverType === 'PERSONAL_OPENID' || receiver.receiverType === 'PERSONAL_SUB_OPENID')
    return 'personal'

  return undefined
}

export function validateMerchantAccount(merchantId: string, merchantName: string) {
  const normalizedMerchantId = merchantId.trim()
  if (!normalizedMerchantId)
    return '请填写微信支付商户号'

  if (!/^\d{6,32}$/.test(normalizedMerchantId))
    return '请输入6至32位数字商户号'

  if (!merchantName.trim())
    return '请填写商户全称或开户人姓名'

  return undefined
}

export function buildMerchantBindRequest(storeId: number, form: MerchantAccountForm): MerchantBindRequest {
  return {
    storeId,
    tradeScene: 'STORE_BUYOUT',
    receiverType: 'MERCHANT_ID',
    receiverAccount: form.merchantId.trim(),
    receiverName: form.merchantName.trim(),
    relationType: 'STORE_OWNER',
    remark: '商户端绑定微信支付商户号',
  }
}
