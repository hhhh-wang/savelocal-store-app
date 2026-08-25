import { http } from '@/http/http'

export interface MerchantWithdrawContext {
  storeId: number
  storeName?: string
  tradeScene: string
  availableAmount: number
  availableSettlementCount: number
  processingWithdrawId?: number
  processingWithdrawStatus?: string
  processingTransferFailReason?: string
  receiverId?: number
  receiverType?: string
  receiverAccountMasked?: string
  receiverName?: string
  receiverBindStatus?: string
  receiverStatus?: string
  transferAccountReady?: boolean
}

export interface MerchantWithdrawApply {
  withdrawId: number
  withdrawNo: string
  storeId: number
  tradeScene: string
  applyAmount: number
  payableAmount: number
  profitSharingReceiverId?: number
  profitSharingReceiverType?: string
  profitSharingReceiverName?: string
  withdrawStatus: string
  transferFailReason?: string
  storeNameSnapshot?: string
  merchantName?: string
  serviceFee?: number
  settlementNameSnapshot?: string
  transferTime?: string
  transferFinishTime?: string
  wxTransferBillNo?: string
  settlementCount?: number
  createTime?: string
  transferPackageInfo?: string
  transferMchId?: string
  transferAppId?: string
}

export interface MerchantWithdrawApplyDetail {
  detailId: number
  withdrawId: number
  settlementId?: number
  settlementNo?: string
  orderId?: number
  orderNo?: string
  amount?: number
  storeId?: number
  storeName?: string
  tradeScene?: string
  settlementStatus?: string
  wxProfitSharingOutOrderNo?: string
  wxProfitSharingOrderId?: string
  profitSharingStatus?: string
  profitSharingFailReason?: string
  profitSharingFinishTime?: string
}

export interface MerchantWithdrawPage {
  rows: MerchantWithdrawApply[]
  total: number
}

export interface MerchantWithdrawApplyPayload {
  storeId: number
  tradeScene?: string
  applyAmount: number
  remark?: string
}

export function getMerchantWithdrawContext(storeId: number, tradeScene = 'STORE_BUYOUT') {
  return http.get<MerchantWithdrawContext>('/merchant/finance/withdrawals/context', {
    storeId,
    tradeScene,
  })
}

export function applyMerchantWithdraw(payload: MerchantWithdrawApplyPayload) {
  return http.post<MerchantWithdrawApply>('/merchant/finance/withdrawals', payload)
}

export function refreshMerchantWithdrawTransfer(withdrawId: number) {
  return http.post<MerchantWithdrawApply>(
    `/merchant/finance/withdrawals/${withdrawId}/transfer`,
  )
}

/** @deprecated compatibility alias for older pages. */
export const refreshMerchantWithdrawProfitSharing = refreshMerchantWithdrawTransfer

export function listMerchantWithdrawals(storeId: number, pageNum = 1, pageSize = 20, tradeScene?: string) {
  return http.get<MerchantWithdrawPage>('/merchant/finance/withdrawals/page', {
    storeId,
    pageNum,
    pageSize,
    tradeScene,
  })
}

export function getMerchantWithdrawal(withdrawId: number) {
  return http.get<{
    withdraw: MerchantWithdrawApply
    details: MerchantWithdrawApplyDetail[]
  }>(`/merchant/finance/withdrawals/${withdrawId}`)
}
