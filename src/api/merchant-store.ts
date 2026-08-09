import type {
  MerchantStoreAuditDraft,
  MerchantStoreAuditAddressSection,
  MerchantStoreAuditBasicSection,
  MerchantStoreAuditBusinessHoursSection,
  MerchantStoreAuditCategorySection,
  MerchantStoreAuditImagesSection,
  MerchantStoreAuditLegalEntitySection,
  MerchantStoreAuditMaterials,
  MerchantStoreAuditOptions,
  MerchantStoreAuditPhonesSection,
  MerchantStoreAuditQualificationsSection,
} from './types/merchant-store'
import { http } from '@/http/http'

export function createMerchantStoreDraft() {
  return http.post<MerchantStoreAuditDraft>('/merchant/stores/draft')
}

export function getMerchantStoreAuditDraft(storeId: number) {
  return http.get<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft`)
}

export function getMerchantStoreAuditOptions() {
  return http.get<MerchantStoreAuditOptions>('/merchant/store-audit/options')
}

export function saveMerchantStoreAuditMaterials(storeId: number, materials: MerchantStoreAuditMaterials) {
  return http.put<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/materials`, materials)
}

export function saveMerchantStoreAuditBasic(storeId: number, section: MerchantStoreAuditBasicSection) {
  return http.put<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/basic`, section)
}

export function saveMerchantStoreAuditImages(storeId: number, section: MerchantStoreAuditImagesSection) {
  return http.put<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/images`, section)
}

export function saveMerchantStoreAuditCategory(storeId: number, section: MerchantStoreAuditCategorySection) {
  return http.put<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/category`, section)
}

export function saveMerchantStoreAuditBusinessHours(storeId: number, section: MerchantStoreAuditBusinessHoursSection) {
  return http.put<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/business-hours`, section)
}

export function saveMerchantStoreAuditPhones(storeId: number, section: MerchantStoreAuditPhonesSection) {
  return http.put<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/phones`, section)
}

export function saveMerchantStoreAuditAddress(storeId: number, section: MerchantStoreAuditAddressSection) {
  return http.put<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/address`, section)
}

export function saveMerchantStoreAuditLegalEntity(storeId: number, section: MerchantStoreAuditLegalEntitySection) {
  return http.put<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/legal-entity`, section)
}

export function saveMerchantStoreAuditQualifications(storeId: number, section: MerchantStoreAuditQualificationsSection) {
  return http.put<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/qualifications`, section)
}

export function submitMerchantStoreAudit(storeId: number, materials: MerchantStoreAuditMaterials) {
  return http.post<MerchantStoreAuditDraft>(`/merchant/stores/${storeId}/audit-draft/submit`, materials)
}

export function cancelMerchantStoreAuditDraft(storeId: number, auditVersion: number) {
  return http.delete<void>(`/merchant/stores/${storeId}/audit-draft`, { auditVersion })
}
