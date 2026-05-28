<script lang="ts" setup>
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
type ProductKind = 'single' | 'set'
type SelectedAlbumImage = {
  id: number
  src: string
  status: '通过' | '未通过'
}

const fallbackUrl = '/pages/dashboard/product-library/index'

const editorMode = ref<EditorMode>('edit')
const pageTitle = computed(() => editorMode.value === 'create' ? '新增商品' : '编辑菜品')

const form = reactive({
  name: '青椒炒肉',
  imageText: '',
  imageUrl: '',
  kind: 'single' as ProductKind,
  tag: '无',
  price: '28',
  unit: '份',
  description: '',
})

function applyMode(mode?: string) {
  editorMode.value = mode === 'create' ? 'create' : 'edit'

  if (editorMode.value === 'create') {
    form.name = ''
    form.imageText = ''
    form.imageUrl = ''
    form.kind = 'single'
    form.tag = '无'
    form.price = ''
    form.unit = ''
    form.description = ''
    return
  }

  form.name = '青椒炒肉'
  form.imageText = ''
  form.imageUrl = ''
  form.kind = 'single'
  form.tag = '无'
  form.price = '28'
  form.unit = '份'
  form.description = ''
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
        form.imageText = '已选择图片'
      },
    },
  })
}

function handleSelectKind(kind: ProductKind) {
  form.kind = kind
}

function handleAddSpec() {
  uni.showToast({
    title: '添加规格待接入',
    icon: 'none',
  })
}

function handleSubmit() {
  uni.showToast({
    title: editorMode.value === 'create' ? '商品创建待接入' : '商品保存待接入',
    icon: 'none',
  })
}

onLoad((options) => {
  applyMode(options?.mode)
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
            />
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

          <view class="product-editor-row product-editor-row--clickable" @tap="handleSelectKind('single')">
            <text class="product-editor-row__label-text">
              单品
            </text>

            <view class="product-editor-radio" :class="{ 'product-editor-radio--active': form.kind === 'single' }">
              <view v-if="form.kind === 'single'" class="product-editor-radio__dot" />
            </view>
          </view>

          <view class="product-editor-row product-editor-row--clickable" @tap="handleSelectKind('set')">
            <text class="product-editor-row__label-text">
              套餐
            </text>

            <view class="product-editor-radio" :class="{ 'product-editor-radio--active': form.kind === 'set' }">
              <view v-if="form.kind === 'set'" class="product-editor-radio__dot" />
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
        </view>
      </view>

      <view class="product-editor-section product-editor-section--sales">
        <text class="product-editor-section__title">
          售卖信息
        </text>

        <view class="product-editor-card">
          <view class="product-editor-spec">
            <view class="product-editor-row product-editor-row--compact">
              <view class="product-editor-row__label">
                <text>售卖规格</text>
                <text class="product-editor-row__required">*</text>
              </view>
            </view>

            <view class="product-editor-spec__inputs">
              <view class="product-editor-spec__field">
                <text class="product-editor-spec__currency">¥</text>
                <input
                  v-model="form.price"
                  class="product-editor-spec__input"
                  placeholder="0"
                  placeholder-class="product-editor-spec__placeholder"
                />
              </view>

              <input
                v-model="form.unit"
                class="product-editor-spec__field product-editor-spec__input product-editor-spec__field--unit"
                placeholder="份"
                placeholder-class="product-editor-spec__placeholder"
              />
            </view>

            <text class="product-editor-spec__hint">
              在推荐菜/菜单仅支持展示一个规格信息，请勾选展示规格
            </text>

            <view class="product-editor-spec__add" hover-class="product-editor-spec__add--hover" @tap="handleAddSpec">
              + 添加规格
            </view>
          </view>
        </view>
      </view>

      <view class="product-editor-section product-editor-section--description">
        <text class="product-editor-section__title">
          菜品描述
        </text>

        <view class="product-editor-card product-editor-card--description">
          <textarea
            v-model="form.description"
            class="product-editor-textarea"
            :maxlength="100"
            placeholder="请输入100字以内的描述信息，如菜品故事、特色、卖点等"
            placeholder-class="product-editor-textarea__placeholder"
          />
        </view>
      </view>
    </view>

    <view class="product-editor-footer">
      <view class="product-editor-footer__button" hover-class="product-editor-footer__button--hover" @tap="handleSubmit">
        确定
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

.product-editor-section--description {
  margin-top: 28rpx;
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

.product-editor-card--description {
  padding: 24rpx 22rpx;
}

.product-editor-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 96rpx;
  padding: 0 22rpx;
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
  padding-bottom: 24rpx;
}

.product-editor-spec__inputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  padding: 18rpx 22rpx 0;
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
  padding: 0 18rpx;
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

.product-editor-spec__hint {
  display: block;
  margin-top: 18rpx;
  padding: 0 22rpx;
  color: #80858d;
  font-size: 26rpx;
  line-height: 1.5;
}

.product-editor-spec__add {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 78rpx;
  margin: 18rpx 22rpx 0;
  border: 2rpx solid #e4e4e4;
  border-radius: 12rpx;
  color: #35383f;
  font-size: 34rpx;
  font-weight: 500;
  background: #ffffff;
}

.product-editor-spec__add--hover {
  opacity: 0.88;
}

.product-editor-textarea {
  width: 100%;
  height: 132rpx;
  color: #474b52;
  font-size: 32rpx;
  line-height: 1.5;
}

.product-editor-textarea__placeholder {
  color: #c8ccd2;
  font-size: 32rpx;
  line-height: 1.5;
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
</style>
