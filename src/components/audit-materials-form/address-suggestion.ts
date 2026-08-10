import type { AuditMaterialsAddressSuggestion } from './shared'

export function resolveAddressSuggestionText(item: AuditMaterialsAddressSuggestion) {
  return [item.detailAddress, item.address, item.title]
    .find(value => !!value?.trim())
    ?.trim() || ''
}

export function formatAddressSuggestionMeta(item: AuditMaterialsAddressSuggestion) {
  return [item.province, item.city, item.district, item.street]
    .filter(Boolean)
    .join(' · ')
}
