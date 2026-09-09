import type { MerchantPromotionAccount, MerchantPromotionOverview, MerchantPromotionRewardItem } from '@/api/merchant-promotion'
import { computed, onScopeDispose, ref } from 'vue'
import {
  getMerchantPromotionAccount,
  getMerchantPromotionRewardPage,
  getMerchantPromotionTodayOverview,
} from '@/api/merchant-promotion'

export function formatPromotionAmount(value?: number | string | null) {
  if (value === undefined || value === null || value === '')
    return '--'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '--'
}

/** 商家主体账户不依赖门店选择；失败的数据保持未知，不能当作零余额。 */
export function useMerchantPromotionSummary() {
  const account = ref<MerchantPromotionAccount>()
  const overview = ref<MerchantPromotionOverview>()
  const loading = ref(false)
  const loadFailed = ref(false)
  let pending: Promise<void> | undefined
  let disposed = false

  onScopeDispose(() => {
    disposed = true
  })

  function refresh() {
    if (disposed)
      return Promise.resolve()
    if (pending)
      return pending

    loading.value = true
    loadFailed.value = false
    pending = Promise.allSettled([
      getMerchantPromotionAccount(),
      getMerchantPromotionTodayOverview(),
    ]).then(([accountResult, overviewResult]) => {
      if (disposed)
        return

      account.value = accountResult.status === 'fulfilled' ? accountResult.value : undefined
      overview.value = overviewResult.status === 'fulfilled' ? overviewResult.value : undefined
      loadFailed.value = accountResult.status === 'rejected' || overviewResult.status === 'rejected'
    }).finally(() => {
      pending = undefined
      if (!disposed)
        loading.value = false
    })
    return pending
  }

  async function refreshAfterChange() {
    // 写入完成后先等待旧查询结束，再读取余额，避免复用转入前发出的账户请求。
    if (pending)
      await pending
    return refresh()
  }

  return {
    balance: computed(() => formatPromotionAmount(account.value?.cityCoinBalance)),
    frozenAmount: computed(() => formatPromotionAmount(account.value?.cityCoinFrozen)),
    todayIncome: computed(() => formatPromotionAmount(overview.value?.rewardGrantAmount)),
    loading,
    loadFailed,
    refresh,
    refreshAfterChange,
  }
}

export function useMerchantPromotionRewards() {
  const rewardList = ref<MerchantPromotionRewardItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const loadFailed = ref(false)
  const hasMore = computed(() => rewardList.value.length < total.value)
  let nextPage = 1
  let requestVersion = 0
  let pendingPage = 0
  let pending: Promise<void> | undefined
  let disposed = false

  onScopeDispose(() => {
    disposed = true
    requestVersion++
  })

  function loadRewards(reset = true) {
    if (disposed)
      return Promise.resolve()
    if (pending && (!reset || pendingPage === 1))
      return pending
    if (!reset && !hasMore.value && !loadFailed.value)
      return Promise.resolve()

    const page = reset ? 1 : nextPage
    const version = ++requestVersion
    nextPage = page
    pendingPage = page
    loading.value = true
    loadFailed.value = false

    // 刷新首屏可以取代正在加载的下一页，旧请求不能再追加数据或结束新请求的加载态。
    pending = getMerchantPromotionRewardPage({ pageNum: page, pageSize: 20 })
      .then((result) => {
        if (version !== requestVersion)
          return

        const rows = result.rows || []
        rewardList.value = page === 1 ? rows : [...rewardList.value, ...rows]
        total.value = result.total || 0
        nextPage = page + 1
      })
      .catch(() => {
        if (version === requestVersion)
          loadFailed.value = true
      })
      .finally(() => {
        if (version === requestVersion) {
          loading.value = false
          pending = undefined
        }
      })
    return pending
  }

  return { rewardList, loading, loadFailed, hasMore, loadRewards }
}
