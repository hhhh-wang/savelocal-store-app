<script lang="ts" setup>
import type { QualificationSection } from './shared'
import type { MerchantFoodQualification, MerchantFoodQualificationType, MerchantQualificationPayload } from '@/api/types/merchant-food'
import {
  createMerchantQualification,
  deleteMerchantQualification,
  getMerchantQualifications,
  updateMerchantQualification,
} from '@/api/merchant-food'
import useUpload from '@/hooks/useUpload'
import addImageIcon from '@/static/icons/add-image.png'
import deleteIcon from '@/static/icons/delete.png'
import { buildQualificationSections, mergeQualificationCatalogs } from './shared'

defineOptions({
  name: 'StoreQualifications',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '企业资质',
  },
})

const fallbackUrl = '/pages/me/store-info/index'
const qualificationSections = ref<QualificationSection[]>([])
const qualificationTemplates = ref<MerchantFoodQualificationType[]>([])
const qualifications = ref<MerchantFoodQualification[]>([])
const selectedQualificationCode = ref('')

function imageUrls(item: MerchantFoodQualification | undefined) {
  return (item?.qualificationImages || '').split(',').filter(Boolean)
}

function toPayload(item: MerchantFoodQualification): MerchantQualificationPayload {
  return {
    qualificationCode: item.qualificationCode,
    qualificationScope: item.qualificationScope === '2' ? '2' : '1',
    qualificationNo: item.qualificationNo,
    qualificationImages: imageUrls(item).join(','),
    validFrom: item.validFrom,
    validTo: item.validTo,
  }
}

async function saveQualification(item: MerchantFoodQualification) {
  if (item.qualificationId) {
    await updateMerchantQualification(item.qualificationId, toPayload(item))
  }
  else {
    await createMerchantQualification(toPayload(item))
  }
  await loadQualifications()
}

async function loadQualifications() {
  const result = mergeQualificationCatalogs(
    await getMerchantQualifications('1'),
    await getMerchantQualifications('2'),
  )
  qualificationTemplates.value = result.templates as MerchantFoodQualificationType[]
  qualifications.value = result.records as MerchantFoodQualification[]
  qualificationSections.value = buildQualificationSections(result.templates, result.records)
}

function uploadedUrl(result: any) {
  return typeof result === 'string' ? result : result?.url || result?.fileUrl || result?.path || ''
}

const { run: selectAndUpload } = useUpload<'image'>({
  fileType: 'image',
  formData: {
    bizType: 'MERCHANT_QUALIFICATION',
  },
  success: async (result) => {
    const imageUrl = uploadedUrl(result)
    const item = qualifications.value.find(value => value.qualificationCode === selectedQualificationCode.value)
    if (!imageUrl || !item)
      return
    item.qualificationImages = [...imageUrls(item), imageUrl].join(',')
    await saveQualification(item)
    uni.showToast({ title: '资质图片已提交', icon: 'success' })
  },
})

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

function handleUpload(title: string) {
  const section = qualificationSections.value.find(item => item.title === title)
  if (!section)
    return
  selectedQualificationCode.value = section.id
  let item = qualifications.value.find(value => value.qualificationCode === section.id)
  if (!item) {
    item = {
      qualificationId: 0,
      qualificationCode: section.id,
      qualificationName: section.title,
      qualificationScope: qualificationTemplates.value.find(type => type.qualificationCode === section.id)?.qualificationScope,
      qualificationImages: '',
    }
    qualifications.value.push(item)
  }
  selectAndUpload()
}

async function handleDelete(title: string) {
  const section = qualificationSections.value.find(item => item.title === title)
  const item = qualifications.value.find(value => value.qualificationCode === section?.id)
  if (!item)
    return
  await deleteMerchantQualification(item.qualificationId)
  await loadQualifications()
  uni.showToast({ title: '资质图片已删除', icon: 'success' })
}

onMounted(() => {
  loadQualifications().catch(() => {})
})
</script>

<template>
  <view class="store-qualifications-page">
    <view class="store-qualifications-page__glow store-qualifications-page__glow--left" />
    <view class="store-qualifications-page__glow store-qualifications-page__glow--right" />

    <view class="store-qualifications-page__content">
      <view class="store-qualifications-nav">
        <view class="store-qualifications-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="navigateTo"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="store-qualifications-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="store-qualifications-nav__title">
          企业资质
        </text>

        <view class="store-qualifications-nav__spacer" />
      </view>

      <view class="store-qualifications-list">
        <view
          v-for="section in qualificationSections"
          :key="section.id"
          class="qualification-block"
        >
          <view class="qualification-block__header">
            <view class="qualification-block__title-wrap">
              <text class="qualification-block__title">
                {{ section.title }}
              </text>
              <text v-if="section.required" class="qualification-block__required">
                *
              </text>
              <text v-if="section.statusText" class="qualification-block__status">
                {{ section.statusText }}
              </text>
            </view>

            <text v-if="section.showSectionWarn !== false" class="qualification-block__warn">
              !
            </text>
          </view>

          <view class="qualification-card">
            <view
              v-for="upload in section.uploads"
              :key="upload.key"
              class="qualification-card__upload"
            >
              <view v-if="section.uploads.length > 1" class="qualification-card__upload-head">
                <view class="qualification-card__upload-title-wrap">
                  <text class="qualification-card__upload-title">
                    {{ upload.title }}
                  </text>
                  <text v-if="upload.required" class="qualification-card__field-required">
                    *
                  </text>
                </view>

                <text class="qualification-block__warn">
                  !
                </text>
              </view>

              <view class="qualification-card__image-wrap">
                <view class="qualification-card__image-frame">
                  <view v-if="!upload.imageUrls.length" class="qualification-card__image-photo">
                    <image class="qualification-card__image-photo-icon" :src="addImageIcon" mode="aspectFit" />
                    <text class="qualification-card__image-photo-text">
                      {{ upload.title }}
                    </text>
                  </view>

                  <swiper v-else class="qualification-card__image-swiper" :indicator-dots="upload.imageUrls.length > 1">
                    <swiper-item v-for="imageUrl in upload.imageUrls" :key="imageUrl">
                      <image class="qualification-card__image" :src="imageUrl" mode="aspectFit" />
                    </swiper-item>
                  </swiper>

                  <view class="qualification-card__delete" @tap="handleDelete(upload.title)">
                    <image class="qualification-card__delete-icon" :src="deleteIcon" mode="aspectFit" />
                  </view>

                  <view class="qualification-card__upload-mask" @tap="handleUpload(upload.title)">
                    重新上传
                  </view>
                </view>
              </view>
            </view>

            <view v-if="section.fields.length" class="qualification-card__fields">
              <view
                v-for="field in section.fields"
                :key="`${section.id}-${field.label}`"
                class="qualification-card__field"
              >
                <text class="qualification-card__field-label">
                  {{ field.label }}
                  <text v-if="field.required" class="qualification-card__field-required">
                    *
                  </text>
                </text>

                <view v-if="field.toggle" class="qualification-card__switch" :class="{ 'qualification-card__switch--active': field.toggleActive }">
                  <view class="qualification-card__switch-thumb" />
                </view>

                <text
                  v-else
                  class="qualification-card__field-value"
                  :class="{ 'qualification-card__field-value--muted': field.muted }"
                >
                  {{ field.value }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-qualifications-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f6f7fb 18%, #f2f3f7 100%);
}

.store-qualifications-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-qualifications-page__glow--left {
  top: -120rpx;
  left: -130rpx;
  width: 420rpx;
  height: 300rpx;
  background: radial-gradient(circle, rgba(255, 228, 122, 0.34) 0%, rgba(255, 228, 122, 0) 72%);
}

.store-qualifications-page__glow--right {
  top: -50rpx;
  right: -120rpx;
  width: 340rpx;
  height: 240rpx;
  background: radial-gradient(circle, rgba(230, 229, 240, 0.88) 0%, rgba(230, 229, 240, 0) 70%);
}

.store-qualifications-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 18rpx calc(env(safe-area-inset-bottom) + 42rpx);
}

.store-qualifications-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.store-qualifications-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.store-qualifications-nav__close {
  color: #2f3339;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.store-qualifications-nav__title {
  color: #21252b;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-qualifications-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.store-qualifications-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 24rpx;
}

.qualification-block__header,
.qualification-block__title-wrap,
.qualification-card__field {
  display: flex;
  align-items: center;
}

.qualification-block__header {
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 12rpx;
}

.qualification-block__title-wrap {
  flex-wrap: wrap;
  gap: 8rpx;
}

.qualification-block__title {
  color: #2a2e35;
  font-size: 34rpx;
  font-weight: 700;
}

.qualification-block__required {
  color: #ff4d4f;
  font-size: 32rpx;
  font-weight: 700;
}

.qualification-block__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96rpx;
  height: 42rpx;
  padding: 0 18rpx;
  border: 2rpx solid #30c36c;
  border-radius: 9999rpx;
  color: #30c36c;
  font-size: 24rpx;
  font-weight: 600;
  box-sizing: border-box;
}

.qualification-block__warn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  border: 2rpx solid #ff453a;
  border-radius: 50%;
  color: #ff453a;
  font-size: 20rpx;
  font-weight: 700;
  box-sizing: border-box;
}

.qualification-card {
  overflow: hidden;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.qualification-card__upload + .qualification-card__upload {
  padding-top: 8rpx;
}

.qualification-card__upload-head,
.qualification-card__upload-title-wrap {
  display: flex;
  align-items: center;
}

.qualification-card__upload-head {
  justify-content: space-between;
  gap: 18rpx;
  padding: 22rpx 24rpx 0;
}

.qualification-card__upload-title-wrap {
  gap: 6rpx;
}

.qualification-card__upload-title {
  color: #2f3339;
  font-size: 30rpx;
  font-weight: 600;
}

.qualification-card__image-wrap {
  padding: 24rpx 24rpx 0;
}

.qualification-card__image-frame {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 340rpx;
  border-radius: 20rpx;
  background: #fff;
}

.qualification-card__image-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 430rpx;
  height: 250rpx;
  border: 2rpx solid #d8c9a8;
  background: linear-gradient(180deg, #f8f0de 0%, #e6d7b8 100%);
  box-shadow: inset 0 0 0 8rpx rgba(255, 255, 255, 0.18);
}

.qualification-card__image-swiper {
  width: 100%;
  height: 340rpx;
}

.qualification-card__image {
  width: 100%;
  height: 100%;
  background: #f6f7f9;
}

.qualification-card__image-photo-icon {
  width: 72rpx;
  height: 72rpx;
}

.qualification-card__image-photo-text {
  margin-top: 18rpx;
  color: #b58428;
  font-size: 34rpx;
  font-weight: 700;
}

.qualification-card__delete {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46rpx;
  height: 46rpx;
  border-radius: 10rpx;
  background: rgba(53, 53, 53, 0.48);
}

.qualification-card__delete-icon {
  width: 100%;
  height: 100%;
}

.qualification-card__upload-mask {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 58rpx;
  background: rgba(35, 38, 44, 0.5);
  color: #fff;
  font-size: 30rpx;
}

.qualification-card__fields {
  padding: 10rpx 0 2rpx;
}

.qualification-card__field {
  justify-content: space-between;
  gap: 20rpx;
  min-height: 96rpx;
  padding: 0 24rpx;
}

.qualification-card__field + .qualification-card__field {
  border-top: 2rpx solid #f2f3f6;
}

.qualification-card__field-label {
  flex-shrink: 0;
  color: #363b42;
  font-size: 30rpx;
}

.qualification-card__field-required {
  color: #ff4d4f;
}

.qualification-card__field-value {
  flex: 1;
  min-width: 0;
  color: #31353c;
  font-size: 30rpx;
  text-align: right;
}

.qualification-card__field-value--muted {
  color: #a3a8b1;
}

.qualification-card__switch {
  position: relative;
  width: 92rpx;
  height: 52rpx;
  border-radius: 9999rpx;
  background: #e1e4ea;
}

.qualification-card__switch--active {
  background: #ff3024;
}

.qualification-card__switch-thumb {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 4rpx 10rpx rgba(20, 22, 28, 0.12);
}

.qualification-card__switch--active .qualification-card__switch-thumb {
  left: 44rpx;
}
</style>
