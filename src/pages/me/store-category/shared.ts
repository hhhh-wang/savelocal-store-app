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
    id: 'fast-food',
    label: '快餐',
    children: [
      { id: 'chinese-simple-meal', label: '中式简餐' },
      { id: 'rice-bowl', label: '盖饭' },
      { id: 'fried-snack', label: '炸鸡小吃' },
      { id: 'burger-sandwich', label: '汉堡三明治' },
    ],
  },
  {
    id: 'buffet',
    label: '自助餐',
    children: [
      { id: 'simple-buffet', label: '简餐' },
      { id: 'buffet-hot-pot', label: '火锅' },
      { id: 'buffet-barbecue', label: '烧烤' },
      { id: 'buffet-other', label: '其他' },
    ],
  },
  {
    id: 'hot-pot',
    label: '火锅',
    children: [
      { id: 'sichuan-hot-pot', label: '川渝火锅' },
      { id: 'cantonese-hot-pot', label: '粤式火锅' },
      { id: 'single-hot-pot', label: '小火锅' },
      { id: 'hot-pot-other', label: '其他' },
    ],
  },
  {
    id: 'special-snack',
    label: '特色小吃',
    children: [
      { id: 'stinky-tofu', label: '臭豆腐' },
      { id: 'fried-skewer', label: '炸串' },
      { id: 'local-snack', label: '地方小吃' },
      { id: 'snack-other', label: '其他' },
    ],
  },
  {
    id: 'dessert',
    label: '糕点甜品',
    children: [
      { id: 'cake', label: '蛋糕' },
      { id: 'dessert-pudding', label: '布丁甜品' },
      { id: 'bread', label: '面包烘焙' },
      { id: 'dessert-other', label: '其他' },
    ],
  },
  {
    id: 'tea-drink',
    label: '奶茶饮料',
    children: [
      { id: 'milk-tea', label: '奶茶' },
      { id: 'fruit-tea', label: '果茶' },
      { id: 'coffee', label: '咖啡' },
      { id: 'drink-other', label: '其他' },
    ],
  },
  {
    id: 'japanese-korean',
    label: '日韩料理',
    children: [
      { id: 'sushi', label: '寿司' },
      { id: 'korean-bibimbap', label: '韩式拌饭' },
      { id: 'ramen', label: '拉面' },
      { id: 'jk-other', label: '其他' },
    ],
  },
  {
    id: 'local-cuisine',
    label: '地方菜系',
    children: [
      { id: 'xiang-cuisine', label: '湘菜' },
      { id: 'cantonese-cuisine', label: '粤菜' },
      { id: 'northeast-cuisine', label: '东北菜' },
      { id: 'local-cuisine-other', label: '其他' },
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
    primaryId: 'fast-food',
    secondaryId: 'chinese-simple-meal',
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
