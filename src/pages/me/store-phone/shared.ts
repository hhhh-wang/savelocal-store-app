export type StorePhoneAuditStatus = 'approved' | 'pending' | 'rejected'

export interface StorePhoneSource {
  phoneId?: number
  draftKey?: string
  phoneNumber: string
  auditStatus?: string
}

export interface StorePhoneInputItem {
  id: number
  draftKey: string
  value: string
  auditStatus: StorePhoneAuditStatus
}

function resolveAuditStatus(auditStatus?: string): StorePhoneAuditStatus {
  if (auditStatus === '1')
    return 'approved'
  if (auditStatus === '2')
    return 'rejected'
  return 'pending'
}

function mapPhone(phone: StorePhoneSource, index: number): StorePhoneInputItem {
  return {
    id: phone.phoneId ?? -(index + 1),
    draftKey: phone.draftKey || (index === 0 ? 'primary' : `phone-${index + 1}`),
    value: phone.phoneNumber,
    auditStatus: resolveAuditStatus(phone.auditStatus),
  }
}

export function buildInitialPhoneNumbers(
  phones: StorePhoneSource[],
  fallbackPhone = '',
): StorePhoneInputItem[] {
  if (phones.length)
    return phones.map(mapPhone)

  return [{
    id: -1,
    draftKey: 'primary',
    value: fallbackPhone.trim(),
    auditStatus: 'pending',
  }]
}
