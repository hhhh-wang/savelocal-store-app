import { http } from '@/http/http'

export interface PurchaseNoticeTemplate {
  templateId: number
  templateName: string
  inUse: boolean
  rules: string[]
  auditStatus: string
  rejectReason?: string
}

export interface PurchaseNoticeProduct {
  productId: number
  productName: string
  productType: 'DEAL' | 'TAKEOUT'
  coverImageUrl?: string
  saleStatus: string
  salePrice: number
  stockQuantity: number
  noticeTemplateId?: number
  noticeTemplateName?: string
}

const baseUrl = '/merchant/food/stores'

export function getPurchaseNoticeTemplates(storeId: number) {
  return http.get<PurchaseNoticeTemplate[]>(`${baseUrl}/${storeId}/purchase-notice/templates`)
}

export function createPurchaseNoticeTemplate(storeId: number, data: { templateName: string }) {
  return http.post<PurchaseNoticeTemplate>(`${baseUrl}/${storeId}/purchase-notice/templates`, data)
}

export function savePurchaseNoticeTemplate(storeId: number, templateId: number, data: {
  templateName?: string
  rules?: string[]
  submit?: boolean
}) {
  return http.put<PurchaseNoticeTemplate>(`${baseUrl}/${storeId}/purchase-notice/templates/${templateId}`, data)
}

export function deletePurchaseNoticeTemplate(storeId: number, templateId: number) {
  return http.delete<void>(`${baseUrl}/${storeId}/purchase-notice/templates/${templateId}`)
}

export function applyPurchaseNoticeTemplate(storeId: number, templateId: number) {
  return http.put<void>(`${baseUrl}/${storeId}/purchase-notice/templates/${templateId}/apply`)
}

export function getPurchaseNoticeProducts(storeId: number, params: {
  productType?: string
  keyword?: string
} = {}) {
  return http.get<PurchaseNoticeProduct[]>(`${baseUrl}/${storeId}/purchase-notice/products`, params)
}

export function bindPurchaseNoticeTemplate(storeId: number, productId: number, templateId: number | null) {
  return http.put<void>(`${baseUrl}/${storeId}/purchase-notice/products/${productId}/notice-template`, { templateId })
}
