export interface StoreSelectionItem {
  storeId: number
  isPublished?: string
  auditStatus?: string
}

export type StoreAccessAction = 'workbench' | 'lock'

export function isStoreApproved(store: StoreSelectionItem): boolean {
  return store.auditStatus === '2'
}

export function canCreateStore(stores: StoreSelectionItem[]): boolean {
  return stores.every(isStoreApproved)
}

export function resolveStoreAccessAction(store: StoreSelectionItem): StoreAccessAction {
  return store.isPublished === '1' || isStoreApproved(store) ? 'workbench' : 'lock'
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
  return stores.find(store => store.isPublished !== '1' && !isStoreApproved(store))?.storeId
}
