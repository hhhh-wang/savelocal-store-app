<script lang="ts" setup>
defineOptions({
  name: 'TemplateEditPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '编辑模板',
  },
})

interface RuleParagraph {
  id: number
  text: string
}

interface OpenerEventChannel {
  emit: (eventName: string, ...args: any[]) => void
}

const fallbackUrl = '/pages/dashboard/template-detail/index'

const templateName = ref('购买须知1')
const paragraphs = ref<RuleParagraph[]>([])
const focusIndex = ref(-1)
let paragraphSeed = 0

let openerEventChannel: OpenerEventChannel | null = null

const caseContent = '案例：\n1、最长可用餐2小时；\n2、1.4米以上儿童按成人价收取，1.1米-1.4米之间按半价收取；\n3、押金:20元/位（每桌食材浪费超过100克，扣除押金20元）；\n4、本单发票由商家提供，详情请咨询商家。'

function confirmModal(options: { title: string, content: string, confirmColor?: string }) {
  return new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({ ...options, success: resolve })
  })
}

function handleEditName() {
  uni.showModal({
    title: '编辑模板名称',
    editable: true,
    placeholderText: '请输入模板名称',
    content: templateName.value,
    success: (result) => {
      if (!result.confirm)
        return
      const name = result.content?.trim()
      if (!name || name === templateName.value)
        return
      templateName.value = name
      openerEventChannel?.emit('templateRenamed', name)
      uni.showToast({ title: '已保存', icon: 'success' })
    },
  })
}

function addParagraph() {
  paragraphs.value.push({ id: ++paragraphSeed, text: '' })
  focusIndex.value = paragraphs.value.length - 1
}

function removeParagraph(index: number) {
  paragraphs.value.splice(index, 1)
}

function collectRules() {
  return paragraphs.value
    .map(paragraph => paragraph.text.trim())
    .filter(text => text.length > 0)
}

function saveChanges() {
  openerEventChannel?.emit('templateRulesUpdated', collectRules())
}

function saveAndBack(toastTitle: string) {
  saveChanges()
  uni.showToast({ title: toastTitle, icon: 'success' })
  setTimeout(() => uni.navigateBack(), 600)
}

function handleConfirm() {
  saveAndBack('已保存')
}

async function handleSubmit() {
  if (!collectRules().length) {
    uni.showToast({ title: '请至少添加一个段落', icon: 'none' })
    return
  }

  const result = await confirmModal({
    title: '提交模板',
    content: '确认提交当前模板内容吗？',
  })
  if (!result.confirm)
    return

  saveAndBack('已提交')
}

function handlePreview() {
  const rules = collectRules()
  const content = rules.length
    ? rules.map((rule, index) => `${index + 1}、${rule}`).join('\n')
    : '暂无内容'
  uni.showModal({
    title: `预览：${templateName.value}`,
    content,
    showCancel: false,
    confirmText: '知道了',
  })
}

function handleViewCase() {
  uni.showModal({
    title: '使用规则案例',
    content: caseContent,
    showCancel: false,
    confirmText: '知道了',
  })
}

onLoad((options) => {
  const name = options?.name ? decodeURIComponent(options.name) : ''
  if (name)
    templateName.value = name

  if (options?.rules) {
    try {
      const parsed = JSON.parse(decodeURIComponent(options.rules))
      paragraphs.value = Array.isArray(parsed)
        ? parsed.map(text => ({ id: ++paragraphSeed, text: String(text) }))
        : []
    }
    catch {
      paragraphs.value = []
    }
  }

  const currentPage = getCurrentPages()[getCurrentPages().length - 1] as {
    getOpenerEventChannel?: () => OpenerEventChannel
  } | undefined

  openerEventChannel = currentPage?.getOpenerEventChannel?.() || null
})
</script>

<template>
  <view class="template-edit-page">
    <view class="template-edit-page__content">
      <view class="template-edit-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="navigateTo"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="template-edit-nav__title">
          编辑模板
        </text>

        <view class="template-edit-nav__spacer" />
      </view>

      <view class="template-card">
        <text class="template-card__name">
          {{ templateName }}
        </text>
        <view class="template-card__edit" hover-class="template-card__edit--hover" @tap="handleEditName">
          编辑名称
        </view>
      </view>

      <view class="rules-card">
        <view class="rules-card__header">
          <view class="rules-card__header-left">
            <view class="i-carbon-document rules-card__header-icon" />
            <text class="rules-card__title">
              使用规则
            </text>
          </view>
          <text class="rules-card__case" hover-class="rules-card__case--hover" @tap="handleViewCase">
            查看案例
          </text>
        </view>

        <view
          v-for="(paragraph, index) in paragraphs"
          :key="paragraph.id"
          class="rules-card__row"
        >
          <view class="rules-card__bullet" />
          <input
            v-model="paragraph.text"
            class="rules-card__input"
            type="text"
            placeholder="请输入规则内容"
            placeholder-class="rules-card__input-placeholder"
            :focus="focusIndex === index"
            @blur="focusIndex = -1"
          >
          <view
            class="rules-card__remove"
            hover-class="rules-card__remove--hover"
            @tap="removeParagraph(index)"
          >
            ✕
          </view>
        </view>

        <view class="rules-card__ghost" hover-class="rules-card__ghost--hover" @tap="addParagraph">
          添加段落 +
        </view>
        <view class="rules-card__ghost" hover-class="rules-card__ghost--hover" @tap="handlePreview">
          预览模板
        </view>
      </view>
    </view>

    <view class="template-edit-actions">
      <view class="template-edit-actions__button" hover-class="template-edit-actions__button--hover" @tap="handleConfirm">
        确认修改
      </view>
      <view class="template-edit-actions__button" hover-class="template-edit-actions__button--hover" @tap="handleSubmit">
        提交模板
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.template-edit-page {
  min-height: 100vh;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #22252b;
}

.template-edit-page__content {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 24rpx calc(env(safe-area-inset-bottom) + 340rpx);
}

.template-edit-nav {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) 72rpx;
  align-items: center;
  min-height: 72rpx;
}

.template-edit-nav__title {
  color: #202226;
  font-size: 44rpx;
  font-weight: 500;
  line-height: 1.25;
  text-align: center;
}

.template-edit-nav__spacer {
  width: 72rpx;
  height: 72rpx;
}

.template-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 28rpx;
  padding: 28rpx 24rpx;
  box-sizing: border-box;
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 8rpx 22rpx rgba(70, 74, 84, 0.03);
}

.template-card__name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #202332;
  font-size: 34rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-card__edit {
  display: flex;
  min-width: 152rpx;
  height: 64rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0 20rpx;
  box-sizing: border-box;
  border-radius: 16rpx;
  background: #ffca05;
  color: #28220c;
  font-size: 28rpx;
  font-weight: 600;
}

.template-card__edit--hover {
  opacity: 0.8;
}

.rules-card {
  margin-top: 24rpx;
  padding: 30rpx 24rpx 34rpx;
  box-sizing: border-box;
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 8rpx 22rpx rgba(70, 74, 84, 0.03);
}

.rules-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rules-card__header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.rules-card__header-icon {
  color: #202226;
  font-size: 40rpx;
}

.rules-card__title {
  color: #1f2126;
  font-size: 38rpx;
  font-weight: 700;
}

.rules-card__case {
  color: #55575c;
  font-size: 28rpx;
}

.rules-card__case--hover {
  opacity: 0.7;
}

.rules-card__row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 30rpx;
}

.rules-card__bullet {
  width: 14rpx;
  height: 14rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: #26282d;
}

.rules-card__input {
  flex: 1;
  min-width: 0;
  height: 96rpx;
  padding: 0 26rpx;
  box-sizing: border-box;
  border-radius: 18rpx;
  background: #f5f5f6;
  color: #26282d;
  font-size: 30rpx;
}

.rules-card__input-placeholder {
  color: #b3b5ba;
}

.rules-card__remove {
  display: flex;
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 2rpx solid #b9bdc6;
  border-radius: 50%;
  color: #97999e;
  font-size: 26rpx;
}

.rules-card__remove--hover {
  opacity: 0.7;
}

.rules-card__ghost {
  display: flex;
  height: 92rpx;
  align-items: center;
  justify-content: center;
  margin-top: 28rpx;
  box-sizing: border-box;
  border: 2rpx solid #dcdee2;
  border-radius: 18rpx;
  background: #fff;
  color: #23252a;
  font-size: 30rpx;
}

.rules-card__ghost--hover {
  opacity: 0.7;
}

.template-edit-actions {
  position: fixed;
  right: 24rpx;
  bottom: 0;
  left: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 28rpx);
}

.template-edit-actions__button {
  display: flex;
  height: 96rpx;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  background: #ffca05;
  color: #28220c;
  font-size: 34rpx;
  font-weight: 600;
}

.template-edit-actions__button--hover {
  opacity: 0.85;
}

@media (max-width: 700rpx) {
  .template-edit-page__content {
    padding-right: 18rpx;
    padding-left: 18rpx;
  }

  .rules-card__row {
    gap: 12rpx;
    margin-top: 22rpx;
  }

  .rules-card__input {
    height: 80rpx;
    padding: 0 18rpx;
    font-size: 26rpx;
  }

  .rules-card__title {
    font-size: 32rpx;
  }

  .rules-card__ghost {
    height: 80rpx;
    font-size: 26rpx;
  }

  .template-edit-actions__button {
    height: 84rpx;
    font-size: 30rpx;
  }
}
</style>
