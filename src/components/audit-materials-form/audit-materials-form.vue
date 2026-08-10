<script setup lang="ts">
import type {
  AuditMaterialsAddressSuggestion,
  AuditMaterialsDocumentItem,
  AuditMaterialsFormValue,
  AuditMaterialsSelectField,
  AuditMaterialsTextField,
} from './shared'
import { formatAddressSuggestionMeta } from './address-suggestion'

interface Props {
  modelValue: AuditMaterialsFormValue
  selectFields: AuditMaterialsSelectField[]
  textFields: AuditMaterialsTextField[]
  documents: AuditMaterialsDocumentItem[]
  documentIcon?: string
  submitText?: string
  title?: string
  tipText?: string
  readonly?: boolean
  fieldIssues?: Record<string, string>
  addressFieldKey?: string
  addressIcon?: string
  addressSuggestions?: AuditMaterialsAddressSuggestion[]
  addressSuggestionVisible?: boolean
  loadingAddressSuggestions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  documentIcon: '',
  submitText: '确认提交',
  title: '审核资料编辑',
  tipText: '带 * 为必填项，请确保信息与证件一致',
  readonly: false,
  fieldIssues: () => ({}),
  addressFieldKey: '',
  addressIcon: '',
  addressSuggestions: () => [],
  addressSuggestionVisible: false,
  loadingAddressSuggestions: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: AuditMaterialsFormValue]
  'upload-document': [item: AuditMaterialsDocumentItem]
  'clear-field-issue': [key: string]
  'address-icon-tap': []
  'select-address-suggestion': [item: AuditMaterialsAddressSuggestion]
  'submit': [value: AuditMaterialsFormValue]
}>()

function fieldValue(key: string) {
  return props.modelValue[key] || ''
}

function updateField(key: string, value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

function handleInput(key: string, event: { detail: { value: string } }) {
  if (props.readonly)
    return
  updateField(key, event.detail.value)
  emit('clear-field-issue', key)
}

function optionLabels(field: AuditMaterialsSelectField) {
  return field.options.map(option => option.label)
}

function selectedOptionIndex(field: AuditMaterialsSelectField) {
  const index = field.options.findIndex(option => option.value === fieldValue(field.key))
  return index >= 0 ? index : 0
}

function selectedOptionLabel(field: AuditMaterialsSelectField) {
  return field.options[selectedOptionIndex(field)]?.label || '请选择'
}

function handlePickerChange(field: AuditMaterialsSelectField, event: { detail: { value: number | string } }) {
  if (props.readonly)
    return
  const option = field.options[Number(event.detail.value)]
  if (option) {
    updateField(field.key, option.value)
    emit('clear-field-issue', field.key)
  }
}

function handleDocumentTap(item: AuditMaterialsDocumentItem) {
  if (props.readonly)
    return
  emit('upload-document', item)
}

function handleAddressIconTap() {
  if (props.readonly || props.loadingAddressSuggestions)
    return
  emit('address-icon-tap')
}

function handleAddressSuggestionTap(item: AuditMaterialsAddressSuggestion) {
  if (props.readonly)
    return
  emit('select-address-suggestion', item)
}

function handleSubmit() {
  if (props.readonly)
    return
  emit('submit', { ...props.modelValue })
}
</script>

<template>
  <view class="audit-materials-form">
    <view class="audit-materials-form__tip">
      <text>带</text>
      <text class="audit-materials-form__required">*</text>
      <text>为必填项，请确保信息与证件一致</text>
    </view>

    <view class="audit-materials-form__card">
      <view class="audit-materials-form__select-grid">
        <view
          v-for="field in selectFields"
          :key="field.key"
          class="audit-materials-form__field audit-materials-form__field--select"
        >
          <text class="audit-materials-form__label">
            {{ field.label }}<text v-if="field.required" class="audit-materials-form__required">*</text>
          </text>

          <picker
            class="audit-materials-form__picker"
            mode="selector"
            :range="optionLabels(field)"
            :value="selectedOptionIndex(field)"
            :disabled="readonly"
            @change="handlePickerChange(field, $event)"
          >
            <view
              class="audit-materials-form__control"
              :class="{ 'audit-materials-form__control--issue': fieldIssues[field.key] }"
            >
              <text class="audit-materials-form__control-value">
                {{ selectedOptionLabel(field) }}
              </text>
              <view class="audit-materials-form__chevron" />
            </view>
          </picker>
          <text v-if="fieldIssues[field.key]" class="audit-materials-form__issue">
            {{ fieldIssues[field.key] }}
          </text>
        </view>
      </view>

      <view class="audit-materials-form__text-fields">
        <view v-for="field in textFields" :key="field.key" class="audit-materials-form__field">
          <text class="audit-materials-form__label">
            {{ field.label }}<text v-if="field.required" class="audit-materials-form__required">*</text>
          </text>
          <view v-if="field.key === addressFieldKey" class="audit-materials-form__address-control">
            <view class="audit-materials-form__address-input-row">
              <input
                class="audit-materials-form__input"
                :class="{ 'audit-materials-form__input--issue': fieldIssues[field.key] }"
                :type="field.type || 'text'"
                :value="fieldValue(field.key)"
                :placeholder="field.placeholder || ''"
                :disabled="readonly"
                placeholder-class="audit-materials-form__placeholder"
                @input="handleInput(field.key, $event)"
              >
              <view
                class="audit-materials-form__address-location"
                :class="{ 'audit-materials-form__address-location--loading': loadingAddressSuggestions, 'audit-materials-form__address-location--disabled': readonly }"
                hover-class="audit-materials-form__address-location--hover"
                @tap.stop="handleAddressIconTap"
              >
                <image
                  v-if="addressIcon"
                  class="audit-materials-form__address-location-icon"
                  :src="addressIcon"
                  mode="aspectFit"
                />
              </view>
            </view>

            <text v-if="loadingAddressSuggestions" class="audit-materials-form__address-suggestion-state">
              正在获取附近地址...
            </text>

            <scroll-view
              v-else-if="addressSuggestionVisible && addressSuggestions.length"
              class="audit-materials-form__address-suggestion-list"
              scroll-y
              enhanced
              show-scrollbar
              @tap.stop
            >
              <view
                v-for="(item, index) in addressSuggestions"
                :key="`${item.title || item.address || 'suggestion'}-${index}`"
                class="audit-materials-form__address-suggestion-item"
                hover-class="audit-materials-form__address-suggestion-item--hover"
                @tap.stop="handleAddressSuggestionTap(item)"
              >
                <view class="audit-materials-form__address-suggestion-title">
                  {{ item.title || item.detailAddress || item.address }}
                </view>
                <view class="audit-materials-form__address-suggestion-address">
                  {{ item.address || item.detailAddress }}
                </view>
                <view v-if="formatAddressSuggestionMeta(item)" class="audit-materials-form__address-suggestion-meta">
                  {{ formatAddressSuggestionMeta(item) }}
                </view>
              </view>
            </scroll-view>
          </view>
          <input
            v-else
            class="audit-materials-form__input"
            :class="{ 'audit-materials-form__input--issue': fieldIssues[field.key] }"
            :type="field.type || 'text'"
            :value="fieldValue(field.key)"
            :placeholder="field.placeholder || ''"
            :disabled="readonly"
            placeholder-class="audit-materials-form__placeholder"
            @input="handleInput(field.key, $event)"
          >
          <text v-if="fieldIssues[field.key]" class="audit-materials-form__issue">
            {{ fieldIssues[field.key] }}
          </text>
        </view>
      </view>

      <view class="audit-materials-form__documents">
        <view
          v-for="item in documents"
          :key="item.key"
          class="audit-materials-form__document-wrapper"
        >
          <view
            class="audit-materials-form__document"
            :class="{ 'audit-materials-form__document--issue': item.issueMessage }"
            hover-class="audit-materials-form__document--hover"
            @tap="handleDocumentTap(item)"
          >
            <text class="audit-materials-form__document-title">
              {{ item.title }}<text v-if="item.required" class="audit-materials-form__required">*</text>
            </text>

            <image
              v-if="item.imageUrl || item.fileUrl || documentIcon"
              class="audit-materials-form__document-icon"
              :src="item.imageUrl || documentIcon"
              mode="aspectFit"
            />

            <text class="audit-materials-form__document-text">
              {{ item.fileName || (item.imageUrl || item.fileUrl ? '已上传' : item.emptyText || '上传文件') }}
            </text>
          </view>

          <text v-if="item.issueMessage" class="audit-materials-form__issue">
            {{ item.issueMessage }}
          </text>
        </view>
      </view>

      <view
        class="audit-materials-form__submit"
        :class="{ 'audit-materials-form__submit--disabled': readonly }"
        hover-class="audit-materials-form__submit--hover"
        @tap="handleSubmit"
      >
        {{ submitText }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.audit-materials-form {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.audit-materials-form__tip {
  display: flex;
  align-items: center;
  min-height: 76rpx;
  padding: 0 28rpx;
  border-radius: 20rpx;
  background: #f1f1ef;
  color: #3f4246;
  font-size: 28rpx;
  line-height: 1.4;
}

.audit-materials-form__required {
  margin-left: 4rpx;
  color: #e3473e;
  font-weight: 700;
}

.audit-materials-form__card {
  overflow: hidden;
  padding-top: 18rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.audit-materials-form__select-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx 24rpx;
  padding: 16rpx 28rpx 20rpx;
}

.audit-materials-form__text-fields {
  padding: 0 28rpx;
}

.audit-materials-form__field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6rpx 16rpx;
  min-width: 0;
  min-height: 86rpx;
}

.audit-materials-form__text-fields .audit-materials-form__field {
  border-top: 2rpx solid #f0f1f3;
}

.audit-materials-form__label {
  flex-shrink: 0;
  color: #25282d;
  font-size: 29rpx;
  line-height: 1.35;
}

.audit-materials-form__picker {
  min-width: 0;
  flex: 1;
}

.audit-materials-form__control,
.audit-materials-form__input {
  width: 100%;
  min-width: 0;
  height: 74rpx;
  border: 2rpx solid #dedfe1;
  border-radius: 17rpx;
  box-sizing: border-box;
  background: #fff;
}

.audit-materials-form__control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  padding: 0 20rpx;
}

.audit-materials-form__control--issue,
.audit-materials-form__input--issue {
  border-color: #e3473e;
  background: #fff8f7;
}

.audit-materials-form__control-value {
  overflow: hidden;
  color: #2c2f34;
  font-size: 28rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-materials-form__chevron {
  width: 16rpx;
  height: 16rpx;
  flex-shrink: 0;
  border-right: 4rpx solid #42464b;
  border-bottom: 4rpx solid #42464b;
  transform: rotate(45deg) translateY(-4rpx);
}

.audit-materials-form__input {
  flex: 1;
  padding: 0 20rpx;
  color: #2c2f34;
  font-size: 28rpx;
  line-height: 74rpx;
}

.audit-materials-form__address-control {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  z-index: 10;
}

.audit-materials-form__address-input-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10rpx;
}

.audit-materials-form__address-location {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 74rpx;
  flex-shrink: 0;
}

.audit-materials-form__address-location--loading,
.audit-materials-form__address-location--disabled {
  opacity: 0.5;
}

.audit-materials-form__address-location--hover {
  opacity: 0.72;
}

.audit-materials-form__address-location-icon {
  display: block;
  width: 38rpx;
  height: 38rpx;
}

.audit-materials-form__address-suggestion-state {
  margin-top: 12rpx;
  color: #8a8f98;
  font-size: 24rpx;
  line-height: 1.5;
}

.audit-materials-form__address-suggestion-list {
  position: absolute;
  top: 86rpx;
  right: 0;
  left: 0;
  z-index: 20;
  max-height: 420rpx;
  margin-top: 12rpx;
  overflow: hidden;
  border: 1rpx solid #eceef2;
  border-radius: 16rpx;
  background: #fafbfc;
}

.audit-materials-form__address-suggestion-item {
  padding: 18rpx 20rpx;
  border-top: 1rpx solid #eceef2;
}

.audit-materials-form__address-suggestion-item:first-child {
  border-top: none;
}

.audit-materials-form__address-suggestion-item--hover {
  background: #f0f4f8;
}

.audit-materials-form__address-suggestion-title {
  color: #20242a;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.4;
}

.audit-materials-form__address-suggestion-address {
  margin-top: 6rpx;
  color: #5f6670;
  font-size: 24rpx;
  line-height: 1.45;
}

.audit-materials-form__address-suggestion-meta {
  margin-top: 6rpx;
  color: #8b929c;
  font-size: 22rpx;
  line-height: 1.4;
}

.audit-materials-form__placeholder {
  color: #c3c5c8;
}

.audit-materials-form__issue {
  display: block;
  flex-basis: 100%;
  width: 100%;
  margin-top: 6rpx;
  color: #e3473e;
  font-size: 23rpx;
  line-height: 1.35;
  word-break: break-all;
}

.audit-materials-form__documents {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: flex-start;
  gap: 18rpx;
  padding: 26rpx 28rpx 28rpx;
  border-top: 2rpx solid #f0f1f3;
}

.audit-materials-form__document-wrapper {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
}

.audit-materials-form__document {
  display: flex;
  min-width: 0;
  min-height: 278rpx;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 14rpx 18rpx;
  border: 2rpx solid #dedfe1;
  border-radius: 18rpx;
  box-sizing: border-box;
  background: #fff;
}

.audit-materials-form__document--issue {
  border-color: #e3473e;
  background: #fff8f7;
}

.audit-materials-form__document--hover,
.audit-materials-form__submit--hover {
  opacity: 0.82;
}

.audit-materials-form__document-title {
  width: 100%;
  overflow: hidden;
  color: #24272b;
  font-size: 26rpx;
  line-height: 1.35;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-materials-form__document-icon {
  width: 104rpx;
  height: 116rpx;
  margin: 12rpx 0 6rpx;
}

.audit-materials-form__document-text {
  color: #55595e;
  font-size: 25rpx;
  line-height: 1.35;
}

.audit-materials-form__document-wrapper > .audit-materials-form__issue {
  margin: 10rpx 4rpx 0;
  font-size: 22rpx;
  line-height: 1.35;
}

.audit-materials-form__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 94rpx;
  margin: 0 28rpx 30rpx;
  border-radius: 22rpx;
  background: linear-gradient(180deg, #ffd84d 0%, #ffcf37 100%);
  color: #202327;
  font-size: 36rpx;
  font-weight: 700;
}

.audit-materials-form__submit--disabled {
  opacity: 0.5;
}
</style>
