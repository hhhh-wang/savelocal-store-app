import type { MerchantFoodProductType } from './types/merchant-food'
import { http } from '@/http/http'

export interface MerchantFoodNewCustomerProduct {
  productId: number
  productName: string
  productType: MerchantFoodProductType
  coverImageUrl?: string
  saleStatus: string
  auditStatus: string
  specId: number
  specName?: string
  salePrice: number
  stockQuantity: number
  activityId?: number
  activityStatus?: string
  activityStartTime?: string
  activityEndTime?: string
  reduceAmount?: number
  inventoryLimit?: number
  inventoryUsed?: number
}

export interface MerchantFoodNewCustomerProductPage {
  rows: MerchantFoodNewCustomerProduct[]
  total: number
}

export interface MerchantFoodNewCustomerDiscountSavePayload {
  activityId?: number
  storeId: number
  productId: number
  specId: number
  reduceAmount: number
  startDate: string
  endDate: string
  inventoryLimit: number
  remark?: string
}

export interface MerchantFoodNewCustomerActivity {
  activityId: number
  productId: number
  specId: number
  status: string
  startTime: string
  endTime: string
  reduceAmount: number
  inventoryLimit: number
}

export function getMerchantFoodNewCustomerProducts(storeId: number, params: {
  productType?: MerchantFoodProductType
  name?: string
} = {}) {
  return http.get<MerchantFoodNewCustomerProductPage>('/merchant/food/marketing/new-customer/products', {
    storeId,
    ...params,
  })
}

export function saveMerchantFoodNewCustomerDiscount(payload: MerchantFoodNewCustomerDiscountSavePayload) {
  return http.post<MerchantFoodNewCustomerActivity>('/merchant/food/marketing/new-customer', payload)
}

export function updateMerchantFoodNewCustomerStatus(storeId: number, activityId: number, status: 'PAUSED' | 'ENDED') {
  return http.put<void>(`/merchant/food/marketing/new-customer/${activityId}/status`, { status }, { storeId })
}
