export interface MerchantStoreCreatePayload {
  storeName: string
  shortName?: string
  contactName: string
  contactMobile: string
  addressDetail: string
  mainIndustryCode: string
}

export interface MerchantStoreCreateResponse {
  storeId: number
}

export interface MerchantStoreAuditResponse {
  auditStatus?: string
}
