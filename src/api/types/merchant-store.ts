export interface MerchantStoreAuditMaterials {
  auditVersion: number
  mainIndustryCode: string
  storeCategoryCode: string
  storeName: string
  legalPersonName: string
  legalPersonPhone: string
  storeAddress: string
  provinceCode?: string
  cityCode?: string
  districtCode?: string
  longitude?: number
  latitude?: number
  businessLicenseCode: string
  businessLicenseUrl: string
  foodPermitUrl: string
  legalPersonIdFrontUrl: string
  legalPersonIdBackUrl: string
}

export interface MerchantStoreAuditIssue {
  field: string
  message: string
}

export interface MerchantStoreAuditStoreSection {
  storeName?: string
  shortName?: string
  contactName?: string
  contactMobile?: string
  servicePhone?: string
  storeDesc?: string
  coverImage?: string
  galleryImages: string[]
  addressText?: string
  provinceCode?: string
  cityCode?: string
  districtCode?: string
  addressDetail?: string
  longitude?: number
  latitude?: number
  storeStatus?: '0' | '1'
}

export interface MerchantStoreAuditBusinessHour {
  dayOfWeek: number
  startTime: string
  endTime: string
  crossDay?: string
}

export interface MerchantStoreAuditPhone {
  draftKey: string
  phoneNumber: string
  sortNum: number
}

export interface MerchantStoreAuditLegalEntity {
  subjectName?: string
  subjectType?: string
  unifiedSocialCode?: string
  legalPersonName?: string
  legalPersonPhone?: string
  legalPersonIdType?: string
  legalPersonIdNo?: string
  legalPersonIdFront?: string
  legalPersonIdBack?: string
}

export interface MerchantStoreAuditQualification {
  qualificationCode: string
  qualificationName?: string
  qualificationNo?: string
  qualificationImages: string[]
  validFrom?: string
  validTo?: string
  remark?: string
}

export interface MerchantStoreAuditSnapshot {
  schemaVersion: number
  store: MerchantStoreAuditStoreSection
  industry: {
    mainIndustryCode?: string
    storeCategoryCode?: string
  }
  businessHours: MerchantStoreAuditBusinessHour[]
  phones: MerchantStoreAuditPhone[]
  legalEntity: MerchantStoreAuditLegalEntity
  qualifications: MerchantStoreAuditQualification[]
}

export interface MerchantStoreAuditVersionedSection {
  auditVersion: number
}

export type MerchantStoreAuditBasicSection = MerchantStoreAuditVersionedSection & Pick<
  MerchantStoreAuditStoreSection,
  'storeName' | 'shortName' | 'contactName' | 'storeDesc'
>

export type MerchantStoreAuditImagesSection = MerchantStoreAuditVersionedSection & Pick<
  MerchantStoreAuditStoreSection,
  'coverImage' | 'galleryImages'
>

export interface MerchantStoreAuditCategorySection extends MerchantStoreAuditVersionedSection {
  mainIndustryCode: string
  storeCategoryCode: string
}

export interface MerchantStoreAuditBusinessHoursSection extends MerchantStoreAuditVersionedSection {
  businessHours: MerchantStoreAuditBusinessHour[]
  storeStatus?: '0' | '1'
}

export interface MerchantStoreAuditPhonesSection extends MerchantStoreAuditVersionedSection {
  phones: MerchantStoreAuditPhone[]
}

export type MerchantStoreAuditAddressSection = MerchantStoreAuditVersionedSection & Pick<
  MerchantStoreAuditStoreSection,
  'addressText' | 'provinceCode' | 'cityCode' | 'districtCode' | 'longitude' | 'latitude'
>

export interface MerchantStoreAuditLegalEntitySection extends MerchantStoreAuditVersionedSection {
  legalEntity: MerchantStoreAuditLegalEntity
}

export interface MerchantStoreAuditQualificationsSection extends MerchantStoreAuditVersionedSection {
  qualifications: MerchantStoreAuditQualification[]
}

export interface MerchantStoreAuditOptions {
  mainIndustries: Array<{
    label: string
    value: string
    categories: Array<{ label: string, value: string }>
  }>
  requiredDocuments: Array<{ code: string, name: string }>
}

export interface MerchantStoreAuditDraft {
  storeId: number
  auditStatus: string
  auditType: string
  isPublished: string
  auditVersion: number
  editable: boolean
  materials: MerchantStoreAuditMaterials
  activeSnapshot?: MerchantStoreAuditSnapshot | null
  pendingSnapshot?: MerchantStoreAuditSnapshot | null
  auditSummary?: string | null
  auditIssues: MerchantStoreAuditIssue[]
}
