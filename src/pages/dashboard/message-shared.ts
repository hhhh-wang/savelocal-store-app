import type { MerchantMessageCategory } from '@/api/types/merchant-message'

export type AssistantTabKey = 'orders' | 'reviews' | 'todos' | 'messages'

const categoryMap: Record<AssistantTabKey, MerchantMessageCategory> = {
  orders: 'ORDER',
  reviews: 'REVIEW',
  todos: 'TODO',
  messages: 'IMPORTANT_MESSAGE',
}

const actionRouteMap: Record<string, string> = {
  MERCHANT_PROFILE: '/pages/me/me',
  STORE_PROFILE: '/pages/me/store-info/index',
  QUALIFICATION: '/pages/me/store-qualifications/index',
  ORDER_DETAIL: '/pages/dashboard/order-management/index',
  REFUND_DETAIL: '/pages/dashboard/after-sales/index',
}

export function categoryForTab(tab: AssistantTabKey) {
  return categoryMap[tab]
}

export function resolveMessageAction(actionCode?: string) {
  return actionCode ? actionRouteMap[actionCode] : undefined
}
