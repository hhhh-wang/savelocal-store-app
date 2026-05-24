export type BusinessStatus = 'normal' | 'pause'

export type BusinessHoursMode = 'custom' | 'all-day' | 'closed'

export interface BusinessHoursRange {
  id: number
  start: number
  end: number
}

export interface BusinessHoursValue {
  mode: BusinessHoursMode
  ranges: BusinessHoursRange[]
}

export interface StoreBusinessStatusPayload {
  status: BusinessStatus
  hours: BusinessHoursValue
}
