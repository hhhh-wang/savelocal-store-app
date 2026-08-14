<script setup lang="ts">
import type { BusinessHoursMode, BusinessHoursRange, BusinessHoursValue } from './types'

interface Props {
  modelValue: BusinessHoursValue
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: BusinessHoursValue]
}>()

const slotMinutes = 1
const totalMinutes = 24 * 60
const totalSlots = totalMinutes / slotMinutes
const defaultRangeStart = 9 * 60
const defaultRangeEnd = 21 * 60

const modeOptions: Array<{ label: string, value: BusinessHoursMode }> = [
  { label: '自定义', value: 'custom' },
  { label: '24小时营业', value: 'all-day' },
  { label: '全天不营业', value: 'closed' },
]

const timePoints = Array.from({ length: totalSlots + 1 }, (_, index) => index * slotMinutes)
const startHourValues = Array.from({ length: 24 }, (_, index) => index)
const endHourValues = Array.from({ length: 25 }, (_, index) => index)
const minuteValues = Array.from({ length: 60 }, (_, index) => index)
const activeRangeId = ref<number | null>(null)
const nextRangeId = ref(1)
const innerValue = ref<BusinessHoursValue>(normalizeValue(props.modelValue))

watch(() => props.modelValue, (value) => {
  const normalizedValue = normalizeValue(value)
  if (!isSameValue(innerValue.value, normalizedValue)) {
    innerValue.value = normalizedValue
  }
  syncNextRangeId()
  ensureActiveRange()
}, {
  deep: true,
  immediate: true,
})

watch(innerValue, (value) => {
  const normalizedModelValue = normalizeValue(props.modelValue)
  if (!isSameValue(value, normalizedModelValue)) {
    emit('update:modelValue', cloneValue(value))
  }
}, { deep: true })

const canAddRange = computed(() => {
  if (innerValue.value.mode !== 'custom') {
    return false
  }

  return Boolean(findSuggestedRange())
})

function normalizeMinute(value: number, fallbackValue: number) {
  if (!Number.isFinite(value)) {
    return fallbackValue
  }

  const safeValue = Math.min(Math.max(value, 0), totalMinutes)
  return Math.round(safeValue / slotMinutes) * slotMinutes
}

function cloneRange(range: BusinessHoursRange): BusinessHoursRange {
  return {
    id: range.id,
    start: range.start,
    end: range.end,
  }
}

function cloneValue(value: BusinessHoursValue): BusinessHoursValue {
  return {
    mode: value.mode,
    ranges: value.ranges.map(cloneRange),
  }
}

function isSameValue(left: BusinessHoursValue, right: BusinessHoursValue) {
  return left.mode === right.mode
    && left.ranges.length === right.ranges.length
    && left.ranges.every((range, index) => {
      const other = right.ranges[index]
      return other
        && range.id === other.id
        && range.start === other.start
        && range.end === other.end
    })
}

function sortRanges(ranges: BusinessHoursRange[]) {
  ranges.sort((prev, next) => prev.start - next.start || prev.end - next.end || prev.id - next.id)
}

function normalizeRange(range: Partial<BusinessHoursRange> | undefined, fallbackId: number): BusinessHoursRange {
  const start = normalizeMinute(range?.start ?? defaultRangeStart, defaultRangeStart)
  let end = normalizeMinute(range?.end ?? defaultRangeEnd, defaultRangeEnd)

  if (end <= start) {
    end = Math.min(start + slotMinutes, totalMinutes)
  }

  return {
    id: range?.id ?? fallbackId,
    start,
    end,
  }
}

function createDefaultRange(id: number): BusinessHoursRange {
  return normalizeRange({
    id,
    start: defaultRangeStart,
    end: defaultRangeEnd,
  }, id)
}

function normalizeValue(value: BusinessHoursValue | undefined | null): BusinessHoursValue {
  const normalizedRanges = Array.isArray(value?.ranges) && value.ranges.length
    ? value.ranges.map((range, index) => normalizeRange(range, index + 1))
    : [createDefaultRange(1)]

  sortRanges(normalizedRanges)

  return {
    mode: value?.mode ?? 'custom',
    ranges: normalizedRanges,
  }
}

function syncNextRangeId() {
  nextRangeId.value = innerValue.value.ranges.reduce((maxId, range) => Math.max(maxId, range.id), 0) + 1
}

function ensureActiveRange() {
  if (innerValue.value.mode !== 'custom') {
    activeRangeId.value = null
    return
  }

  if (!innerValue.value.ranges.length) {
    innerValue.value.ranges = [createDefaultRange(nextRangeId.value++)]
  }

  if (!innerValue.value.ranges.some(range => range.id === activeRangeId.value)) {
    activeRangeId.value = innerValue.value.ranges[0]?.id ?? null
  }
}

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function formatUnitValue(value: number) {
  return String(value).padStart(2, '0')
}

function formatRangeLabel(range: BusinessHoursRange) {
  return `${formatTime(range.start)}-${formatTime(range.end)}`
}

function getRangeById(rangeId: number) {
  return innerValue.value.ranges.find(range => range.id === rangeId)
}

function getRangeParts(range: BusinessHoursRange) {
  return {
    startHour: Math.floor(range.start / 60),
    startMinute: range.start % 60,
    endHour: range.end === totalMinutes ? 24 : Math.floor(range.end / 60),
    endMinute: range.end === totalMinutes ? 0 : range.end % 60,
  }
}

function getMinuteValueIndex(minute: number) {
  const minuteIndex = minuteValues.indexOf(minute)

  return minuteIndex === -1 ? 0 : minuteIndex
}

function buildStartTime(hour: number, minute: number) {
  if (!startHourValues.includes(hour) || !minuteValues.includes(minute)) {
    return null
  }

  const time = hour * 60 + minute

  return time < totalMinutes ? time : null
}

function buildEndTime(hour: number, minute: number) {
  if (!minuteValues.includes(minute)) {
    return null
  }

  if (hour === 24) {
    return minute === 0 ? totalMinutes : null
  }

  if (!startHourValues.includes(hour)) {
    return null
  }

  return hour * 60 + minute
}

function buildOccupiedSlots(excludeRangeId?: number) {
  const slots = Array.from({ length: totalSlots }, () => false)

  innerValue.value.ranges.forEach((range) => {
    if (range.id === excludeRangeId) {
      return
    }

    const startIndex = range.start / slotMinutes
    const endIndex = range.end / slotMinutes

    for (let index = startIndex; index < endIndex; index += 1) {
      slots[index] = true
    }
  })

  return slots
}

function getMaxContinuousEnd(start: number, occupiedSlots: boolean[]) {
  const startIndex = start / slotMinutes

  if (startIndex < 0 || startIndex >= totalSlots || occupiedSlots[startIndex]) {
    return start
  }

  let endIndex = startIndex

  while (endIndex < totalSlots && !occupiedSlots[endIndex]) {
    endIndex += 1
  }

  return endIndex * slotMinutes
}

function isStartAvailable(start: number, occupiedSlots: boolean[]) {
  if (start < 0 || start >= totalMinutes) {
    return false
  }

  return getMaxContinuousEnd(start, occupiedSlots) > start
}

function findClosestAvailableStart(requestedStart: number, occupiedSlots: boolean[]) {
  for (let offset = 0; offset <= totalSlots; offset += 1) {
    const forwardStart = requestedStart + offset * slotMinutes

    if (forwardStart < totalMinutes && isStartAvailable(forwardStart, occupiedSlots)) {
      return forwardStart
    }

    const backwardStart = requestedStart - offset * slotMinutes

    if (offset > 0 && backwardStart >= 0 && isStartAvailable(backwardStart, occupiedSlots)) {
      return backwardStart
    }
  }

  return null
}

function clampEnd(end: number, start: number, maxEnd: number) {
  const minEnd = start + slotMinutes

  if (maxEnd < minEnd) {
    return null
  }

  return Math.min(Math.max(end, minEnd), maxEnd)
}

function canUseEndTime(start: number, end: number, occupiedSlots: boolean[]) {
  const maxEnd = getMaxContinuousEnd(start, occupiedSlots)

  return end > start && end <= maxEnd
}

function isStartHourDisabled(rangeId: number, hour: number) {
  const occupiedSlots = buildOccupiedSlots(rangeId)

  return !minuteValues.some((minute) => {
    const start = buildStartTime(hour, minute)
    return start !== null && isStartAvailable(start, occupiedSlots)
  })
}

function isStartMinuteDisabled(rangeId: number, minute: number) {
  const targetRange = getRangeById(rangeId)
  const occupiedSlots = buildOccupiedSlots(rangeId)
  const startHour = targetRange ? getRangeParts(targetRange).startHour : 0
  const start = buildStartTime(startHour, minute)

  return start === null || !isStartAvailable(start, occupiedSlots)
}

function isEndHourDisabled(rangeId: number, hour: number) {
  const targetRange = getRangeById(rangeId)

  if (!targetRange) {
    return true
  }

  const occupiedSlots = buildOccupiedSlots(rangeId)

  return !minuteValues.some((minute) => {
    const end = buildEndTime(hour, minute)
    return end !== null && canUseEndTime(targetRange.start, end, occupiedSlots)
  })
}

function isEndMinuteDisabled(rangeId: number, minute: number) {
  const targetRange = getRangeById(rangeId)

  if (!targetRange) {
    return true
  }

  const occupiedSlots = buildOccupiedSlots(rangeId)
  const endHour = getRangeParts(targetRange).endHour
  const end = buildEndTime(endHour, minute)

  return end === null || !canUseEndTime(targetRange.start, end, occupiedSlots)
}

function getPickerValue(range: BusinessHoursRange) {
  const { startHour, startMinute, endHour, endMinute } = getRangeParts(range)

  return [
    startHour,
    getMinuteValueIndex(startMinute),
    endHour,
    getMinuteValueIndex(endMinute),
  ]
}

function toggleActiveRange(rangeId: number) {
  activeRangeId.value = activeRangeId.value === rangeId ? null : rangeId
}

function updateMode(mode: BusinessHoursMode) {
  if (innerValue.value.mode === mode) {
    return
  }

  innerValue.value.mode = mode

  if (mode === 'custom') {
    ensureActiveRange()
  }
}

function applyRangeValue(rangeId: number, pickerValue: number[]) {
  const targetRange = getRangeById(rangeId)

  if (!targetRange) {
    return
  }

  const currentParts = getRangeParts(targetRange)
  const occupiedSlots = buildOccupiedSlots(rangeId)
  const requestedStartHour = startHourValues[pickerValue[0]] ?? currentParts.startHour
  const requestedStartMinute = minuteValues[pickerValue[1]] ?? currentParts.startMinute
  const requestedEndHour = endHourValues[pickerValue[2]] ?? currentParts.endHour
  const requestedEndMinute = minuteValues[pickerValue[3]] ?? currentParts.endMinute

  const rawRequestedStart = buildStartTime(requestedStartHour, requestedStartMinute)
  const rawRequestedEnd = buildEndTime(requestedEndHour, requestedEndMinute)
  const requestedStart = rawRequestedStart ?? targetRange.start
  const safeStart = findClosestAvailableStart(requestedStart, occupiedSlots)

  if (safeStart === null) {
    uni.showToast({
      title: '暂无可用营业时段',
      icon: 'none',
    })
    return
  }

  const maxEnd = getMaxContinuousEnd(safeStart, occupiedSlots)
  const requestedEnd = rawRequestedEnd ?? totalMinutes
  const safeEnd = clampEnd(requestedEnd, safeStart, maxEnd)

  if (safeEnd === null) {
    uni.showToast({
      title: '暂无可用营业时段',
      icon: 'none',
    })
    return
  }

  const hasCorrectedValue = rawRequestedStart === null
    || rawRequestedEnd === null
    || safeStart !== requestedStart
    || safeEnd !== requestedEnd

  targetRange.start = safeStart
  targetRange.end = safeEnd
  sortRanges(innerValue.value.ranges)
  activeRangeId.value = rangeId

  if (hasCorrectedValue) {
    uni.showToast({
      title: '该时间已被其他营业时段占用',
      icon: 'none',
    })
  }
}

function removeRange(rangeId: number) {
  if (innerValue.value.ranges.length <= 1) {
    uni.showToast({
      title: '请至少保留一个营业时段',
      icon: 'none',
    })
    return
  }

  innerValue.value.ranges = innerValue.value.ranges.filter(range => range.id !== rangeId)
  ensureActiveRange()
}

function isContinuousSlotAvailable(start: number, duration: number, occupiedSlots: boolean[]) {
  if (start < 0 || start + duration > totalMinutes) {
    return false
  }

  const startIndex = start / slotMinutes
  const endIndex = (start + duration) / slotMinutes

  for (let index = startIndex; index < endIndex; index += 1) {
    if (occupiedSlots[index]) {
      return false
    }
  }

  return true
}

function buildSuggestedStarts() {
  const ranges = [...innerValue.value.ranges].sort((prev, next) => prev.start - next.start)
  const candidates = new Set<number>([defaultRangeStart])

  ranges.forEach((range) => {
    if (range.end < totalMinutes) {
      candidates.add(range.end)
    }
  })

  candidates.add(0)

  timePoints.slice(0, -1).forEach((time) => {
    candidates.add(time)
  })

  return Array.from(candidates)
}

function findSuggestedRange() {
  const occupiedSlots = buildOccupiedSlots()
  const durationCandidates = [60, 30, slotMinutes]
  const startCandidates = buildSuggestedStarts()

  for (const duration of durationCandidates) {
    for (const start of startCandidates) {
      if (isContinuousSlotAvailable(start, duration, occupiedSlots)) {
        return {
          start,
          end: start + duration,
        }
      }
    }
  }

  return null
}

function addRange() {
  const nextRange = findSuggestedRange()

  if (!nextRange) {
    uni.showToast({
      title: '没有可添加的营业时段了',
      icon: 'none',
    })
    return
  }

  const rangeId = nextRangeId.value++

  innerValue.value.ranges.push({
    id: rangeId,
    start: nextRange.start,
    end: nextRange.end,
  })
  sortRanges(innerValue.value.ranges)
  activeRangeId.value = rangeId
}
</script>

<template>
  <view class="business-hours-picker">
    <view class="business-hours-picker__modes">
      <view
        v-for="option in modeOptions"
        :key="option.value"
        class="business-hours-picker__mode"
        hover-class="business-hours-picker__mode--hover"
        @tap="updateMode(option.value)"
      >
        <view
          class="business-hours-picker__radio"
          :class="{ 'business-hours-picker__radio--active': innerValue.mode === option.value }"
        >
          <view v-if="innerValue.mode === option.value" class="business-hours-picker__radio-dot" />
        </view>
        <text class="business-hours-picker__mode-text">
          {{ option.label }}
        </text>
      </view>
    </view>

    <view v-if="innerValue.mode === 'custom'" class="business-hours-picker__custom">
      <view
        v-for="range in innerValue.ranges"
        :key="range.id"
        class="business-hours-picker__range"
      >
        <view class="business-hours-picker__range-head">
          <view class="business-hours-picker__minus" @tap="removeRange(range.id)">
            <text class="business-hours-picker__minus-line" />
          </view>

          <view
            class="business-hours-picker__range-summary"
            :class="{ 'business-hours-picker__range-summary--active': activeRangeId === range.id }"
            hover-class="business-hours-picker__range-summary--hover"
            @tap="toggleActiveRange(range.id)"
          >
            <text class="business-hours-picker__range-label">
              {{ formatRangeLabel(range) }}
            </text>
            <text
              class="business-hours-picker__chevron"
              :class="{ 'business-hours-picker__chevron--expanded': activeRangeId === range.id }"
            >
              ^
            </text>
          </view>
        </view>

        <view v-if="activeRangeId === range.id" class="business-hours-picker__picker-wrap">
          <view class="business-hours-picker__picker-lines business-hours-picker__picker-lines--top" />
          <view class="business-hours-picker__picker-lines business-hours-picker__picker-lines--bottom" />
          <view class="business-hours-picker__picker-divider business-hours-picker__picker-divider--start-colon">
            :
          </view>
          <view class="business-hours-picker__picker-divider business-hours-picker__picker-divider--middle">
            至
          </view>
          <view class="business-hours-picker__picker-divider business-hours-picker__picker-divider--end-colon">
            :
          </view>

          <picker-view
            class="business-hours-picker__picker"
            indicator-style="height: 76rpx;"
            mask-style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.36) 24%, rgba(255, 255, 255, 0) 42%, rgba(255, 255, 255, 0) 58%, rgba(255, 255, 255, 0.36) 76%, rgba(255, 255, 255, 0.96) 100%);"
            :value="getPickerValue(range)"
            @change="applyRangeValue(range.id, $event.detail.value)"
          >
            <picker-view-column>
              <view
                v-for="hour in startHourValues"
                :key="`start-hour-${range.id}-${hour}`"
                class="business-hours-picker__picker-item"
                :class="{ 'business-hours-picker__picker-item--disabled': isStartHourDisabled(range.id, hour) }"
              >
                {{ formatUnitValue(hour) }}
              </view>
            </picker-view-column>

            <picker-view-column>
              <view
                v-for="minute in minuteValues"
                :key="`start-minute-${range.id}-${minute}`"
                class="business-hours-picker__picker-item"
                :class="{ 'business-hours-picker__picker-item--disabled': isStartMinuteDisabled(range.id, minute) }"
              >
                {{ formatUnitValue(minute) }}
              </view>
            </picker-view-column>

            <picker-view-column>
              <view
                v-for="hour in endHourValues"
                :key="`end-hour-${range.id}-${hour}`"
                class="business-hours-picker__picker-item"
                :class="{ 'business-hours-picker__picker-item--disabled': isEndHourDisabled(range.id, hour) }"
              >
                {{ formatUnitValue(hour) }}
              </view>
            </picker-view-column>

            <picker-view-column>
              <view
                v-for="minute in minuteValues"
                :key="`end-minute-${range.id}-${minute}`"
                class="business-hours-picker__picker-item"
                :class="{ 'business-hours-picker__picker-item--disabled': isEndMinuteDisabled(range.id, minute) }"
              >
                {{ formatUnitValue(minute) }}
              </view>
            </picker-view-column>
          </picker-view>
        </view>
      </view>

      <view
        class="business-hours-picker__add"
        :class="{ 'business-hours-picker__add--disabled': !canAddRange }"
        hover-class="business-hours-picker__add--hover"
        @tap="addRange"
      >
        <text class="business-hours-picker__add-icon">+</text>
        <text class="business-hours-picker__add-text">
          添加营业时段
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.business-hours-picker {
  margin-top: 18rpx;
}

.business-hours-picker__modes {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 30rpx;
}

.business-hours-picker__mode {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
}

.business-hours-picker__mode--hover,
.business-hours-picker__range-summary--hover,
.business-hours-picker__add--hover {
  opacity: 0.84;
}

.business-hours-picker__radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border-radius: 9999rpx;
  border: 2rpx solid #d8dce5;
  background: #fff;
  box-sizing: border-box;
}

.business-hours-picker__radio--active {
  border-color: #f4c400;
}

.business-hours-picker__radio-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 9999rpx;
  background: #f4c400;
}

.business-hours-picker__mode-text {
  color: #2b2f36;
  font-size: 30rpx;
}

.business-hours-picker__custom {
  margin-top: 24rpx;
}

.business-hours-picker__range + .business-hours-picker__range {
  margin-top: 16rpx;
}

.business-hours-picker__range-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.business-hours-picker__minus {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
  border-radius: 9999rpx;
  border: 2rpx solid #ffb360;
  background: #fff9f1;
  box-sizing: border-box;
}

.business-hours-picker__minus-line {
  width: 14rpx;
  height: 2rpx;
  border-radius: 9999rpx;
  background: #ff9d32;
}

.business-hours-picker__range-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
  min-height: 72rpx;
  padding: 0 24rpx;
  border-radius: 22rpx;
  background: #f7f8fb;
  box-shadow: inset 0 0 0 2rpx rgba(242, 244, 247, 0.95);
}

.business-hours-picker__range-summary--active {
  background: #fdf8ea;
  box-shadow: inset 0 0 0 2rpx rgba(244, 196, 0, 0.24);
}

.business-hours-picker__range-label {
  color: #30353d;
  font-size: 32rpx;
  font-weight: 600;
}

.business-hours-picker__chevron {
  color: #8f96a2;
  font-size: 26rpx;
  line-height: 1;
  transform: rotate(180deg);
  transition: transform 0.2s ease;
}

.business-hours-picker__chevron--expanded {
  transform: rotate(0deg);
}

.business-hours-picker__picker-wrap {
  position: relative;
  margin-top: 12rpx;
  padding: 8rpx 0;
}

.business-hours-picker__picker {
  width: 100%;
  height: 288rpx;
}

.business-hours-picker__picker-divider {
  position: absolute;
  top: 118rpx;
  z-index: 3;
  color: #5b6068;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 76rpx;
}

.business-hours-picker__picker-divider--start-colon {
  left: 25%;
  transform: translateX(-50%);
}

.business-hours-picker__picker-divider--middle {
  left: 50%;
  transform: translateX(-50%);
}

.business-hours-picker__picker-divider--end-colon {
  left: 75%;
  transform: translateX(-50%);
}

.business-hours-picker__picker-lines {
  position: absolute;
  left: 18rpx;
  right: 18rpx;
  height: 2rpx;
  background: #eceff4;
  z-index: 2;
}

.business-hours-picker__picker-lines--top {
  top: 112rpx;
}

.business-hours-picker__picker-lines--bottom {
  top: 188rpx;
}

.business-hours-picker__picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 76rpx;
  color: #2a2e35;
  font-size: 36rpx;
  font-weight: 600;
}

.business-hours-picker__picker-item--disabled {
  color: #c5cad3;
}

.business-hours-picker__add {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 18rpx;
}

.business-hours-picker__add--disabled {
  opacity: 0.56;
}

.business-hours-picker__add-icon,
.business-hours-picker__add-text {
  color: #f0a328;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
