export interface ProductEditorSpecForm {
  key: number
  specId?: number
  specName: string
  price: string
  unit: string
  stockQuantity: number
  display: boolean
  detailItems: string[]
}

interface ProductSpecSource {
  specId?: number
  specName?: string
  salePrice?: number | string
  unitName?: string
  stockQuantity?: number
  isDisplay?: string
  detailItems?: string[]
}

export function createEditorSpec(key: number, overrides: Partial<ProductEditorSpecForm> = {}): ProductEditorSpecForm {
  return {
    key,
    specName: '',
    price: '',
    unit: '',
    stockQuantity: 9999,
    display: true,
    detailItems: [''],
    ...overrides,
  }
}

export function mapProductSpecs(specs: ProductSpecSource[] | undefined, legacyDescription = ''): ProductEditorSpecForm[] {
  if (!specs?.length) {
    return [createEditorSpec(0, { detailItems: [legacyDescription || ''] })]
  }

  return specs.map((spec, index) => {
    const display = spec.isDisplay === '1'
    const detailItems = spec.detailItems?.length
      ? [...spec.detailItems]
      : (display && legacyDescription ? [legacyDescription] : [''])
    return createEditorSpec(index, {
      specId: spec.specId,
      specName: spec.specName || '',
      price: String(spec.salePrice ?? ''),
      unit: spec.unitName || '',
      stockQuantity: spec.stockQuantity ?? 9999,
      display,
      detailItems,
    })
  })
}

export function validateEditorSpecs(specs: ProductEditorSpecForm[]): string | null {
  if (!specs.length)
    return '商品至少需要一个售卖规格'
  if (specs.filter(spec => spec.display).length !== 1)
    return '请选择一个展示规格'

  const names = new Set<string>()
  for (let index = 0; index < specs.length; index += 1) {
    const spec = specs[index]
    const position = index + 1
    const name = spec.specName.trim()
    if (!name || !spec.price || !spec.unit.trim())
      return `请完整填写规格${position}的名称、价格和单位`
    if (names.has(name))
      return '规格名称不能重复'
    names.add(name)
    if (!spec.detailItems.length || spec.detailItems.some(item => !item.trim()))
      return `规格${position}的菜品明细不能为空`
    if (spec.detailItems.some(item => item.trim().length > 50))
      return `规格${position}的每条菜品明细不能超过50字`
  }
  return null
}

export function buildSpecPayloads(specs: ProductEditorSpecForm[]) {
  return specs.map((spec, index) => ({
    specName: spec.specName.trim(),
    salePrice: Number(spec.price),
    unitName: spec.unit.trim(),
    stockQuantity: spec.stockQuantity,
    display: spec.display,
    sortNum: index,
    detailItems: spec.detailItems.map(item => item.trim()),
  }))
}
