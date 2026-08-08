export type AuditMaterialsFormValue = Record<string, string>

export interface AuditMaterialsOption {
  label: string
  value: string
}

export interface AuditMaterialsSelectField {
  key: string
  label: string
  required?: boolean
  options: AuditMaterialsOption[]
}

export interface AuditMaterialsTextField {
  key: string
  label: string
  required?: boolean
  type?: 'text' | 'number' | 'tel'
  placeholder?: string
}

export interface AuditMaterialsDocumentItem {
  key: string
  title: string
  required?: boolean
  emptyText?: string
  imageUrl?: string
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
