export interface SettlementReceiverLike {
  receiverType?: string
  bindStatus?: string
}

export const personalAccountPath = '/pages/me/settlement-account/personal-account'

export function isPersonalWechatBound(receiver?: SettlementReceiverLike): boolean {
  if (receiver?.bindStatus !== 'BOUND')
    return false

  if (receiver.receiverType === 'PERSONAL_OPENID' || receiver.receiverType === 'PERSONAL_SUB_OPENID')
    return true

  return false
}

export function isLegacyMerchantBound(receiver?: SettlementReceiverLike): boolean {
  return receiver?.bindStatus === 'BOUND' && receiver.receiverType === 'MERCHANT_ID'
}
