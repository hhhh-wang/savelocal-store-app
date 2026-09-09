import type {
  MerchantPromotionTransferContext,
  MerchantPromotionTransferRequest,
  MerchantPromotionTransferResult,
} from '@/api/merchant-promotion'
import { computed, onScopeDispose, ref } from 'vue'
import {
  getMerchantPromotionTransferContext,
  getMerchantPromotionTransferResult,
  transferMerchantPromotionCoins,
} from '@/api/merchant-promotion'

interface PendingTransfer extends MerchantPromotionTransferRequest {
  merchantId: number
  memberNickname: string
  mobileMask: string
}

/** 只接受普通十进制表示，整个转入链路不使用浮点运算。 */
export function normalizePromotionTransferAmount(value?: string | number | null): string | undefined {
  const input = String(value ?? '').trim()
  if (!/^\d{1,16}(?:\.\d{1,2})?$/.test(input))
    return undefined
  const [integer, fraction = ''] = input.split('.')
  return `${integer.replace(/^0+(?=\d)/, '')}.${fraction.padEnd(2, '0')}`
}

export function promotionTransferAmountExceeds(amount: string, balance: string) {
  const left = amount.replace('.', '').replace(/^0+/, '') || '0'
  const right = balance.replace('.', '').replace(/^0+/, '') || '0'
  return left.length !== right.length ? left.length > right.length : left > right
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function storageKey(merchantId: number) {
  return `merchant-promotion-pending-transfer:${merchantId}`
}

function createRequestNo() {
  const randomToken = (length: number) => {
    let value = ''
    while (value.length < length)
      value += Math.random().toString(36).slice(2)
    return value.slice(0, length)
  }
  return `ct_${Date.now().toString(36)}_${randomToken(10)}_${randomToken(8)}`.slice(0, 32)
}

function readPending(merchantId: number): PendingTransfer | undefined {
  const saved = uni.getStorageSync(storageKey(merchantId)) as PendingTransfer | undefined
  if (saved && saved.merchantId === merchantId && Number.isSafeInteger(saved.receiverId)
    && /^[\w-]{16,32}$/.test(saved.requestNo) && typeof saved.amount === 'string'
    && normalizePromotionTransferAmount(saved.amount) === saved.amount && saved.amount !== '0.00') {
    return saved
  }
  return undefined
}

export function useMerchantPromotionTransfer(onTransferred: () => void | Promise<void>) {
  const visible = ref(false)
  const step = ref<'loading' | 'error' | 'transfer' | 'success'>('loading')
  const context = ref<MerchantPromotionTransferContext>()
  const amount = ref('')
  const error = ref('')
  const submitting = ref(false)
  const checking = ref(false)
  const pending = ref<PendingTransfer>()
  const result = ref<MerchantPromotionTransferResult>()
  const busy = computed(() => submitting.value || checking.value)
  const recipientName = computed(() => pending.value?.memberNickname || context.value?.memberNickname || '微信用户')
  const recipientMobile = computed(() => pending.value?.mobileMask || context.value?.mobileMask || '已授权个人微信')
  let requestVersion = 0
  let disposed = false

  onScopeDispose(() => {
    disposed = true
    requestVersion++
  })

  function close() {
    if (busy.value)
      return
    visible.value = false
    requestVersion++
  }

  async function complete(transfer: MerchantPromotionTransferResult) {
    result.value = transfer
    pending.value = undefined
    step.value = 'success'
    error.value = ''
    try {
      uni.removeStorageSync(storageKey(transfer.merchantId))
    }
    catch {
      // 请求号可再次查询，保留本地记录不会导致二次扣款。
    }
    await Promise.resolve().then(onTransferred).catch(() => {})
  }

  async function checkResult() {
    if (!pending.value || busy.value)
      return
    checking.value = true
    error.value = ''
    try {
      const receipt = await getMerchantPromotionTransferResult(pending.value.requestNo)
      if (disposed)
        return
      if (receipt)
        await complete(receipt)
      else
        error.value = '暂未查到转入结果，可重试同一笔转入。'
    }
    catch (cause) {
      if (!disposed)
        error.value = errorText(cause, '暂时无法确认转入结果，请稍后重试。')
    }
    finally {
      checking.value = false
    }
  }

  async function loadContext() {
    const version = ++requestVersion
    step.value = 'loading'
    error.value = ''
    try {
      const loaded = await getMerchantPromotionTransferContext()
      if (disposed || version !== requestVersion)
        return
      context.value = loaded
      pending.value = readPending(loaded.merchantId)
      if (pending.value) {
        amount.value = pending.value.amount
        step.value = 'transfer'
        await checkResult()
        return
      }
      if (!loaded.canTransfer || !loaded.receiverId) {
        error.value = loaded.unavailableReason || '当前个人微信分账账户不可用'
        step.value = 'error'
        return
      }
      step.value = 'transfer'
    }
    catch (cause) {
      if (!disposed && version === requestVersion) {
        step.value = 'error'
        error.value = errorText(cause, '分账账户信息加载失败，请重试。')
      }
    }
  }

  async function open() {
    if (visible.value || disposed)
      return
    visible.value = true
    amount.value = ''
    result.value = undefined
    await loadContext()
  }

  function fillAll() {
    if (!busy.value && !pending.value && context.value)
      amount.value = context.value.availableAmount
  }

  async function submit() {
    if (busy.value || !context.value)
      return

    let request = pending.value
    error.value = ''
    if (!request) {
      const normalized = normalizePromotionTransferAmount(amount.value)
      const available = normalizePromotionTransferAmount(context.value.availableAmount)
      if (!normalized || normalized === '0.00') {
        error.value = '转入数量须大于0，且最多保留两位小数'
        return
      }
      if (!available || promotionTransferAmountExceeds(normalized, available)) {
        error.value = '可用同城币不足，请刷新余额后重试'
        return
      }
      if (!context.value.canTransfer || !context.value.receiverId) {
        error.value = context.value.unavailableReason || '个人微信分账账户不可用'
        return
      }
      request = {
        requestNo: createRequestNo(),
        merchantId: context.value.merchantId,
        receiverId: context.value.receiverId,
        memberNickname: recipientName.value,
        mobileMask: recipientMobile.value,
        amount: normalized,
      }
    }

    const submitted = { ...request }
    submitting.value = true
    try {
      if (!pending.value) {
        const confirmed = await new Promise<boolean>((resolve) => {
          uni.showModal({
            title: '确认转入同城币',
            content: `将 ${submitted.amount} 枚同城币转入当前个人微信分账账户关联的用户：${submitted.memberNickname}（${submitted.mobileMask}）。`,
            confirmText: '确认转入',
            confirmColor: '#ed4c4c',
            success: response => resolve(response.confirm),
            fail: () => resolve(false),
          })
        })
        if (!confirmed || disposed)
          return

        // 发送前持久化；超时、关闭页面或重启后都复用同一请求，避免再次扣款。
        uni.setStorageSync(storageKey(submitted.merchantId), submitted)
        pending.value = submitted
        amount.value = submitted.amount
      }

      const receipt = await transferMerchantPromotionCoins({
        requestNo: submitted.requestNo,
        receiverId: submitted.receiverId,
        amount: submitted.amount,
      })
      if (!disposed)
        await complete(receipt)
    }
    catch (cause) {
      if (disposed)
        return
      const code = cause instanceof Error ? (cause as Error & { code?: number }).code : undefined
      if (code && [400, 409].includes(code)) {
        if (code === 409) {
          // 分账账户切换或请求冲突时，先确认原幂等号是否已经成功。
          try {
            const completed = await getMerchantPromotionTransferResult(submitted.requestNo)
            if (disposed)
              return
            if (completed) {
              await complete(completed)
              return
            }
          }
          catch {
            error.value = '暂时无法确认转入结果，请稍后查询。'
            return
          }
        }

        try {
          uni.removeStorageSync(storageKey(submitted.merchantId))
        }
        catch {
          error.value = '转入未完成，请检查设备存储后重试。'
          return
        }
        pending.value = undefined
        const message = errorText(cause, '转入失败，请重试。')
        await loadContext()
        error.value = message
      }
      else {
        error.value = pending.value
          ? '转入结果尚未确认，请查询结果或重试同一笔转入。'
          : errorText(cause, '无法保存转入请求，请检查设备存储后重试。')
      }
    }
    finally {
      submitting.value = false
    }
  }

  return {
    visible,
    step,
    context,
    amount,
    error,
    result,
    pending,
    busy,
    submitting,
    checking,
    recipientName,
    recipientMobile,
    open,
    close,
    loadContext,
    fillAll,
    submit,
    checkResult,
  }
}
