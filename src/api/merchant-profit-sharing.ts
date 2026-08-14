import { http } from '@/http/http'

export interface MerchantProfitSharingReceiver {
  receiverId?: number
  receiverType?: string
  receiverAccountMasked?: string
  receiverName?: string
  bindStatus?: string
  syncFailReason?: string
}

export interface MerchantProfitSharingBindQr {
  storeId: number
  storeName?: string
  tradeScene?: string
  qrCode: string
  expiresIn: number
}

export interface MerchantProfitSharingBindRequest {
  storeId: number
  tradeScene?: string
  receiverType: 'MERCHANT_ID' | 'PERSONAL_OPENID'
  receiverAccount?: string
  receiverName?: string
  relationType?: string
  customRelation?: string
  remark?: string
}

export function getMerchantProfitSharingReceiver(storeId: number, tradeScene = 'STORE_BUYOUT') {
  return http.get<MerchantProfitSharingReceiver>('/merchant/finance/profit-sharing-receiver', {
    storeId,
    tradeScene,
  })
}

export function createMerchantProfitSharingBindQr(storeId: number, tradeScene = 'STORE_BUYOUT') {
  return http.get<MerchantProfitSharingBindQr>('/merchant/finance/profit-sharing-receiver/binding-qr', {
    storeId,
    tradeScene,
  })
}

export function bindMerchantProfitSharingReceiver(data: MerchantProfitSharingBindRequest) {
  return http.post<MerchantProfitSharingReceiver>('/merchant/finance/profit-sharing-receiver', data)
}
