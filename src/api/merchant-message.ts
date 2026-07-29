import type { MerchantMessage, MerchantMessageCategory, MerchantMessagePage, MerchantMessageSummary } from './types/merchant-message'
import { http } from '@/http/http'

const baseUrl = '/merchant/food/dashboard/messages'

export function getMerchantMessageSummary(storeId?: number) {
  return http.get<MerchantMessageSummary>(`${baseUrl}/summary`, { storeId })
}

export function getMerchantMessages(category: MerchantMessageCategory, pageNum = 1, pageSize = 20, storeId?: number) {
  return http.get<MerchantMessagePage>(baseUrl, { category, pageNum, pageSize, storeId })
}

export function getMerchantMessage(messageId: string) {
  return http.get<MerchantMessage>(`${baseUrl}/${messageId}`)
}

export function markMerchantMessageRead(messageId: string) {
  return http.put<void>(`${baseUrl}/${messageId}/read`)
}
