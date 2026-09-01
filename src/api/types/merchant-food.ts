export type MerchantFoodScene = 'ALL' | 'ONSITE' | 'TAKEOUT' | 'GROUP_BUY'
export type MerchantFoodProductType = 'TAKEOUT' | 'DEAL'
export type MerchantFoodSaleStatus = 'ON_SALE' | 'OFF_SHELF'
export type MerchantFoodAuditStatus = '0' | '1' | '2'
export type MerchantFoodOrderStatus
  = | 'PENDING'
    | 'PAID'
    | 'DELIVERING'
    | 'DELIVERY_EXCEPTION'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'REFUNDING'
    | 'REFUNDED'
export type MerchantFoodRefundType = 'BEFORE' | 'AFTER'
export type MerchantFoodRefundStatus = '0' | '1' | '2' | '3' | '4' | '5'

export interface MerchantFoodPageParams {
  pageNum: number
  pageSize: number
}

export interface MerchantFoodPageResult<T> {
  code: number
  msg: string
  rows: T[]
  total: number
}

export interface MerchantFoodStore {
  storeId: number
  merchantId: number
  merchantName?: string
  storeNo?: string
  storeName: string
  shortName?: string
  contactName?: string
  contactMobile?: string
  servicePhone?: string
  provinceCode?: string
  cityCode?: string
  districtCode?: string
  addressDetail?: string
  longitude?: number
  latitude?: number
  coverImage?: string
  galleryImages?: string
  storeDesc?: string
  isPublished?: string
  auditStatus?: MerchantFoodAuditStatus
  storeStatus?: string
  rejectReason?: string
  mainIndustryCode?: string
  extendIndustryCodes?: string
}

export interface MerchantFoodBusinessTime {
  timeId?: number
  storeId?: number
  dayOfWeek: number
  startTime: string
  endTime: string
  crossDay?: string
  status?: string
}

export interface MerchantFoodStorePhone {
  phoneId: number
  storeId: number
  phoneNumber: string
  sortNum: number
  auditStatus?: MerchantFoodAuditStatus
  rejectReason?: string
  status?: string
}

export interface MerchantFoodProfileChange {
  changeId: number
  storeId: number
  changeType: string
  beforeSnapshot?: string
  afterSnapshot?: string
  auditStatus: MerchantFoodAuditStatus
  rejectReason?: string
}

export interface MerchantFoodStoreProfile {
  store: MerchantFoodStore
  businessTimes: MerchantFoodBusinessTime[]
  phones: MerchantFoodStorePhone[]
}

export interface MerchantFoodAddressSuggestion {
  title?: string
  address?: string
  detailAddress?: string
  province?: string
  city?: string
  district?: string
  street?: string
  streetNumber?: string
  latitude?: number
  longitude?: number
  adcode?: string
  category?: string
  distanceMeters?: number
}

export interface MerchantFoodBusinessStatusPayload {
  storeStatus: '0' | '1'
}

export type MerchantFoodQuickStatusValue = '0' | '1' | '2'

export interface MerchantFoodQuickStatus {
  storeStatus: MerchantFoodQuickStatusValue
  adjustable: boolean
}

export interface MerchantFoodQuickStatusPayload {
  storeStatus: MerchantFoodQuickStatusValue
}

export interface MerchantFoodProfileChangePayload {
  changeType: 'NAME' | 'ADDRESS' | 'PROFILE'
  storeName?: string
  shortName?: string
  provinceCode?: string
  cityCode?: string
  districtCode?: string
  addressDetail?: string
  longitude?: number
  latitude?: number
}

export interface MerchantFoodPhonePayload {
  phoneNumber: string
  sortNum?: number
}

export interface MerchantFoodQualificationType {
  typeId: number
  qualificationCode: string
  qualificationName: string
  qualificationScope?: string
  industryCode?: string
  isRequired?: string
  sortNum?: number
  status?: string
}

export interface MerchantFoodQualification {
  qualificationId: number
  qualificationCode: string
  qualificationName?: string
  qualificationScope?: string
  qualificationNo?: string
  qualificationImages?: string
  validFrom?: string
  validTo?: string
  auditStatus?: MerchantFoodAuditStatus
  rejectReason?: string
  isRequired?: string
}

export interface MerchantFoodQualifications {
  types: MerchantFoodQualificationType[]
  qualifications: MerchantFoodQualification[]
}

export interface MerchantQualifications {
  templates: MerchantFoodQualificationType[]
  qualificationTypeOptions: MerchantFoodQualificationType[]
  records: MerchantFoodQualification[]
}

export interface MerchantQualificationPayload {
  qualificationCode: string
  qualificationScope: '1' | '2'
  qualificationNo?: string
  qualificationImages: string
  validFrom?: string
  validTo?: string
  remark?: string
}

export interface MerchantFoodQualificationPayload {
  qualificationCode: string
  qualificationNo?: string
  qualificationImages: string[]
  validFrom?: string
  validTo?: string
  remark?: string
}

export interface MerchantFoodAlbumImage {
  imageId: number
  storeId: number
  imageUrl: string
  auditStatus: MerchantFoodAuditStatus
  rejectReason?: string
  useCount?: number
}

export interface MerchantFoodProductSpec {
  specId: number
  productId: number
  specName: string
  salePrice: number
  unitName: string
  stockQuantity: number
  isDisplay: string
  status?: string
  sortNum?: number
  detailItems: string[]
}

export interface MerchantFoodProduct {
  productId: number
  storeId: number
  productNo?: string
  productName: string
  productType: MerchantFoodProductType
  coverImageId: number
  coverImageUrl?: string
  tagText?: string
  productDesc?: string
  saleStatus: MerchantFoodSaleStatus
  auditStatus: MerchantFoodAuditStatus
  packingFee: number | string
  singleNoDelivery: boolean
  sortNum?: number
  specs: MerchantFoodProductSpec[]
}

export interface MerchantFoodProductSpecPayload {
  specName: string
  salePrice: number
  unitName: string
  stockQuantity: number
  display: boolean
  sortNum?: number
  detailItems: string[]
}

export interface MerchantFoodProductPayload {
  productName: string
  productType: MerchantFoodProductType
  coverImageId: number
  tagText?: string
  productDesc?: string
  packingFee: number
  singleNoDelivery?: boolean
  sortNum?: number
  specs: MerchantFoodProductSpecPayload[]
}

export interface MerchantFoodOrder {
  scene: Exclude<MerchantFoodScene, 'ALL'>
  orderId: number
  orderNo: string
  storeId: number
  storeName: string
  productName?: string
  imageUrl?: string
  amount: number
  originalAmount?: number
  cityCoinDeductAmount?: number
  quantity: number
  orderStatus: MerchantFoodOrderStatus
  statusText: string
  todo: boolean
  refundId?: number
  refundAmount?: number
  refundStatus?: MerchantFoodRefundStatus
  orderTime?: string
  payTime?: string
  customerName?: string
  customerMobileMask?: string
  buyerRemark?: string
  deliveryAddress?: string
  deliveryStatus?: string
  dispatchStatus?: string
  distanceKm?: number | string
  courierName?: string
  courierPhone?: string
  riderUpdateTime?: string
  productKinds?: number
}

export interface MerchantFoodOrderItem {
  itemId: number
  orderId: number
  orderNo: string
  productId?: number
  specId?: number
  productNameSnapshot: string
  specNameSnapshot?: string
  imageUrlSnapshot?: string
  unitPrice: number
  unitSequence?: number
  quantity: number
  totalAmount: number
}

export interface MerchantFoodOrderFulfillment {
  dispatchStatus?: string
  deliveryStatus?: string
  keloopStatus?: string
  dispatchFailReason?: string
  courierName?: string
  courierTel?: string
  lastStatusTime?: string
  deliveryContactName?: string
  deliveryContactPhone?: string
  deliveryFullAddress?: string
  distanceKm?: number | string
  buyerRemark?: string
}

export interface MerchantFoodOrderTimeline {
  logId?: number
  eventTime?: string
  createTime?: string
  deliveryStatus?: string
  title?: string
  operatorName?: string
  operatorTel?: string
}

export interface MerchantFoodOrderDetail extends MerchantFoodOrder {
  memberId?: number
  memberNickname?: string
  memberMobileMask?: string
  buyerRemark?: string
  deliveryAddress?: string
  voucherQrContent?: string
  benefitRateMilli?: number
  techFeeRateMilli?: number
  benefitAmount?: number
  platformTechFeeAmount?: number
  settlementAmount?: number
  refundAmount?: number
  fulfillment?: MerchantFoodOrderFulfillment
  timeline?: MerchantFoodOrderTimeline[]
  availableActions?: string[]
  items: MerchantFoodOrderItem[]
}

export interface MerchantFoodOrderContactResult {
  code: number
  msg: string
  contact: string
}

export interface MerchantFoodRefund {
  refundId: number
  refundNo: string
  orderId: number
  orderNo: string
  storeId: number
  storeName: string
  productName?: string
  productImage?: string
  quantity?: number
  productSummary?: string
  memberId?: number
  memberNickname?: string
  memberMobileMask?: string
  refundType: MerchantFoodRefundType
  refundReason?: string
  refundAmount: number
  couponReturnAmount?: number
  cityCoinReturnAmount?: number
  refundStatus: MerchantFoodRefundStatus
  merchantHandleBy?: string
  merchantHandleRemark?: string
}

export interface MerchantFoodReconciliationStat {
  completedCount: number
  completedAmount: number
  onsiteCount: number
  onsiteAmount: number
  progressCount: number
  progressAmount: number
  todayCount: number
  todayAmount: number
  historyCount: number
  historyAmount: number
  settlementAmount: number
}

export interface MerchantFoodReconciliationOverview {
  all: MerchantFoodReconciliationStat
  onsite: MerchantFoodReconciliationStat
  groupBuy: MerchantFoodReconciliationStat
}

export interface MerchantFoodWalletSummary {
  availableAmount: number
  frozenAmount: number
  todayRefundAmount: number
  totalAmount: number
}

export interface MerchantFoodBill {
  settlementId: number
  settlementNo: string
  storeId: number
  storeName: string
  scene: Exclude<MerchantFoodScene, 'ALL'>
  orderId: number
  orderNo: string
  originalAmount: number
  benefitAmount: number
  platformTechFeeAmount: number
  settlementAmount: number
  settlementStatus: string
  withdrawId?: number
  plannedAvailableTime?: string
  availableTime?: string
  createTime?: string
}

/** 对账页订单结算列表，不包含技术服务费字段。 */
export interface MerchantFoodSettlementOrder {
  settlementId: number
  settlementNo: string
  scene: Exclude<MerchantFoodScene, 'ALL'>
  orderId: number
  orderNo: string
  settlementAmount: number
  settlementStatus: string
  withdrawId?: number
  plannedAvailableTime?: string
  availableTime?: string
  createTime?: string
}

export interface MerchantFoodCommissionBill {
  foodOrderId: number
  unifiedOrderId: number
  orderNo: string
  scene: Exclude<MerchantFoodScene, 'ALL'>
  originalAmount: number
  benefitAmount: number
  platformTechFeeAmount: number
  settlementAmount: number
  refundAmount: number
  orderStatus: MerchantFoodOrderStatus
  billTime?: string
}

export interface MerchantFoodReconciliationQuery {
  storeId: number
  scene?: MerchantFoodScene
  startTime?: string
  endTime?: string
  month?: string
  todayOnly?: boolean
  settlementStatus?: string
}
