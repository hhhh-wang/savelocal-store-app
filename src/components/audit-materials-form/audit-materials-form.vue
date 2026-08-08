<script setup lang="ts">
import type {
  AuditMaterialsDocumentItem,
  AuditMaterialsFormValue,
  AuditMaterialsSelectField,
  AuditMaterialsTextField,
} from './shared'

interface Props {
  modelValue: AuditMaterialsFormValue
  selectFields: AuditMaterialsSelectField[]
  textFields: AuditMaterialsTextField[]
  documents: AuditMaterialsDocumentItem[]
  documentIcon?: string
  title?: string
  tipText?: string
}

const props = withDefaults(defineProps<Props>(), {
  documentIcon: '',
  title: '审核资料编辑',
  tipText: '带 * 为必填项，请确保信息与证件一致',
})

const emit = defineEmits<{
  'update:modelValue': [value: AuditMaterialsFormValue]
  'upload-document': [item: AuditMaterialsDocumentItem]
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
  updateField(key, event.detail.value)
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
  const option = field.options[Number(event.detail.value)]
  if (option)
    updateField(field.key, option.value)
}

function handleDocumentTap(item: AuditMaterialsDocumentItem) {
  emit('upload-document', item)
}

function handleSubmit() {
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
            @change="handlePickerChange(field, $event)"
          >
            <view class="audit-materials-form__control">
              <text class="audit-materials-form__control-value">
                {{ selectedOptionLabel(field) }}
              </text>
              <view class="audit-materials-form__chevron" />
            </view>
          </picker>
        </view>
      </view>

      <view class="audit-materials-form__text-fields">
        <view v-for="field in textFields" :key="field.key" class="audit-materials-form__field">
          <text class="audit-materials-form__label">
            {{ field.label }}<text v-if="field.required" class="audit-materials-form__required">*</text>
          </text>
          <input
            class="audit-materials-form__input"
            :type="field.type || 'text'"
            :value="fieldValue(field.key)"
            :placeholder="field.placeholder || ''"
            placeholder-class="audit-materials-form__placeholder"
            @input="handleInput(field.key, $event)"
          >
        </view>
      </view>

      <view class="audit-materials-form__documents">
        <view
          v-for="item in documents"
          :key="item.key"
          class="audit-materials-form__document"
          hover-class="audit-materials-form__document--hover"
          @tap="handleDocumentTap(item)"
        >
          <text class="audit-materials-form__document-title">
            {{ item.title }}<text v-if="item.required" class="audit-materials-form__required">*</text>
          </text>

          <image
            v-if="item.imageUrl || documentIcon"
            class="audit-materials-form__document-icon"
            :src="item.imageUrl || documentIcon"
            mode="aspectFit"
          />

          <text class="audit-materials-form__document-text">
            {{ item.imageUrl ? '已上传' : item.emptyText || '上传文件' }}
          </text>
        </view>
      </view>

      <view
        class="audit-materials-form__submit"
        hover-class="audit-materials-form__submit--hover"
        @tap="handleSubmit"
      >
        确认提交
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
  align-items: center;
  gap: 16rpx;
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

.audit-materials-form__placeholder {
  color: #c3c5c8;
}

.audit-materials-form__documents {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18rpx;
  padding: 26rpx 28rpx 28rpx;
  border-top: 2rpx solid #f0f1f3;
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
</style>
