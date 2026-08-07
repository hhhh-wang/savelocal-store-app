export type StorePhoneAuditStatus = 'approved' | 'pending' | 'rejected'

export interface StorePhoneSource {
  phoneId: number
  phoneNumber: string
  auditStatus?: string
}

export interface StorePhoneInputItem {
  id: number
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

function mapPhone(phone: StorePhoneSource): StorePhoneInputItem {
  return {
    id: phone.phoneId,
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
    value: fallbackPhone.trim(),
    auditStatus: 'pending',
  }]
}
