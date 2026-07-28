import type { MerchantFoodBusinessTime } from '@/api/types/merchant-food'
import type { BusinessHoursRange, BusinessHoursValue, BusinessStatus, StoreBusinessStatusPayload } from '@/components/business-hours-picker/types'

export const storeBusinessStatusStorageKey = 'store-business-status'

const defaultRange: BusinessHoursRange = {
  id: 1,
  start: 9 * 60,
  end: 21 * 60,
}

function cloneRange(range: BusinessHoursRange): BusinessHoursRange {
  return {
    id: range.id,
    start: range.start,
    end: range.end,
  }
}

export function createDefaultBusinessHours(): BusinessHoursValue {
  return {
    mode: 'custom',
    ranges: [cloneRange(defaultRange)],
  }
}

export function createDefaultStoreBusinessStatus(): StoreBusinessStatusPayload {
  return {
    status: 'normal',
    hours: createDefaultBusinessHours(),
  }
}

export function cloneBusinessHours(hours: BusinessHoursValue): BusinessHoursValue {
  return {
    mode: hours.mode,
    ranges: hours.ranges.map(cloneRange),
  }
}

export function cloneStoreBusinessStatus(payload: StoreBusinessStatusPayload): StoreBusinessStatusPayload {
  return {
    status: payload.status,
    hours: cloneBusinessHours(payload.hours),
  }
}

export function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatBusinessHoursRange(range: BusinessHoursRange) {
  return `${formatTime(range.start)}-${formatTime(range.end)}`
}

export function getBusinessStatusLabel(status: BusinessStatus) {
  return status === 'pause' ? '暂停营业' : '正常营业'
}

export function formatBusinessHoursSummary(hours: BusinessHoursValue) {
  if (hours.mode === 'all-day') {
    return '24小时营业'
  }

  if (hours.mode === 'closed') {
    return '全天不营业'
  }

  if (!hours.ranges.length) {
    return '未设置'
  }

  return [...hours.ranges]
    .sort((prev, next) => prev.start - next.start || prev.id - next.id)
    .map(formatBusinessHoursRange)
    .join('、')
}

export function normalizeStoreBusinessStatus(payload: Partial<StoreBusinessStatusPayload> | undefined | null): StoreBusinessStatusPayload {
  const defaultPayload = createDefaultStoreBusinessStatus()
  const mode = payload?.hours?.mode
  const safeMode = mode === 'all-day' || mode === 'closed' || mode === 'custom'
    ? mode
    : defaultPayload.hours.mode
  const normalizedRanges = Array.isArray(payload?.hours?.ranges) && payload?.hours?.ranges.length
    ? payload.hours.ranges
        .map((range, index) => ({
          id: range?.id ?? index + 1,
          start: range?.start ?? defaultRange.start,
          end: Math.min(
            (range?.end ?? defaultRange.end) <= (range?.start ?? defaultRange.start)
              ? (range?.start ?? defaultRange.start) + 30
              : range?.end ?? defaultRange.end,
            24 * 60,
          ),
        }))
        .sort((prev, next) => prev.start - next.start || prev.id - next.id)
    : defaultPayload.hours.ranges.map(cloneRange)

  return {
    status: payload?.status === 'pause' ? 'pause' : defaultPayload.status,
    hours: {
      mode: safeMode,
      ranges: normalizedRanges,
    },
  }
}

export function loadStoreBusinessStatus() {
  try {
    const storedValue = uni.getStorageSync(storeBusinessStatusStorageKey) as Partial<StoreBusinessStatusPayload> | undefined
    return normalizeStoreBusinessStatus(storedValue)
  }
  catch (error) {
    console.log('读取门店营业状态失败，使用默认值:', error)
    return createDefaultStoreBusinessStatus()
  }
}

export function saveStoreBusinessStatus(payload: StoreBusinessStatusPayload) {
  uni.setStorageSync(storeBusinessStatusStorageKey, cloneStoreBusinessStatus(payload))
}

function parseTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return (hour || 0) * 60 + (minute || 0)
}

export function fromMerchantFoodBusinessTimes(storeStatus: string | undefined, businessTimes: MerchantFoodBusinessTime[]): StoreBusinessStatusPayload {
  const uniqueRanges = new Map<string, BusinessHoursRange>()
  businessTimes.forEach((item) => {
    const key = `${item.startTime}-${item.endTime}`
    if (!uniqueRanges.has(key)) {
      uniqueRanges.set(key, {
        id: uniqueRanges.size + 1,
        start: parseTime(item.startTime),
        end: parseTime(item.endTime) || 24 * 60,
      })
    }
  })
  const ranges = Array.from(uniqueRanges.values())
  const allDay = ranges.length === 1 && ranges[0].start === 0 && ranges[0].end >= 23 * 60 + 59
  return {
    status: storeStatus === '1' ? 'pause' : 'normal',
    hours: {
      mode: allDay ? 'all-day' : 'custom',
      ranges: ranges.length ? ranges : createDefaultBusinessHours().ranges,
    },
  }
}

export function toMerchantFoodBusinessTimes(hours: BusinessHoursValue): MerchantFoodBusinessTime[] {
  const ranges = hours.mode === 'all-day'
    ? [{ id: 1, start: 0, end: 23 * 60 + 59 }]
    : hours.mode === 'closed'
      ? [{ id: 1, start: 0, end: 23 * 60 + 59 }]
      : hours.ranges
  return Array.from({ length: 7 }, (_, day) => ranges.map(range => ({
    dayOfWeek: day + 1,
    startTime: formatTime(range.start),
    endTime: formatTime(Math.min(range.end, 23 * 60 + 59)),
    crossDay: '0',
    status: '0',
  }))).flat()
}
