import { http } from '@/http/http'

/**
 * 商家推广账户（同城币）
 * 账户归属商家主体，所有门店共享，接口不需要传 storeId
 */
export interface MerchantPromotionAccount {
  accountId?: number
  merchantId?: number
  cityCoinBalance: number
  cityCoinFrozen: number
  totalCityCoinGrant: number
  totalCityCoinUsed: number
  status?: string
}

export interface MerchantPromotionOverview {
  /** 推广账户同城币余额 */
  rewardBalance: number
  /** 时间窗内已发放（未冲回）的同城币奖励合计 */
  rewardGrantAmount: number
  promotedConsumerCount: number
  promotedMerchantCount: number
}

export interface MerchantPromotionRewardItem {
  rewardId: number
  rewardNo: string
  rewardType: string
  rewardMode: string
  relationType: string
  rewardLevel: number
  rewardBelongType: string
  sourceMemberNickname?: string
  sourceMemberMobileMask?: string
  tradeMerchantName?: string
  /** 成交门店：仅作来源统计，不代表账户归属 */
  tradeStoreId?: number
  tradeStoreName?: string
  promoterSubjectName?: string
  relationOrderNo?: string
  orderEffectivePayAmount?: number
  assetType: string
  rewardAmount: number
  status: string
  grantTime?: string
  cancelTime?: string
  cancelReason?: string
  createTime?: string
}

export interface MerchantPromotionAssetFlowItem {
  flowId: number
  flowNo: string
  assetType: string
  /** 1收入 2支出 3冻结 4解冻 */
  direction: string
  bizType: string
  bizNo?: string
  changeAmount: number
  beforeBalance?: number
  afterBalance?: number
  operatorName?: string
  relationOrderNo?: string
  relationRewardNo?: string
  createTime?: string
}

export interface MerchantPromotionPageResult<T> {
  rows: T[]
  total: number
}

export function getMerchantPromotionAccount() {
  return http.get<MerchantPromotionAccount>('/merchant/promotion/account')
}

export function getMerchantPromotionOverview(beginTime?: string, endTime?: string) {
  const query: Record<string, string> = {}
  if (beginTime)
    query['params[beginTime]'] = beginTime
  if (endTime)
    query['params[endTime]'] = endTime
  return http.get<MerchantPromotionOverview>('/merchant/promotion/overview', query)
}

export function getMerchantPromotionRewardPage(params: {
  'tradeStoreId'?: number
  'status'?: string
  'pageNum'?: number
  'pageSize'?: number
  'params[beginTime]'?: string
  'params[endTime]'?: string
} = {}) {
  return http.get<MerchantPromotionPageResult<MerchantPromotionRewardItem>>('/merchant/promotion/rewards/page', params)
}

export function getMerchantPromotionAssetFlowPage(params: {
  bizType?: string
  pageNum?: number
  pageSize?: number
} = {}) {
  return http.get<MerchantPromotionPageResult<MerchantPromotionAssetFlowItem>>('/merchant/promotion/asset-flows/page', params)
}
