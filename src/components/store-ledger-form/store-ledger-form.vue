<script setup lang="ts">
import type { LedgerView } from '@/api/merchant-ledger'
import { getLedger, ledgerAccountType, ledgerBindingLabel, ledgerContactGuide, refreshLedger } from '@/api/merchant-ledger'

const props = defineProps<{ storeId: string }>()
const view = ref<LedgerView>()
const busy = ref(false)
const error = ref('')
let sequence = 0

function message(reason: unknown): string {
  return reason instanceof Error ? reason.message : '账户信息查询失败，请稍后刷新'
}

async function load() {
  const request = ++sequence
  const storeId = props.storeId
  busy.value = true
  error.value = ''
  try {
    const snapshot = await getLedger(storeId)
    if (request !== sequence)
      return
    view.value = snapshot
    if (snapshot.account.accountId || snapshot.ledgerAttachment?.attachmentId) {
      const latest = await refreshLedger(storeId)
      if (request === sequence)
        view.value = latest
    }
  }
  catch (reason) {
    if (request === sequence)
      error.value = message(reason)
  }
  finally {
    if (request === sequence)
      busy.value = false
  }
}

async function refresh() {
  if (busy.value)
    return
  busy.value = true
  error.value = ''
  const request = sequence
  try {
    const latest = await refreshLedger(props.storeId)
    if (request === sequence)
      view.value = latest
  }
  catch (reason) {
    if (request === sequence)
      error.value = message(reason)
  }
  finally {
    if (request === sequence)
      busy.value = false
  }
}

watch(() => props.storeId, () => {
  view.value = undefined
  void load()
}, { immediate: true })
onUnmounted(() => {
  sequence += 1
})
</script>

<template>
  <view class="ledger-info">
    <view class="ledger-status">
      <text class="ledger-status__title">{{ view?.stateLabel || '正在加载账户信息' }}</text>
      <text v-if="view?.sync.message" class="ledger-note">{{ view.sync.message }}</text>
      <text v-if="error" class="ledger-error">{{ error }}；当前已展示的信息保留为上次快照。</text>
      <text class="ledger-note">最近完整同步：{{ view?.sync.lastSyncTime || '尚未同步' }}</text>
    </view>

    <view v-if="view?.ledgerAttachment?.mchId" class="ledger-group">
      <text class="ledger-group__title">分账附件</text>
      <view class="ledger-row">
        <text>商户号</text><text>{{ view.ledgerAttachment.mchId }}</text>
      </view>
      <view class="ledger-row">
        <text>终端号</text><text>{{ view.ledgerAttachment.termNo || '未登记' }}</text>
      </view>
      <view class="ledger-row">
        <text>出账审核</text><text>{{ view.stateLabel }}</text>
      </view>
      <view class="ledger-row">
        <text>平台分账关系</text><text>{{ ledgerBindingLabel(view.ledgerAttachment.bindingState) }}</text>
      </view>
    </view>
    <template v-if="view?.account.accountId && !view.ledgerAttachment?.attachmentId">
      <view class="ledger-group">
        <text class="ledger-group__title">银行卡及开户行</text>
        <view class="ledger-row">
          <text>结算户名</text><text>{{ view.settlement.bankCardName || '渠道未返回' }}</text>
        </view>
        <view class="ledger-row">
          <text>银行卡号</text><text>{{ view.settlement.bankCardNoMasked || '渠道未返回' }}</text>
        </view>
        <view class="ledger-row">
          <text>开户银行</text><text>{{ view.settlement.bankName || '渠道未返回' }}</text>
        </view>
        <view class="ledger-row">
          <text>开户支行</text><text>{{ view.settlement.bankBranchName || '渠道未返回' }}</text>
        </view>
        <text v-if="view.settlement.source === 'MANUAL'" class="ledger-note">银行信息为人工登记，待渠道完整核对。</text>
      </view>
      <view class="ledger-group">
        <text class="ledger-group__title">收款账户信息</text>
        <view class="ledger-row">
          <text>嘉联商户号</text><text>{{ view.account.receiverMchId }}</text>
        </view>
        <view class="ledger-row">
          <text>账户类型</text><text>{{ ledgerAccountType(view.account.merchType) }}</text>
        </view>
        <view class="ledger-row">
          <text>主体名称</text><text>{{ view.account.subjectName || '渠道未返回' }}</text>
        </view>
        <view v-if="view.account.licenseNumberMasked" class="ledger-row">
          <text>营业执照号码</text><text>{{ view.account.licenseNumberMasked }}</text>
        </view>
        <view class="ledger-row">
          <text>法人姓名</text><text>{{ view.account.legalName || '渠道未返回' }}</text>
        </view>
        <view v-if="view.account.legalNumberMasked" class="ledger-row">
          <text>法人证件号</text><text>{{ view.account.legalNumberMasked }}</text>
        </view>
        <view class="ledger-row">
          <text>分账关系</text><text>{{ ledgerBindingLabel(view.binding.bindingState) }}</text>
        </view>
        <text v-if="view.control.storeCount > 1" class="ledger-note">此金融账户共关联 {{ view.control.storeCount }} 家门店，结算信息统一同步。</text>
      </view>
    </template>

    <view class="ledger-actions">
      <button class="ledger-refresh" :disabled="busy" :loading="busy" @click="refresh">
        刷新账户信息
      </button>
      <button class="ledger-contact" @click="ledgerContactGuide">
        联系业务人员变更结算卡
      </button>
      <text class="ledger-note">出账方开通由业务人员办理。审核通过并完成绑定后，刷新即可查看结果。</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.ledger-info {
  padding: 24rpx;
}
.ledger-status,
.ledger-group {
  margin-bottom: 24rpx;
  padding: 28rpx;
  border-radius: 20rpx;
  background: #fff;
}
.ledger-status__title,
.ledger-group__title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.6;
}
.ledger-group__title {
  margin-bottom: 12rpx;
}
.ledger-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
  font-size: 26rpx;
  line-height: 1.6;
}
.ledger-row text:first-child {
  flex-shrink: 0;
  color: #858a93;
}
.ledger-row text:last-child {
  text-align: right;
  word-break: break-all;
}
.ledger-note {
  display: block;
  margin-top: 16rpx;
  color: #858a93;
  font-size: 24rpx;
  line-height: 1.7;
}
.ledger-error {
  display: block;
  margin-top: 16rpx;
  color: #b64a3d;
  font-size: 24rpx;
  line-height: 1.7;
}
.ledger-actions {
  padding-bottom: calc(env(safe-area-inset-bottom) + 24rpx);
}
.ledger-refresh,
.ledger-contact {
  margin: 20rpx 0;
  border-radius: 16rpx;
  font-size: 28rpx;
}
.ledger-refresh {
  background: #ffcf4c;
  color: #25282d;
}
.ledger-contact {
  background: #fff;
  color: #555d69;
}
.ledger-refresh::after,
.ledger-contact::after {
  border: none;
}
</style>
