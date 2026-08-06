import type {
  MerchantStoreAuditResponse,
  MerchantStoreCreatePayload,
  MerchantStoreCreateResponse,
} from './types/merchant-store'
import { http } from '@/http/http'

export function createMerchantStore(payload: MerchantStoreCreatePayload) {
  return http.post<MerchantStoreCreateResponse>('/merchant/stores', payload)
}

export function submitMerchantStoreForAudit(storeId: number) {
  return http.post<MerchantStoreAuditResponse>(`/merchant/stores/${storeId}/submit-audit`)
}
