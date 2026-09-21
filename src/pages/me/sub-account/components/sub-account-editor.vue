<script lang="ts" setup>
import type { SubAccount, SubAccountForm } from '../sub-account'
import { subAccountRoles } from '../sub-account'

const props = defineProps<{
  visible: boolean
  account?: SubAccount
  merchantName: string
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'save': [form: SubAccountForm]
}>()

const username = ref('')
const mobile = ref('')
const roleIds = ref<string[]>([])
const storeNames = ref('')
const errorMessage = ref('')

watch(() => props.visible, (visible) => {
  if (!visible)
    return
  username.value = props.account?.username || ''
  mobile.value = props.account?.mobile || ''
  roleIds.value = [...(props.account?.roleIds || [])]
  storeNames.value = props.account?.storeNames.join('、') || ''
  errorMessage.value = ''
})

function closeEditor() {
  uni.hideKeyboard()
  emit('update:visible', false)
}

function toggleRole(roleId: string) {
  roleIds.value = roleIds.value.includes(roleId)
    ? roleIds.value.filter(id => id !== roleId)
    : [...roleIds.value, roleId]
}

function save() {
  const trimmedUsername = username.value.trim()
  const trimmedMobile = mobile.value.trim()
  if (!trimmedUsername) {
    errorMessage.value = '请输入账号名'
    return
  }
  if (!/^1[3-9]\d{9}$/.test(trimmedMobile)) {
    errorMessage.value = '请输入正确的11位手机号'
    return
  }
  if (!roleIds.value.length) {
    errorMessage.value = '请至少选择一个账号角色'
    return
  }

  errorMessage.value = ''
  uni.hideKeyboard()
  emit('save', {
    username: trimmedUsername,
    mobile: trimmedMobile,
    merchantName: props.account?.merchantName || props.merchantName,
    roleIds: [...roleIds.value],
    storeNames: Array.from(new Set(storeNames.value.split(/[、,，\n]/).map(name => name.trim()).filter(Boolean))),
  })
}
</script>

<template>
  <view v-if="visible" class="account-editor">
    <view class="account-editor__mask" @tap="closeEditor" @touchmove.stop.prevent />
    <view class="account-editor__panel" role="dialog" :aria-label="account ? '编辑子账号' : '新建子账号'" @touchmove.stop>
      <view class="account-editor__header">
        <text class="account-editor__title">{{ account ? '编辑子账号' : '新建子账号' }}</text>
        <button class="account-editor__close" aria-label="关闭" @tap="closeEditor">
          <view class="i-carbon-close" />
        </button>
      </view>

      <scroll-view class="account-editor__scroll" scroll-y>
        <view class="account-editor__fields">
          <view class="account-editor__field">
            <text class="account-editor__label">账号名</text>
            <input v-model="username" class="account-editor__input" placeholder="请输入账号名" :maxlength="32">
          </view>
          <view class="account-editor__field">
            <text class="account-editor__label">手机号</text>
            <input v-model="mobile" class="account-editor__input" type="number" placeholder="请输入11位手机号" :maxlength="11">
          </view>
          <view class="account-editor__field">
            <text class="account-editor__label">商家名称</text>
            <text class="account-editor__merchant">{{ account?.merchantName || merchantName }}</text>
          </view>
          <view class="account-editor__role-field">
            <text class="account-editor__label">账号角色<text class="account-editor__hint">（可多选）</text></text>
            <view class="account-editor__roles">
              <button
                v-for="role in subAccountRoles"
                :key="role.id"
                class="account-editor__role"
                :class="{ 'account-editor__role--selected': roleIds.includes(role.id) }"
                :aria-pressed="roleIds.includes(role.id)"
                @tap="toggleRole(role.id)"
              >
                <text>{{ role.name }}</text>
                <view class="account-editor__checkbox">
                  <view v-if="roleIds.includes(role.id)" class="i-carbon-checkmark" />
                </view>
              </button>
            </view>
          </view>
          <view class="account-editor__store-field">
            <text class="account-editor__label">管理门店<text class="account-editor__hint">（选填）</text></text>
            <input v-model="storeNames" class="account-editor__store-input" placeholder="多个门店名称用顿号分隔" :maxlength="200">
            <text class="account-editor__hint">未填写管理门店的账号显示在总部范围内</text>
          </view>
        </view>
      </scroll-view>

      <text v-if="errorMessage" class="account-editor__error" role="alert">{{ errorMessage }}</text>
      <view class="account-editor__footer">
        <button class="account-editor__cancel" @tap="closeEditor">
          取消
        </button>
        <button class="account-editor__save" hover-class="account-editor__save--hover" @tap="save">
          {{ account ? '保存' : '创建' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.account-editor {
  position: fixed;
  z-index: 100;
  inset: 0;
}

.account-editor__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.account-editor__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  border-radius: 28rpx 28rpx 0 0;
  background: #fff;
}

.account-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f1f1f1;
}

.account-editor__title {
  font-size: 32rpx;
  font-weight: 600;
}

.account-editor__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  margin: 0;
  padding: 0;
  background: transparent;
  color: #888;
  font-size: 36rpx;
}

.account-editor__scroll {
  height: 680rpx;
  max-height: 60vh;
}

.account-editor__fields {
  padding: 0 32rpx 24rpx;
}

.account-editor__field {
  display: flex;
  align-items: center;
  gap: 24rpx;
  min-height: 96rpx;
  border-bottom: 1rpx solid #f1f1f1;
}

.account-editor__label {
  flex-shrink: 0;
  color: #333;
  font-size: 28rpx;
  line-height: 40rpx;
}

.account-editor__field .account-editor__label {
  width: 120rpx;
}

.account-editor__input {
  min-width: 0;
  height: 80rpx;
  flex: 1;
  font-size: 28rpx;
}

.account-editor__merchant {
  color: #777;
  font-size: 28rpx;
  overflow-wrap: anywhere;
}

.account-editor__role-field,
.account-editor__store-field {
  padding-top: 24rpx;
}

.account-editor__hint {
  color: #999;
  font-size: 23rpx;
  line-height: 36rpx;
}

.account-editor__roles {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 16rpx;
}

.account-editor__role {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  width: 100%;
  margin: 0;
  padding: 16rpx 20rpx;
  border: 1rpx solid #ededed;
  border-radius: 12rpx;
  background: #fafafa;
  color: #555;
  font-size: 25rpx;
  line-height: 36rpx;
  text-align: left;
}

.account-editor__role--selected {
  border-color: #ffd600;
  background: #fffbea;
  color: #262626;
}

.account-editor__checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
  border: 1rpx solid #d7d7d7;
  border-radius: 6rpx;
}

.account-editor__role--selected .account-editor__checkbox {
  border-color: #ffd600;
  background: #ffd600;
}

.account-editor__store-input {
  height: 76rpx;
  margin: 16rpx 0 10rpx;
  padding: 0 20rpx;
  border: 1rpx solid #ededed;
  border-radius: 12rpx;
  background: #fafafa;
  font-size: 26rpx;
}

.account-editor__error {
  display: block;
  padding: 16rpx 32rpx;
  color: #e24b40;
  font-size: 24rpx;
}

.account-editor__footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx calc(env(safe-area-inset-bottom) + 24rpx);
  border-top: 1rpx solid #f1f1f1;
}

.account-editor__cancel,
.account-editor__save {
  height: 80rpx;
  flex: 1;
  margin: 0;
  padding: 0;
  border-radius: 12rpx;
  font-size: 30rpx;
  line-height: 80rpx;
}

.account-editor__cancel {
  background: #f5f5f5;
  color: #666;
}

.account-editor__save {
  background: #ffd600;
  color: #262626;
}

.account-editor__save--hover {
  opacity: 0.75;
}

.account-editor__close::after,
.account-editor__role::after,
.account-editor__cancel::after,
.account-editor__save::after {
  border: 0;
}
</style>
