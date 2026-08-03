<script lang="ts" setup>
import type { ProductEditorSpecForm } from './product-editor-form'
import type { MerchantFoodProduct } from '@/api/types/merchant-food'
import { createMerchantFoodProduct, getMerchantFoodProductDetail, updateMerchantFoodProduct } from '@/api/merchant-food'
import { useMerchantFoodStore } from '@/store'
import {
  buildSpecPayloads,
  createEditorSpec,
  mapProductSpecs,
  validateEditorSpecs,
} from './product-editor-form'

defineOptions({
  name: 'ProductEditorPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '编辑菜品',
  },
})

type EditorMode = 'create' | 'edit'
type ProductKind = 'takeout' | 'deal'
interface ProductEditorPayload {
  name?: string
  imageUrl?: string
  kind?: ProductKind
  tag?: string
  price?: string
  unit?: string
  description?: string
}
interface ProductEditorForm {
  name: string
  imageText: string
  imageUrl: string
  coverImageId: number
  kind: ProductKind
  tag: string
  packingFee: string
  specs: ProductEditorSpecForm[]
}
interface SelectedAlbumImage {
  id: number
  src: string
  status: '通过' | '未通过'
}

const fallbackUrl = '/pages/dashboard/product-library/index'
const merchantFoodStore = useMerchantFoodStore()
const productId = ref<number>()
const submitting = ref(false)
const specOptions = ['锅', '包', '例', '袋', '1升桶', '玻璃瓶'] as const
let nextSpecKey = 1
const defaultCreateForm: ProductEditorForm = {
  name: '',
  imageText: '',
  imageUrl: '',
  coverImageId: 0,
  kind: 'takeout' as ProductKind,
  tag: '无',
  packingFee: '0.00',
  specs: [createEditorSpec(0, { specName: '默认规格' })],
}
const defaultEditForm: ProductEditorForm = {
  name: '青椒炒肉',
  imageText: '',
  imageUrl: '',
  coverImageId: 0,
  kind: 'takeout' as ProductKind,
  tag: '无',
  packingFee: '0.00',
  specs: [createEditorSpec(0, { specName: '默认规格', price: '28', unit: '份' })],
}

const editorMode = ref<EditorMode>('edit')
const pageTitle = computed(() => editorMode.value === 'create' ? '新增商品' : '编辑菜品')
const showSpecPicker = ref(false)
const selectingUnitSpecKey = ref<number>()

const form = reactive<ProductEditorForm>({ ...defaultEditForm, specs: [...defaultEditForm.specs] })

function parseProductPayload(rawValue?: string): ProductEditorPayload | null {
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(decodeURIComponent(rawValue)) as ProductEditorPayload
  }
  catch (error) {
    console.log('商品编辑页解析商品数据失败:', error)
    return null
  }
}

function applyFormValues(values: ProductEditorForm) {
  form.name = values.name
  form.imageText = values.imageText
  form.imageUrl = values.imageUrl
  form.coverImageId = values.coverImageId
  form.kind = values.kind
  form.tag = values.tag
  form.packingFee = values.packingFee
  form.specs = values.specs.map(spec => ({ ...spec, detailItems: [...spec.detailItems] }))
  nextSpecKey = Math.max(0, ...form.specs.map(spec => spec.key)) + 1
}

function applyProduct(product: MerchantFoodProduct) {
  applyFormValues({
    name: product.productName,
    imageText: product.coverImageUrl ? '已选择图片' : '',
    imageUrl: product.coverImageUrl || '',
    coverImageId: product.coverImageId,
    kind: product.productType === 'DEAL' ? 'deal' : 'takeout',
    tag: product.tagText || '无',
    packingFee: product.productType === 'TAKEOUT' ? String(product.packingFee ?? '0.00') : '0.00',
    specs: mapProductSpecs(product.specs, product.productDesc || ''),
  })
}

function applyMode(mode?: string, productPayload?: ProductEditorPayload | null) {
  editorMode.value = mode === 'create' ? 'create' : 'edit'

  if (editorMode.value === 'create') {
    applyFormValues({ ...defaultCreateForm, specs: [createEditorSpec(0, { specName: '默认规格' })] })
    return
  }

  const nextFormValues: ProductEditorForm = {
    ...defaultEditForm,
    name: productPayload?.name || defaultEditForm.name,
    imageUrl: productPayload?.imageUrl || defaultEditForm.imageUrl,
    kind: productPayload?.kind || defaultEditForm.kind,
    tag: productPayload?.tag || defaultEditForm.tag,
    specs: [createEditorSpec(0, {
      specName: '默认规格',
      price: productPayload?.price || defaultEditForm.specs[0].price,
      unit: productPayload?.unit || defaultEditForm.specs[0].unit,
      detailItems: [productPayload?.description || ''],
    })],
  }

  nextFormValues.imageText = nextFormValues.imageUrl ? '已选择图片' : ''
  applyFormValues(nextFormValues)
}

function handleClose() {
  const pages = getCurrentPages()

  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.navigateTo({
    url: fallbackUrl,
  })
}

function handleSelectImage() {
  uni.navigateTo({
    url: '/pages/dashboard/menu-album/index?mode=select&status=approved',
    events: {
      selectImage: (image: SelectedAlbumImage) => {
        form.imageUrl = image.src
        form.coverImageId = image.id
        form.imageText = '已选择图片'
      },
    },
  })
}

function handleSelectKind(kind: ProductKind) {
  form.kind = kind
  if (kind === 'deal') {
    form.packingFee = '0.00'
  }
}

function handleAddSpec() {
  form.specs.push(createEditorSpec(nextSpecKey++, { display: false }))
}

function handleRemoveSpec(specKey: number) {
  if (form.specs.length === 1)
    return
  const index = form.specs.findIndex(spec => spec.key === specKey)
  if (index < 0)
    return
  const [removed] = form.specs.splice(index, 1)
  if (removed.display)
    form.specs[0].display = true
}

function handleSelectDisplaySpec(specKey: number) {
  form.specs.forEach((spec) => {
    spec.display = spec.key === specKey
  })
}

function handleOpenUnitPicker(specKey: number) {
  selectingUnitSpecKey.value = specKey
  showSpecPicker.value = true
}

function handleAddDetail(spec: ProductEditorSpecForm) {
  spec.detailItems.push('')
}

function handleRemoveDetail(spec: ProductEditorSpecForm, detailIndex: number) {
  if (spec.detailItems.length === 1) {
    spec.detailItems[0] = ''
    return
  }
  spec.detailItems.splice(detailIndex, 1)
}

function handleCloseSpecPicker() {
  showSpecPicker.value = false
  selectingUnitSpecKey.value = undefined
}

function handleSelectSpec(option: string) {
  const spec = form.specs.find(item => item.key === selectingUnitSpecKey.value)
  if (spec)
    spec.unit = option
  showSpecPicker.value = false
  selectingUnitSpecKey.value = undefined
}

function handlePriceInput(spec: ProductEditorSpecForm, event: { detail?: { value?: string } }) {
  const rawValue = event.detail?.value || ''
  const sanitizedValue = rawValue.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')

  spec.price = sanitizedValue
}

function handlePackingFeeInput(event: { detail?: { value?: string } }) {
  const rawValue = event.detail?.value || ''
  const sanitizedValue = rawValue.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  const [integerPart, decimalPart] = sanitizedValue.split('.')
  const limitedValue = decimalPart === undefined
    ? sanitizedValue
    : `${integerPart || '0'}.${decimalPart.slice(0, 2)}`
  const amount = Number(limitedValue)
  form.packingFee = Number.isFinite(amount) && amount > 2 ? '2.00' : limitedValue
}

async function handleSubmit() {
  if (!form.name.trim() || !form.coverImageId) {
    uni.showToast({ title: '请完整填写商品名称和图片', icon: 'none' })
    return
  }
  const specError = validateEditorSpecs(form.specs)
  if (specError) {
    uni.showToast({ title: specError, icon: 'none' })
    return
  }
  if (submitting.value)
    return
  submitting.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    const payload = {
      productName: form.name.trim(),
      productType: form.kind === 'deal' ? 'DEAL' as const : 'TAKEOUT' as const,
      coverImageId: form.coverImageId,
      tagText: form.tag === '无' ? '' : form.tag,
      productDesc: form.specs.find(spec => spec.display)?.detailItems[0]?.trim() || '',
      packingFee: Number(form.packingFee || 0),
      specs: buildSpecPayloads(form.specs),
    }
    if (editorMode.value === 'create') {
      await createMerchantFoodProduct(storeId, payload)
    }
    else if (productId.value) {
      await updateMerchantFoodProduct(storeId, productId.value, payload)
    }
    uni.showToast({ title: editorMode.value === 'create' ? '商品创建成功' : '商品保存成功', icon: 'success' })
    setTimeout(handleClose, 320)
  }
  finally {
    submitting.value = false
  }
}

onLoad(async (options) => {
  applyMode(options?.mode, parseProductPayload(options?.product))
  const parsedId = Number(options?.id)
  if (editorMode.value === 'edit' && parsedId) {
    productId.value = parsedId
    try {
      const storeId = await merchantFoodStore.ensureCurrentStoreId()
      applyProduct(await getMerchantFoodProductDetail(storeId, parsedId))
    }
    catch {}
  }
})
</script>

<template>
  <view class="product-editor-page">
    <view class="product-editor-page__content">
      <view class="product-editor-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="navigateTo"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="product-editor-nav__title">
          {{ pageTitle }}
        </text>

        <view class="product-editor-nav__spacer" @tap="handleClose" />
      </view>

      <view class="product-editor-section">
        <text class="product-editor-section__title">
          基本信息
        </text>

        <view class="product-editor-card">
          <view class="product-editor-row">
            <view class="product-editor-row__label">
              <text>菜品名称</text>
              <text class="product-editor-row__required">*</text>
            </view>

            <input
              v-model="form.name"
              class="product-editor-row__input product-editor-row__input--align-right"
              placeholder="请输入菜品名称"
              placeholder-class="product-editor-row__placeholder product-editor-row__placeholder--align-right"
            >
          </view>

          <view class="product-editor-row product-editor-row--clickable" @tap="handleSelectImage">
            <view class="product-editor-row__label">
              <text>图片</text>
              <text class="product-editor-row__required">*</text>
            </view>

            <view class="product-editor-row__value-wrap">
              <image
                v-if="form.imageUrl"
                class="product-editor-row__thumb"
                :src="form.imageUrl"
                mode="aspectFill"
              />
              <text
                class="product-editor-row__value"
                :class="{ 'product-editor-row__value--placeholder': !form.imageText && !form.imageUrl }"
              >
                {{ form.imageText || '' }}
              </text>
              <text class="product-editor-row__arrow">›</text>
            </view>
          </view>

          <view class="product-editor-row product-editor-row--clickable" @tap="handleSelectKind('takeout')">
            <text class="product-editor-row__label-text">
              外卖
            </text>

            <view class="product-editor-radio" :class="{ 'product-editor-radio--active': form.kind === 'takeout' }">
              <view v-if="form.kind === 'takeout'" class="product-editor-radio__dot" />
            </view>
          </view>

          <view class="product-editor-row product-editor-row--clickable" @tap="handleSelectKind('deal')">
            <text class="product-editor-row__label-text">
              团购
            </text>

            <view class="product-editor-radio" :class="{ 'product-editor-radio--active': form.kind === 'deal' }">
              <view v-if="form.kind === 'deal'" class="product-editor-radio__dot" />
            </view>
          </view>

          <view class="product-editor-row">
            <text class="product-editor-row__label-text">
              标签
            </text>

            <text class="product-editor-row__value">
              {{ form.tag }}
            </text>
          </view>

          <view
            class="product-editor-row product-editor-row--packing-fee"
            :class="{ 'product-editor-row--packing-fee-hidden': form.kind === 'deal' }"
          >
            <text class="product-editor-row__label-text">
              打包费
            </text>
            <view class="product-editor-row__value-wrap">
              <text class="product-editor-row__currency">¥</text>
              <input
                v-model="form.packingFee"
                class="product-editor-row__input product-editor-row__input--align-right product-editor-row__input--fee"
                type="number"
                placeholder="0.00"
                placeholder-class="product-editor-row__placeholder product-editor-row__placeholder--align-right"
                @input="handlePackingFeeInput"
              >
            </view>
          </view>
        </view>
      </view>

      <view class="product-editor-section product-editor-section--sales">
        <text class="product-editor-section__title">
          售卖信息
        </text>

        <view class="product-editor-card">
          <view
            v-for="(spec, specIndex) in form.specs"
            :key="spec.key"
            class="product-editor-spec"
          >
            <view class="product-editor-spec__header">
              <view class="product-editor-row__label">
                <text>售卖规格 {{ specIndex + 1 }}</text>
                <text class="product-editor-row__required">*</text>
              </view>

              <view class="product-editor-spec__actions">
                <view class="product-editor-display" @tap="handleSelectDisplaySpec(spec.key)">
                  <view class="product-editor-radio" :class="{ 'product-editor-radio--active': spec.display }">
                    <view v-if="spec.display" class="product-editor-radio__dot" />
                  </view>
                  <text>展示规格</text>
                </view>

                <view
                  class="product-editor-spec__remove"
                  :class="{ 'product-editor-spec__remove--disabled': form.specs.length === 1 }"
                  title="删除规格"
                  @tap="handleRemoveSpec(spec.key)"
                >
                  ×
                </view>
              </view>
            </view>

            <view class="product-editor-spec__inputs">
              <input
                v-model="spec.specName"
                class="product-editor-spec__field product-editor-spec__input product-editor-spec__field--name"
                :maxlength="100"
                placeholder="规格名称，如三人套餐"
                placeholder-class="product-editor-spec__placeholder"
              >

              <view class="product-editor-spec__field">
                <text class="product-editor-spec__currency">¥</text>
                <input
                  v-model="spec.price"
                  class="product-editor-spec__input"
                  type="number"
                  placeholder="0"
                  placeholder-class="product-editor-spec__placeholder"
                  @input="handlePriceInput(spec, $event)"
                >
              </view>

              <view
                class="product-editor-spec__field product-editor-spec__field--unit"
                @tap="handleOpenUnitPicker(spec.key)"
              >
                <text :class="spec.unit ? 'product-editor-spec__unit-value' : 'product-editor-spec__placeholder'">
                  {{ spec.unit || '选择单位' }}
                </text>
                <text class="product-editor-spec__unit-arrow">›</text>
              </view>
            </view>

            <view class="product-editor-detail">
              <view class="product-editor-detail__header">
                <text class="product-editor-detail__title">菜品描述</text>
                <text class="product-editor-detail__type">
                  {{ form.kind === 'deal' ? '团购组合单品' : '外卖组合单品' }}
                </text>
              </view>

              <view
                v-for="(_, detailIndex) in spec.detailItems"
                :key="`${spec.key}-${detailIndex}`"
                class="product-editor-detail__row"
              >
                <input
                  v-model="spec.detailItems[detailIndex]"
                  class="product-editor-detail__input"
                  :maxlength="50"
                  placeholder="请输入菜品明细，最多50字"
                  placeholder-class="product-editor-detail__placeholder"
                >
                <view
                  class="product-editor-detail__remove"
                  title="删除明细"
                  @tap="handleRemoveDetail(spec, detailIndex)"
                >
                  ×
                </view>
              </view>

              <view
                class="product-editor-detail__add"
                hover-class="product-editor-detail__add--hover"
                @tap="handleAddDetail(spec)"
              >
                + 添加明细
              </view>
            </view>
          </view>

          <view
            class="product-editor-spec-list__add"
            hover-class="product-editor-spec-list__add--hover"
            @tap="handleAddSpec"
          >
            + 添加售卖规格
          </view>
        </view>
      </view>
    </view>

    <view class="product-editor-footer">
      <view class="product-editor-footer__button" hover-class="product-editor-footer__button--hover" @tap="handleSubmit">
        确定
      </view>
    </view>

    <view v-if="showSpecPicker" class="product-editor-picker">
      <view class="product-editor-picker__mask" @tap="handleCloseSpecPicker" />

      <view class="product-editor-picker__panel">
        <view class="product-editor-picker__header">
          <text class="product-editor-picker__title">
            选择规格
          </text>

          <text class="product-editor-picker__close" @tap="handleCloseSpecPicker">
            ×
          </text>
        </view>

        <view class="product-editor-picker__list">
          <view
            v-for="option in specOptions"
            :key="option"
            class="product-editor-picker__item"
            hover-class="product-editor-picker__item--hover"
            @tap="handleSelectSpec(option)"
          >
            {{ option }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.product-editor-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.product-editor-page__content {
  padding: calc(env(safe-area-inset-top) + 18rpx) 28rpx calc(env(safe-area-inset-bottom) + 156rpx);
  box-sizing: border-box;
}

.product-editor-nav {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  min-height: 72rpx;
}

.product-editor-nav__title {
  color: #202226;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.product-editor-nav__spacer {
  width: 72rpx;
  height: 72rpx;
}

.product-editor-section {
  margin-top: 24rpx;
}

.product-editor-section--sales {
  margin-top: 68rpx;
}

.product-editor-section__title {
  display: block;
  margin-bottom: 22rpx;
  color: #292d33;
  font-size: 35rpx;
  font-weight: 700;
}

.product-editor-card {
  overflow: hidden;
  border-radius: 22rpx;
  background: #ffffff;
}

.product-editor-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 96rpx;
  padding: 0 22rpx;
}

.product-editor-row--packing-fee {
  min-height: 96rpx;
}

.product-editor-row--packing-fee-hidden {
  visibility: hidden;
  pointer-events: none;
}

.product-editor-row + .product-editor-row {
  border-top: 2rpx solid #f2f2f2;
}

.product-editor-row--compact {
  min-height: auto;
  padding-top: 24rpx;
}

.product-editor-row--clickable:active {
  opacity: 0.92;
}

.product-editor-row__label {
  display: flex;
  align-items: center;
  gap: 6rpx;
  min-width: 0;
  color: #282c33;
  font-size: 35rpx;
  font-weight: 600;
}

.product-editor-row__label-text {
  color: #282c33;
  font-size: 35rpx;
  font-weight: 600;
}

.product-editor-row__required {
  color: #ff4d4f;
  font-size: 32rpx;
  line-height: 1;
}

.product-editor-row__input {
  flex: 1;
  min-width: 0;
  color: #444950;
  font-size: 34rpx;
  text-align: left;
}

.product-editor-row__input--align-right {
  text-align: right;
}

.product-editor-row__input--fee {
  width: 100rpx;
  flex: 0 0 100rpx;
}

.product-editor-row__placeholder {
  color: #c6c9cf;
  font-size: 34rpx;
}

.product-editor-row__placeholder--align-right {
  text-align: right;
}

.product-editor-row__value-wrap {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.product-editor-row__currency {
  color: #444950;
  font-size: 34rpx;
}

.product-editor-row__thumb {
  width: 56rpx;
  height: 56rpx;
  border-radius: 10rpx;
  background: #f2f2f2;
  flex-shrink: 0;
}

.product-editor-row__value {
  color: #4d5259;
  font-size: 34rpx;
}

.product-editor-row__value--placeholder {
  color: #c6c9cf;
}

.product-editor-row__arrow {
  color: #a8adb4;
  font-size: 44rpx;
  line-height: 1;
}

.product-editor-radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #cfcfcf;
  border-radius: 50%;
  box-sizing: border-box;
}

.product-editor-radio--active {
  border-color: #c8c8c8;
}

.product-editor-radio__dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #9f9f9f;
}

.product-editor-spec {
  padding: 24rpx 22rpx 28rpx;
}

.product-editor-spec + .product-editor-spec {
  border-top: 12rpx solid #f5f5f5;
}

.product-editor-spec__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.product-editor-spec__actions,
.product-editor-display {
  display: flex;
  align-items: center;
}

.product-editor-spec__actions {
  gap: 20rpx;
}

.product-editor-display {
  gap: 10rpx;
  color: #666b72;
  font-size: 27rpx;
}

.product-editor-display .product-editor-radio {
  width: 32rpx;
  height: 32rpx;
}

.product-editor-display .product-editor-radio__dot {
  width: 14rpx;
  height: 14rpx;
}

.product-editor-spec__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  color: #747981;
  font-size: 42rpx;
  line-height: 1;
}

.product-editor-spec__remove--disabled {
  color: #d5d7da;
}

.product-editor-spec__inputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  padding-top: 20rpx;
}

.product-editor-spec__field {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 86rpx;
  padding: 0 18rpx;
  border-radius: 14rpx;
  background: #f3f3f3;
  box-sizing: border-box;
}

.product-editor-spec__field--unit {
  justify-content: space-between;
  padding: 0 18rpx;
}

.product-editor-spec__field--name {
  grid-column: 1 / -1;
}

.product-editor-spec__currency {
  color: #22252b;
  font-size: 35rpx;
  line-height: 1;
}

.product-editor-spec__input {
  width: 100%;
  color: #3d4249;
  font-size: 34rpx;
}

.product-editor-spec__placeholder {
  color: #aeb3ba;
  font-size: 34rpx;
}

.product-editor-spec__unit-value {
  color: #3d4249;
  font-size: 34rpx;
}

.product-editor-spec__unit-arrow {
  color: #a8adb4;
  font-size: 40rpx;
  line-height: 1;
}

.product-editor-detail {
  margin-top: 26rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid #eeeeee;
}

.product-editor-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.product-editor-detail__title {
  color: #292d33;
  font-size: 31rpx;
  font-weight: 700;
}

.product-editor-detail__type {
  color: #777b82;
  font-size: 27rpx;
}

.product-editor-detail__row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-height: 82rpx;
  margin-top: 16rpx;
  padding: 0 10rpx 0 20rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
  box-sizing: border-box;
}

.product-editor-detail__input {
  flex: 1;
  min-width: 0;
  color: #474b52;
  font-size: 31rpx;
}

.product-editor-detail__placeholder {
  color: #b9bdc3;
  font-size: 29rpx;
}

.product-editor-detail__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  flex-shrink: 0;
  color: #858a91;
  font-size: 40rpx;
  line-height: 1;
}

.product-editor-detail__add,
.product-editor-spec-list__add {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 78rpx;
  margin-top: 18rpx;
  border: 2rpx solid #e4e4e4;
  border-radius: 12rpx;
  color: #35383f;
  font-size: 34rpx;
  font-weight: 500;
  background: #ffffff;
}

.product-editor-detail__add--hover,
.product-editor-spec-list__add--hover {
  opacity: 0.88;
}

.product-editor-spec-list__add {
  margin: 0 22rpx 24rpx;
  border-color: #d9d9d9;
  background: #fafafa;
}

.product-editor-footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 16rpx 28rpx calc(env(safe-area-inset-bottom) + 16rpx);
  background: linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, rgba(245, 245, 245, 0.92) 26%, #f5f5f5 100%);
}

.product-editor-footer__button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  border-radius: 12rpx;
  color: #2c2510;
  font-size: 36rpx;
  font-weight: 700;
  background: linear-gradient(180deg, #ffd71a 0%, #ffca00 100%);
}

.product-editor-footer__button--hover {
  opacity: 0.9;
}

.product-editor-picker {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.product-editor-picker__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
}

.product-editor-picker__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  border-radius: 24rpx 24rpx 0 0;
  background: #ffffff;
}

.product-editor-picker__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.product-editor-picker__title {
  color: #32363d;
  font-size: 32rpx;
  font-weight: 600;
}

.product-editor-picker__close {
  position: absolute;
  top: 50%;
  right: 26rpx;
  color: #4b5058;
  font-size: 40rpx;
  line-height: 1;
  transform: translateY(-50%);
}

.product-editor-picker__list {
  max-height: 60vh;
  overflow-y: auto;
  background: #ffffff;
}

.product-editor-picker__item {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  padding: 0 28rpx;
  color: #4b5058;
  font-size: 30rpx;
  border-bottom: 2rpx solid #f4f4f4;
  box-sizing: border-box;
}

.product-editor-picker__item--hover {
  background: #f8f8f8;
}
</style>
