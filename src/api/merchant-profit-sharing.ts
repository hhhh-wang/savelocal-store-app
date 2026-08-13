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
