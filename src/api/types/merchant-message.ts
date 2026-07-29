export type MerchantMessageCategory = 'ORDER' | 'REVIEW' | 'TODO' | 'IMPORTANT_MESSAGE'

export interface MerchantMessage {
  messageId: string
  category: MerchantMessageCategory
  businessType: string
  merchantId: number
  storeId?: number
  title: string
  summary?: string
  content?: string
  priority?: string
  status: string
  unread: boolean
  actionCode?: string
  actionParams?: Record<string, unknown>
  publishedAt?: string
  expiresAt?: string
}

export interface MerchantMessageCategorySummary {
  count: number
  items: MerchantMessage[]
}

export interface MerchantMessageSummary {
  orders: MerchantMessageCategorySummary
  reviews: MerchantMessageCategorySummary
  todos: MerchantMessageCategorySummary
  messages: MerchantMessageCategorySummary
  generatedAt?: string
  degraded: boolean
}

export interface MerchantMessagePage {
  rows: MerchantMessage[]
  total: number
  pageNum: number
  pageSize: number
  degraded: boolean
}
