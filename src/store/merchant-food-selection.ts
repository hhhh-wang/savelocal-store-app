export interface StoreSelectionItem {
  storeId: number
}

export function shouldShowStoreAccessScope(
  stores: StoreSelectionItem[],
  mode: string,
): boolean {
  return stores.length > 1 || mode === 'test'
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
