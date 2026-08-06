export interface StoreSelectionItem {
  storeId: number
  auditStatus?: string
}

export function shouldShowStoreAccessScope(
  stores: StoreSelectionItem[],
  mode: string,
): boolean {
  return stores.length === 0 || stores.length > 1 || mode === 'test'
}

export function resolveCurrentStoreId(
  stores: StoreSelectionItem[],
  persistedStoreId?: number,
): number | undefined {
  if (persistedStoreId && stores.some(store => store.storeId === persistedStoreId)) {
    return persistedStoreId
  }
  return stores[0]?.storeId
}

export function resolveStoreIdForCreate(stores: StoreSelectionItem[]): number | undefined {
  return stores.find(store => store.auditStatus !== '2')?.storeId
}
