import type {
  MerchantFoodAddressSuggestion,
  MerchantFoodAlbumImage,
  MerchantFoodAuditStatus,
  MerchantFoodBill,
  MerchantFoodBusinessStatusPayload,
  MerchantFoodCommissionBill,
  MerchantFoodOrder,
  MerchantFoodOrderContactResult,
  MerchantFoodOrderDetail,
  MerchantFoodPageParams,
  MerchantFoodPageResult,
  MerchantFoodProduct,
  MerchantFoodProductPayload,
  MerchantFoodQuickStatus,
  MerchantFoodQuickStatusPayload,
  MerchantFoodReconciliationOverview,
  MerchantFoodReconciliationQuery,
  MerchantFoodRefund,
  MerchantFoodRefundStatus,
  MerchantFoodRefundType,
  MerchantFoodSaleStatus,
  MerchantFoodScene,
  MerchantFoodSettlementOrder,
  MerchantFoodStore,
  MerchantFoodStoreProfile,
  MerchantFoodWalletSummary,
} from './types/merchant-food'
import { http } from '@/http/http'

const storeBase = '/merchant/food/stores'

export function getMerchantFoodStores() {
  return http.get<MerchantFoodStore[]>(storeBase)
}

export function getMerchantFoodStoreProfile(storeId: number) {
  return http.get<MerchantFoodStoreProfile>(`${storeBase}/${storeId}/profile`)
}

export function getMerchantFoodAddressSuggestions(params: {
  latitude: number
  longitude: number
  limit?: number
}) {
  return http.get<MerchantFoodAddressSuggestion[]>('/common/map/reverse-geocode', params)
}

export function updateMerchantFoodStoreBusinessStatus(storeId: number, payload: MerchantFoodBusinessStatusPayload) {
  return http.put<void>(`${storeBase}/${storeId}/business-status`, payload)
}

export function getMerchantFoodStoreQuickStatus(storeId: number) {
  return http.get<MerchantFoodQuickStatus>(`${storeBase}/${storeId}/quick-status`)
}

export function updateMerchantFoodStoreQuickStatus(storeId: number, payload: MerchantFoodQuickStatusPayload) {
  return http.put<void>(`${storeBase}/${storeId}/quick-status`, payload)
}

export function getMerchantFoodAlbumPage(storeId: number, params: MerchantFoodPageParams & { auditStatus?: MerchantFoodAuditStatus }) {
  return http.get<MerchantFoodPageResult<MerchantFoodAlbumImage>>(`${storeBase}/${storeId}/album/page`, params)
}

export function addMerchantFoodAlbumImage(storeId: number, imageUrl: string) {
  return http.post<MerchantFoodAlbumImage>(`${storeBase}/${storeId}/album/images`, { imageUrl })
}

export function deleteMerchantFoodAlbumImage(storeId: number, imageId: number) {
  return http.delete<void>(`${storeBase}/${storeId}/album/images/${imageId}`)
}

export function getMerchantFoodProductsPage(storeId: number, params: MerchantFoodPageParams & { name?: string, type?: string, status?: string }) {
  return http.get<MerchantFoodPageResult<MerchantFoodProduct>>(`${storeBase}/${storeId}/products/page`, params)
}

export function getMerchantFoodProductDetail(storeId: number, productId: number) {
  return http.get<MerchantFoodProduct>(`${storeBase}/${storeId}/products/${productId}`)
}

export function createMerchantFoodProduct(storeId: number, payload: MerchantFoodProductPayload) {
  return http.post<MerchantFoodProduct>(`${storeBase}/${storeId}/products`, payload)
}

export function updateMerchantFoodProduct(storeId: number, productId: number, payload: MerchantFoodProductPayload) {
  return http.put<void>(`${storeBase}/${storeId}/products/${productId}`, payload)
}

export function updateMerchantFoodProductStatus(storeId: number, productId: number, saleStatus: MerchantFoodSaleStatus) {
  return http.put<void>(`${storeBase}/${storeId}/products/${productId}/status`, { saleStatus })
}

export function batchOffShelfMerchantFoodProducts(storeId: number, productIds: number[]) {
  return http.put<void>(`${storeBase}/${storeId}/products/batch-off-shelf`, { productIds })
}

export function updateMerchantFoodProductSort(storeId: number, productIds: number[]) {
  return http.put<void>(`${storeBase}/${storeId}/products/sort`, { productIds })
}

export function getMerchantFoodOrdersPage(params: MerchantFoodPageParams & {
  storeId: number
  scene?: MerchantFoodScene
  todoOnly?: boolean
  timeRange?: string
  orderStatus?: string
  keyword?: string
}) {
  return http.get<MerchantFoodPageResult<MerchantFoodOrder>>('/merchant/food/orders/page', params)
}

export function getMerchantFoodOrderDetail(scene: Exclude<MerchantFoodScene, 'ALL'>, orderId: number) {
  return http.get<MerchantFoodOrderDetail>(`/merchant/food/orders/${scene}/${orderId}`)
}

export function getMerchantFoodOrderContact(scene: Exclude<MerchantFoodScene, 'ALL'>, orderId: number) {
  return http.get<MerchantFoodOrderContactResult>(`/merchant/food/orders/${scene}/${orderId}/contact`)
}

export function redeemMerchantFoodGroupBuy(payload: { storeId: number, voucherCode: string }) {
  return http.post<MerchantFoodOrderDetail>('/merchant/food/orders/group-buy/redemptions', payload)
}

export function getMerchantFoodRefundsPage(params: MerchantFoodPageParams & {
  storeId: number
  refundType?: MerchantFoodRefundType
  refundStatus?: MerchantFoodRefundStatus
  keyword?: string
}) {
  return http.get<MerchantFoodPageResult<MerchantFoodRefund>>('/merchant/food/refunds/page', params)
}

export function getMerchantFoodRefundDetail(refundId: number) {
  return http.get<MerchantFoodRefund>(`/merchant/food/refunds/${refundId}`)
}

export function approveMerchantFoodRefund(refundId: number, remark?: string) {
  return http.post<void>(`/merchant/food/refunds/${refundId}/approve`, remark ? { remark } : undefined)
}

export function rejectMerchantFoodRefund(refundId: number, remark?: string) {
  return http.post<void>(`/merchant/food/refunds/${refundId}/reject`, remark ? { remark } : undefined)
}

export function getMerchantFoodReconciliationOverview(params: MerchantFoodReconciliationQuery) {
  return http.get<MerchantFoodReconciliationOverview>('/merchant/food/reconciliation/overview', params)
}

export function getMerchantFoodWalletSummary(storeId: number) {
  return http.get<MerchantFoodWalletSummary>('/merchant/food/reconciliation/wallet', { storeId })
}

export function getMerchantFoodSettlementOrdersPage(params: MerchantFoodPageParams & MerchantFoodReconciliationQuery) {
  return http.get<MerchantFoodPageResult<MerchantFoodSettlementOrder>>('/merchant/food/reconciliation/order-bills/page', params)
}

export function getMerchantFoodCommissionBillsPage(params: MerchantFoodPageParams & MerchantFoodReconciliationQuery) {
  return http.get<MerchantFoodPageResult<MerchantFoodCommissionBill>>('/merchant/food/reconciliation/commission-bills/page', params)
}

export function getMerchantFoodBillsPage(params: MerchantFoodPageParams & MerchantFoodReconciliationQuery) {
  return http.get<MerchantFoodPageResult<MerchantFoodBill>>('/merchant/food/reconciliation/bills/page', params)
}

export function getMerchantFoodBillDetail(settlementId: number) {
  return http.get<MerchantFoodBill>(`/merchant/food/reconciliation/bills/${settlementId}`)
}
