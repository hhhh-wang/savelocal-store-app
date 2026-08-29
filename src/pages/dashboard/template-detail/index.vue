<script lang="ts" setup>
import type { PurchaseNoticeTemplate } from '@/api/merchant-purchase-notice'
import { applyPurchaseNoticeTemplate, createPurchaseNoticeTemplate, deletePurchaseNoticeTemplate, getPurchaseNoticeTemplates } from '@/api/merchant-purchase-notice'
import emptyNoDataIcon from '@/static/icons/empty-no-data.png'
import { useMerchantFoodStore } from '@/store'

defineOptions({
  name: 'TemplateDetail',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '详情模板',
  },
})

const fallbackUrl = '/pages/dashboard/index'
const merchantFoodStore = useMerchantFoodStore()

const templates = ref<PurchaseNoticeTemplate[]>([])
const templatesLoading = ref(false)
const selectedId = ref<number | null>(null)

function confirmModal(options: { title: string, content: string, confirmColor?: string }) {
  return new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({ ...options, success: resolve })
  })
}

async function loadTemplates() {
  templatesLoading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    templates.value = await getPurchaseNoticeTemplates(storeId)
  }
  catch (error) {
    console.error('加载购买须知模板失败:', error)
    uni.showToast({ title: '模板加载失败，请重试', icon: 'none' })
  }
  finally {
    templatesLoading.value = false
  }
}

onShow(() => {
  loadTemplates()
})

function handleSelect(item: PurchaseNoticeTemplate) {
  selectedId.value = selectedId.value === item.templateId ? null : item.templateId
}

function handleEdit(item: PurchaseNoticeTemplate) {
  uni.navigateTo({
    url: `/pages/dashboard/template-detail/edit/index?templateId=${item.templateId}&name=${encodeURIComponent(item.templateName)}&rules=${encodeURIComponent(JSON.stringify(item.rules))}`,
    events: {
      templateRenamed: (newName: string) => {
        const target = templates.value.find(template => template.templateId === item.templateId)
        if (target)
          target.templateName = newName
      },
      templateRulesUpdated: (rules: string[]) => {
        const target = templates.value.find(template => template.templateId === item.templateId)
        if (target)
          target.rules = rules
      },
    },
  })
}

function navigateToApply(templateId: number, name: string) {
  uni.navigateTo({
    url: `/pages/dashboard/template-detail/apply/index?templateId=${templateId}&name=${encodeURIComponent(name)}`,
    events: {
      templateRenamed: (newName: string) => {
        const target = templates.value.find(template => template.templateId === templateId)
        if (target)
          target.templateName = newName
      },
    },
  })
}

async function handleApply(item: PurchaseNoticeTemplate) {
  const result = await confirmModal({
    title: '应用模板',
    content: `确认将「${item.templateName}」设为使用中吗？`,
  })
  if (!result.confirm)
    return

  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await applyPurchaseNoticeTemplate(storeId, item.templateId)
  }
  catch (error) {
    console.error('应用模板失败:', error)
    uni.showToast({ title: '应用失败，请重试', icon: 'none' })
    return
  }

  templates.value = templates.value.map(template => ({
    ...template,
    inUse: template.templateId === item.templateId,
  }))
  navigateToApply(item.templateId, item.templateName)
}

async function handleAdd() {
  const usedNumbers = templates.value
    .map(template => Number.parseInt(template.templateName.replace(/^购买须知/, ''), 10))
    .filter(number => !Number.isNaN(number))

  let nextNumber = templates.value.length + 1
  while (usedNumbers.includes(nextNumber)) {
    nextNumber++
  }

  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await createPurchaseNoticeTemplate(storeId, { templateName: `购买须知${nextNumber}` })
    await loadTemplates()
    uni.showToast({ title: '已添加', icon: 'success' })
  }
  catch (error) {
    console.error('添加模板失败:', error)
    uni.showToast({ title: '添加失败，请重试', icon: 'none' })
  }
}

async function handleDelete() {
  const selected = templates.value.find(template => template.templateId === selectedId.value)
  if (!selected) {
    uni.showToast({ title: '请先选择要删除的模板', icon: 'none' })
    return
  }
  if (selected.inUse) {
    uni.showToast({ title: '使用中的模板不能删除', icon: 'none' })
    return
  }

  const result = await confirmModal({
    title: '删除模板',
    content: `确认删除「${selected.templateName}」吗？`,
    confirmColor: '#d94141',
  })
  if (!result.confirm)
    return

  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await deletePurchaseNoticeTemplate(storeId, selected.templateId)
    selectedId.value = null
    await loadTemplates()
    uni.showToast({ title: '已删除', icon: 'success' })
  }
  catch (error) {
    console.error('删除模板失败:', error)
    uni.showToast({ title: '删除失败，请重试', icon: 'none' })
  }
}
</script>

<template>
  <view class="template-page">
    <view class="template-page__content">
      <view class="template-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="navigateTo"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="template-nav__title">
          详情模板
        </text>
      </view>

      <view v-if="templatesLoading && !templates.length" class="template-empty">
        <text class="template-empty__text">
          正在加载模板
        </text>
      </view>

      <view v-else-if="!templates.length" class="template-empty">
        <image class="template-empty__image" :src="emptyNoDataIcon" mode="aspectFit" />
        <text class="template-empty__text">
          暂无模板
        </text>
      </view>

      <view v-else class="template-list">
        <view
          v-for="item in templates"
          :key="item.templateId"
          class="template-card"
          hover-class="template-card--hover"
          @tap="handleSelect(item)"
        >
          <view
            class="template-card__badge"
            :class="item.inUse ? 'template-card__badge--in-use' : 'template-card__badge--unused'"
          >
            {{ item.inUse ? '使用中' : '未使用' }}
          </view>

          <view class="template-card__row">
            <view
              class="template-card__radio"
              :class="{ 'template-card__radio--checked': selectedId === item.templateId }"
            />
            <text class="template-card__name">
              {{ item.templateName }}
            </text>
            <view class="template-card__actions">
              <view
                class="template-card__action"
                hover-class="template-card__action--hover"
                @tap.stop="handleEdit(item)"
              >
                编辑模板
              </view>
              <view
                class="template-card__action"
                hover-class="template-card__action--hover"
                @tap.stop="handleApply(item)"
              >
                应用模板
              </view>
            </view>
          </view>

          <text v-if="item.auditStatus === '2'" class="template-card__reject">
            审核未通过：{{ item.rejectReason || '内容不符合规范' }}
          </text>
        </view>
      </view>
    </view>

    <view class="template-actions">
      <view class="template-actions__button" hover-class="template-actions__button--hover" @tap="handleAdd">
        添加模板
      </view>
      <view class="template-actions__button" hover-class="template-actions__button--hover" @tap="handleDelete">
        删除模板
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.template-page {
  min-height: 100vh;
  background: #f4f4f4;
}

.template-page__content {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 18rpx) 20rpx calc(env(safe-area-inset-bottom) + 320rpx);
}

.template-nav {
  display: grid;
  grid-template-columns: 72rpx 1fr 110rpx;
  align-items: center;
  min-height: 72rpx;
}

.template-nav__title {
  color: #202226;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.template-list {
  margin-top: 40rpx;
}

.template-card {
  position: relative;
  margin-top: 40rpx;
  padding: 36rpx 24rpx 30rpx;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 10rpx 28rpx rgba(31, 35, 41, 0.05);
}

.template-card--hover {
  opacity: 0.92;
}

.template-card__badge {
  position: absolute;
  top: -18rpx;
  left: 50%;
  padding: 4rpx 18rpx;
  border-radius: 10rpx;
  color: #fff;
  font-size: 22rpx;
  line-height: 1.4;
  transform: translateX(-50%);
}

.template-card__badge--in-use {
  background: #52c41a;
}

.template-card__badge--unused {
  background: #c9ccd3;
}

.template-card__row {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.template-card__radio {
  position: relative;
  flex-shrink: 0;
  width: 34rpx;
  height: 34rpx;
  box-sizing: border-box;
  border: 2rpx solid #b9bdc6;
  border-radius: 50%;
  background: #fff;
}

.template-card__radio--checked {
  border-color: #4a4e57;
}

.template-card__radio--checked::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #33363d;
  transform: translate(-50%, -50%);
  content: '';
}

.template-card__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #26292f;
  font-size: 32rpx;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-card__actions {
  display: flex;
  flex-shrink: 0;
  gap: 16rpx;
}

.template-card__action {
  flex-shrink: 0;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: #ffd534;
  color: #6e5504;
  font-size: 26rpx;
  font-weight: 600;
}

.template-card__action--hover {
  opacity: 0.85;
}

.template-card__reject {
  display: block;
  margin-top: 14rpx;
  color: #d94141;
  font-size: 22rpx;
  line-height: 1.4;
}

.template-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 220rpx;
}

.template-empty__image {
  width: 176rpx;
  height: 132rpx;
}

.template-empty__text {
  margin-top: 16rpx;
  color: #8a909b;
  font-size: 30rpx;
}

.template-actions {
  position: fixed;
  right: 20rpx;
  bottom: 0;
  left: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 24rpx);
}

.template-actions__button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  border-radius: 16rpx;
  background: #ffd534;
  color: #6e5504;
  font-size: 34rpx;
  font-weight: 600;
}

.template-actions__button--hover {
  opacity: 0.85;
}
</style>
