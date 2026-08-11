export const defaultAuditPagePath = '/pages/me/store-audit/index'

function appendStoreId(path: string, storeId: number) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}storeId=${encodeURIComponent(String(storeId))}`
}

export function buildAuditPagePath(storeId: number, basePath = defaultAuditPagePath) {
  return appendStoreId(basePath, storeId)
}

export function buildStoreCreateLockRoute(
  storeId: number,
  auditPagePath = defaultAuditPagePath,
) {
  const resolvedAuditPagePath = buildAuditPagePath(storeId, auditPagePath)
  const query = [
    `storeId=${encodeURIComponent(String(storeId))}`,
    `auditPath=${encodeURIComponent(resolvedAuditPagePath)}`,
  ].join('&')

  return `/pages/me/store-create-lock/index?${query}`
}
