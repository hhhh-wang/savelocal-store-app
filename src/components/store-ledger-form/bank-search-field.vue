<script setup lang="ts">
import { debounce } from '@/utils/debounce'

interface BankOption { code: string, name: string }

const props = defineProps<{
  value: string
  disabled: boolean
  active: boolean
  placeholder: string
  search: (keyword: string) => Promise<BankOption[]>
}>()
const emit = defineEmits<{
  input: [value: string]
  select: [option: BankOption]
  focus: []
}>()
const options = ref<BankOption[]>([])
const visible = ref(false)
const searching = ref(false)
const searchError = ref('')
let sequence = 0
let blurTimer: ReturnType<typeof setTimeout> | undefined

const query = debounce(async (keyword: string) => {
  const request = ++sequence
  try {
    const items = await props.search(keyword)
    if (request === sequence && !props.disabled && props.value.trim() === keyword)
      options.value = items
  }
  catch (error) {
    if (request === sequence)
      searchError.value = error instanceof Error ? error.message : '查询失败，请重新输入名称'
  }
  finally {
    if (request === sequence)
      searching.value = false
  }
}, 300)

function close() {
  sequence += 1
  query.cancel()
  clearTimeout(blurTimer)
  visible.value = false
  searching.value = false
  options.value = []
}

function lookup(value: string) {
  close()
  if (props.disabled)
    return
  visible.value = true
  searchError.value = ''
  const keyword = value.trim()
  if (keyword.length >= 2) {
    searching.value = true
    query(keyword)
  }
}

function input(event: { detail: { value: string } }) {
  if (props.disabled)
    return
  emit('input', event.detail.value)
  lookup(event.detail.value)
}

function select(option: BankOption) {
  if (props.disabled)
    return
  close()
  emit('select', option)
}

function blur() {
  blurTimer = setTimeout(close, 200)
}

function keepOpen() {
  clearTimeout(blurTimer)
}

function focus() {
  emit('focus')
  lookup(props.value)
}

watch(() => props.active, (active) => {
  if (!active)
    close()
})

watch(() => props.disabled, (disabled) => {
  if (disabled)
    close()
})
watch(() => props.value, (value) => {
  if (!value)
    close()
})
onUnmounted(close)
</script>

<template>
  <view class="bank-search" @tap.stop>
    <input
      class="bank-search__input"
      :value="value"
      :disabled="disabled"
      :maxlength="60"
      :placeholder="placeholder"
      placeholder-class="bank-search__placeholder"
      @input="input"
      @focus="focus"
      @blur="blur"
    >
    <view v-if="visible" class="bank-search__suggestions">
      <text v-if="searching" class="bank-search__message">正在查询…</text>
      <text v-else-if="searchError" class="bank-search__message bank-search__message--error">{{ searchError }}</text>
      <text v-else-if="value.trim().length < 2" class="bank-search__message">请输入至少2个字的名称关键词</text>
      <text v-else-if="!options.length" class="bank-search__message">未找到匹配结果，请更换名称关键词</text>
      <scroll-view v-else class="bank-search__list" scroll-y @touchstart="keepOpen">
        <view v-for="option in options" :key="option.code" class="bank-search__option" hover-class="bank-search__option--hover" @tap.stop="select(option)">
          {{ option.name }}
        </view>
        <text v-if="options.length >= 20" class="bank-search__message">可补充完整名称或地区，缩小查询范围</text>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.bank-search {
  position: relative;
  flex: 1;
  min-width: 0;
}

.bank-search__input {
  height: 88rpx;
  color: #24272b;
  font-size: 26rpx;
  text-align: right;
}

.bank-search__placeholder {
  color: #b1b5bd;
}

.bank-search__suggestions {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 30;
  width: calc(100% + 240rpx);
  overflow: hidden;
  border: 1rpx solid #e6e8ed;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 10rpx 28rpx rgba(36, 39, 43, 0.08);
}

.bank-search__list {
  max-height: 380rpx;
}

.bank-search__option {
  padding: 22rpx 24rpx;
  border-bottom: 1rpx solid #f0f1f3;
  color: #363b42;
  font-size: 26rpx;
  line-height: 1.6;
  word-break: break-word;
}

.bank-search__option--hover {
  background: #fff8df;
}

.bank-search__message {
  display: block;
  padding: 22rpx 24rpx;
  color: #858a93;
  font-size: 24rpx;
  line-height: 1.6;
}

.bank-search__message--error {
  color: #b64a3d;
}
</style>
