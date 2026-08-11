export interface AuditMaterialsFormValue extends Record<string, string> {
  mainIndustryCode: string
  storeCategoryCode: string
  storeName: string
  legalPersonName: string
  legalPersonPhone: string
  storeAddress: string
  businessLicenseCode: string
  businessLicenseUrl?: string
  foodPermitUrl?: string
  legalPersonIdFrontUrl?: string
  legalPersonIdBackUrl?: string
  auditVersion?: string
}

export interface AuditMaterialsOption {
  label: string
  value: string
}

export interface AuditMaterialsSelectField {
  key: string
  label: string
  required?: boolean
  options: AuditMaterialsOption[]
  issueMessage?: string
}

export interface AuditMaterialsTextField {
  key: string
  label: string
  required?: boolean
  type?: 'text' | 'number' | 'tel'
  placeholder?: string
  issueMessage?: string
}

export interface AuditMaterialsAddressSuggestion {
  title?: string
  address?: string
  detailAddress?: string
  province?: string
  city?: string
  district?: string
  street?: string
  latitude?: number
  longitude?: number
  adcode?: string
}

export interface AuditMaterialsDocumentItem {
  key: string
  title: string
  required?: boolean
  emptyText?: string
  imageUrl?: string
  fileUrl?: string
  fileName?: string
  issueMessage?: string
}

export interface AuditMaterialsValidationResult {
  valid: boolean
  missingType?: 'field' | 'document'
  missingKey?: string
}

export function validateAuditMaterials(
  value: AuditMaterialsFormValue,
  requiredFieldKeys: string[],
  requiredDocumentKeys: string[],
  uploadedDocumentKeys: string[],
): AuditMaterialsValidationResult {
  const missingFieldKey = requiredFieldKeys.find(key => !value[key]?.trim())
  if (missingFieldKey) {
    return { valid: false, missingType: 'field', missingKey: missingFieldKey }
  }

  const missingDocumentKey = requiredDocumentKeys.find(key => !uploadedDocumentKeys.includes(key))
  if (missingDocumentKey) {
    return { valid: false, missingType: 'document', missingKey: missingDocumentKey }
  }

  return { valid: true }
}
