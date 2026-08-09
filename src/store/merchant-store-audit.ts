import type {
  MerchantStoreAuditAddressSection,
  MerchantStoreAuditBasicSection,
  MerchantStoreAuditBusinessHoursSection,
  MerchantStoreAuditCategorySection,
  MerchantStoreAuditDraft,
  MerchantStoreAuditImagesSection,
  MerchantStoreAuditLegalEntitySection,
  MerchantStoreAuditPhonesSection,
  MerchantStoreAuditQualificationsSection,
  MerchantStoreAuditSnapshot,
} from '@/api/types/merchant-store'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getMerchantStoreAuditDraft,
  saveMerchantStoreAuditAddress,
  saveMerchantStoreAuditBasic,
  saveMerchantStoreAuditBusinessHours,
  saveMerchantStoreAuditCategory,
  saveMerchantStoreAuditImages,
  saveMerchantStoreAuditLegalEntity,
  saveMerchantStoreAuditPhones,
  saveMerchantStoreAuditQualifications,
} from '@/api/merchant-store'

type WithoutVersion<T extends { auditVersion: number }> = Omit<T, 'auditVersion'>

function emptySnapshot(): MerchantStoreAuditSnapshot {
  return {
    schemaVersion: 1,
    store: { galleryImages: [] },
    industry: {},
    businessHours: [],
    phones: [],
    legalEntity: {},
    qualifications: [],
  }
}

export const useMerchantStoreAuditStore = defineStore('merchant-store-audit', () => {
  const draft = ref<MerchantStoreAuditDraft>()
  const loading = ref(false)

  const snapshot = computed(() => draft.value?.pendingSnapshot ?? draft.value?.activeSnapshot ?? emptySnapshot())
  const editable = computed(() => Boolean(draft.value?.editable))
  const issueMessages = computed(() => Object.fromEntries(
    (draft.value?.auditIssues ?? []).map(issue => [issue.field, issue.message]),
  ))

  async function load(storeId: number, force = false) {
    if (!force && draft.value?.storeId === storeId)
      return draft.value
    loading.value = true
    try {
      draft.value = await getMerchantStoreAuditDraft(storeId)
      return draft.value
    }
    finally {
      loading.value = false
    }
  }

  async function save<T extends { auditVersion: number }>(
    storeId: number,
    payload: WithoutVersion<T>,
    request: (storeId: number, section: T) => Promise<MerchantStoreAuditDraft>,
  ) {
    if (!draft.value || draft.value.storeId !== storeId)
      await load(storeId, true)
    if (!draft.value?.editable)
      throw new Error('门店资料审核中，当前不可修改')
    draft.value = await request(storeId, {
      ...payload,
      auditVersion: draft.value.auditVersion,
    } as T)
    return draft.value
  }

  const saveBasic = (storeId: number, payload: WithoutVersion<MerchantStoreAuditBasicSection>) =>
    save(storeId, payload, saveMerchantStoreAuditBasic)
  const saveImages = (storeId: number, payload: WithoutVersion<MerchantStoreAuditImagesSection>) =>
    save(storeId, payload, saveMerchantStoreAuditImages)
  const saveCategory = (storeId: number, payload: WithoutVersion<MerchantStoreAuditCategorySection>) =>
    save(storeId, payload, saveMerchantStoreAuditCategory)
  const saveBusinessHours = (storeId: number, payload: WithoutVersion<MerchantStoreAuditBusinessHoursSection>) =>
    save(storeId, payload, saveMerchantStoreAuditBusinessHours)
  const savePhones = (storeId: number, payload: WithoutVersion<MerchantStoreAuditPhonesSection>) =>
    save(storeId, payload, saveMerchantStoreAuditPhones)
  const saveAddress = (storeId: number, payload: WithoutVersion<MerchantStoreAuditAddressSection>) =>
    save(storeId, payload, saveMerchantStoreAuditAddress)
  const saveLegalEntity = (storeId: number, payload: WithoutVersion<MerchantStoreAuditLegalEntitySection>) =>
    save(storeId, payload, saveMerchantStoreAuditLegalEntity)
  const saveQualifications = (storeId: number, payload: WithoutVersion<MerchantStoreAuditQualificationsSection>) =>
    save(storeId, payload, saveMerchantStoreAuditQualifications)

  function reset() {
    draft.value = undefined
  }

  return {
    draft,
    snapshot,
    editable,
    issueMessages,
    loading,
    load,
    saveBasic,
    saveImages,
    saveCategory,
    saveBusinessHours,
    savePhones,
    saveAddress,
    saveLegalEntity,
    saveQualifications,
    reset,
  }
})
