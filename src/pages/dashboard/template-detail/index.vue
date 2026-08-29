<script lang="ts" setup>
import emptyNoDataIcon from '@/static/icons/empty-no-data.png'

defineOptions({
  name: 'TemplateDetail',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '详情模板',
  },
})

interface DetailTemplate {
  id: number
  name: string
  inUse: boolean
  rules: string[]
}

const fallbackUrl = '/pages/dashboard/index'

const templates = ref<DetailTemplate[]>([
  {
    id: 1,
    name: '购买须知1',
    inUse: true,
    rules: [
      '最长可用餐2小时',
      '1.4米以上儿童按成人价收取，1.1米-1.4米之间按半价收取',
      '押金:20元/位(每桌食材浪费超过100克，扣除押金20元)',
      '本单发票由商家提供，详情请咨询商家',
    ],
  },
  {
    id: 2,
    name: '购买须知2',
    inUse: false,
    rules: [
      '本券每人限用一张',
      '图片仅供参考，请以实物为准',
    ],
  },
])

const selectedId = ref<number | null>(null)

function confirmModal(options: { title: string, content: string, confirmColor?: string }) {
  return new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({ ...options, success: resolve })
  })
}

function handleSelect(item: DetailTemplate) {
  selectedId.value = selectedId.value === item.id ? null : item.id
}

function handleEdit(item: DetailTemplate) {
  uni.navigateTo({
    url: `/pages/dashboard/template-detail/edit/index?templateId=${item.id}&name=${encodeURIComponent(item.name)}&rules=${encodeURIComponent(JSON.stringify(item.rules))}`,
    events: {
      templateRenamed: (newName: string) => {
        const target = templates.value.find(template => template.id === item.id)
        if (target)
          target.name = newName
      },
      templateRulesUpdated: (rules: string[]) => {
        const target = templates.value.find(template => template.id === item.id)
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
        const target = templates.value.find(template => template.id === templateId)
        if (target)
          target.name = newName
      },
    },
  })
}

async function handleApply(item: DetailTemplate) {
  if (item.inUse) {
    navigateToApply(item.id, item.name)
    return
  }

  const result = await confirmModal({
    title: '应用模板',
    content: `确认将「${item.name}」设为使用中吗？`,
  })
  if (!result.confirm)
    return

  templates.value = templates.value.map(template => ({
    ...template,
    inUse: template.id === item.id,
  }))
  navigateToApply(item.id, item.name)
}

function handleAdd() {
  const usedNumbers = templates.value
    .map(template => Number.parseInt(template.name.replace(/^购买须知/, ''), 10))
    .filter(number => !Number.isNaN(number))

  let nextNumber = templates.value.length + 1
  while (usedNumbers.includes(nextNumber)) {
    nextNumber++
  }

  templates.value.push({
    id: Date.now(),
    name: `购买须知${nextNumber}`,
    inUse: false,
    rules: [],
  })
  uni.showToast({ title: '已添加', icon: 'success' })
}

async function handleDelete() {
  const selected = templates.value.find(template => template.id === selectedId.value)
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
    content: `确认删除「${selected.name}」吗？`,
    confirmColor: '#d94141',
  })
  if (!result.confirm)
    return

  templates.value = templates.value.filter(template => template.id !== selected.id)
  selectedId.value = null
  uni.showToast({ title: '已删除', icon: 'success' })
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

      <view v-if="templates.length" class="template-list">
        <view
          v-for="item in templates"
          :key="item.id"
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
              :class="{ 'template-card__radio--checked': selectedId === item.id }"
            />
            <text class="template-card__name">
              {{ item.name }}
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
        </view>
      </view>

      <view v-else class="template-empty">
        <image class="template-empty__image" :src="emptyNoDataIcon" mode="aspectFit" />
        <text class="template-empty__text">
          暂无模板
        </text>
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
