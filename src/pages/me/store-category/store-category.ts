export interface StoreCategorySecondaryOption {
  id: string
  label: string
}

export interface StoreCategoryPrimaryOption {
  id: string
  label: string
  children: StoreCategorySecondaryOption[]
}

export interface StoreCategorySelection {
  primaryId: string
  secondaryId: string
}

export const storeCategoryStorageKey = 'store-category-selection'
export const storeCategoryRootLabel = '餐饮'

export const storeCategoryOptions: StoreCategoryPrimaryOption[] = [
  {
    id: 'FOOD',
    label: '餐饮美食',
    children: [
      { id: 'CATERING', label: '餐厅' },
      { id: 'SNACK', label: '小吃' },
      { id: 'CAFE', label: '咖啡茶饮' },
    ],
  },
]

function cloneSelection(selection: StoreCategorySelection): StoreCategorySelection {
  return {
    primaryId: selection.primaryId,
    secondaryId: selection.secondaryId,
  }
}

export function createDefaultStoreCategorySelection(): StoreCategorySelection {
  return {
    primaryId: 'FOOD',
    secondaryId: 'CATERING',
  }
}

export function findStoreCategoryPrimary(primaryId: string) {
  return storeCategoryOptions.find(category => category.id === primaryId)
}

export function findStoreCategorySecondary(primaryId: string, secondaryId: string) {
  return findStoreCategoryPrimary(primaryId)?.children.find(category => category.id === secondaryId)
}

export function normalizeStoreCategorySelection(payload: Partial<StoreCategorySelection> | undefined | null): StoreCategorySelection {
  const defaultSelection = createDefaultStoreCategorySelection()
  const primaryOption = findStoreCategoryPrimary(payload?.primaryId ?? '') ?? findStoreCategoryPrimary(defaultSelection.primaryId)!
  const secondaryOption = findStoreCategorySecondary(primaryOption.id, payload?.secondaryId ?? '')
    ?? primaryOption.children[0]

  return {
    primaryId: primaryOption.id,
    secondaryId: secondaryOption.id,
  }
}

export function getStoreCategoryLabels(selection: StoreCategorySelection) {
  const safeSelection = normalizeStoreCategorySelection(selection)
  const primaryOption = findStoreCategoryPrimary(safeSelection.primaryId)!
  const secondaryOption = findStoreCategorySecondary(safeSelection.primaryId, safeSelection.secondaryId)!

  return {
    rootLabel: storeCategoryRootLabel,
    primaryLabel: primaryOption.label,
    secondaryLabel: secondaryOption.label,
  }
}

export function formatStoreCategoryPath(selection: StoreCategorySelection) {
  const labels = getStoreCategoryLabels(selection)

  return `${labels.rootLabel}-${labels.primaryLabel}-${labels.secondaryLabel}`
}

export function formatStoreCategorySummary(selection: StoreCategorySelection) {
  const labels = getStoreCategoryLabels(selection)

  return `${labels.primaryLabel}-${labels.secondaryLabel}`
}

export function loadStoreCategorySelection() {
  try {
    const storedValue = uni.getStorageSync(storeCategoryStorageKey) as Partial<StoreCategorySelection> | undefined
    return normalizeStoreCategorySelection(storedValue)
  }
  catch (error) {
    console.log('读取门店品类失败，使用默认值:', error)
    return createDefaultStoreCategorySelection()
  }
}

export function saveStoreCategorySelection(selection: StoreCategorySelection) {
  uni.setStorageSync(storeCategoryStorageKey, cloneSelection(normalizeStoreCategorySelection(selection)))
}
