export interface QualificationTemplate {
  qualificationCode: string
  qualificationName: string
  qualificationScope?: string
  isRequired?: string
}

export interface QualificationRecord {
  qualificationCode: string
  qualificationScope?: string
  qualificationNo?: string
  qualificationImages?: string
  validTo?: string
  auditStatus?: string
  rejectReason?: string
}

export interface QualificationField {
  key?: 'qualificationNo' | 'validTo'
  label: string
  value?: string
  editor?: 'text' | 'date'
  optional?: boolean
  required?: boolean
  toggle?: boolean
  toggleActive?: boolean
  muted?: boolean
}

export interface QualificationUpload {
  key: string
  title: string
  required?: boolean
  imageUrls: string[]
}

export interface QualificationSection {
  id: string
  title: string
  required?: boolean
  statusText?: string
  rejectReason?: string
  showSectionWarn?: boolean
  uploads: QualificationUpload[]
  fields: QualificationField[]
}

export interface QualificationCatalog {
  templates: QualificationTemplate[]
  records: QualificationRecord[]
}

export const MAX_QUALIFICATION_IMAGES = 4

export function normalizeQualificationNo(value: string | undefined) {
  return value?.trim() || undefined
}

export function appendQualificationImage(imageUrls: string[], imageUrl: string) {
  if (imageUrls.length >= MAX_QUALIFICATION_IMAGES)
    throw new Error(`最多上传 ${MAX_QUALIFICATION_IMAGES} 张图片`)

  return [...imageUrls, imageUrl]
}

export function replaceQualificationImage(imageUrls: string[], index: number, imageUrl: string) {
  if (index < 0 || index >= imageUrls.length)
    throw new Error('当前图片不存在')

  const nextImageUrls = [...imageUrls]
  nextImageUrls[index] = imageUrl
  return nextImageUrls
}

export function removeQualificationImage(imageUrls: string[], index: number, required: boolean) {
  if (index < 0 || index >= imageUrls.length)
    throw new Error('当前图片不存在')
  if (required && imageUrls.length === 1)
    throw new Error('必填资质至少保留 1 张图片')

  return imageUrls.filter((_, imageIndex) => imageIndex !== index)
}

export function mergeQualificationCatalogs(...catalogs: QualificationCatalog[]): QualificationCatalog {
  const templates = new Map<string, QualificationTemplate>()
  const records = new Map<string, QualificationRecord>()

  catalogs.forEach((catalog) => {
    catalog.templates.forEach(template => templates.set(template.qualificationCode, template))
    catalog.records.forEach(record => records.set(record.qualificationCode, record))
  })

  return {
    templates: Array.from(templates.values()),
    records: Array.from(records.values()),
  }
}

export function buildQualificationSections(
  templates: QualificationTemplate[],
  qualifications: QualificationRecord[],
): QualificationSection[] {
  return templates.map((type) => {
    const item = qualifications.find(value => value.qualificationCode === type.qualificationCode)
    const required = type.isRequired === '1' || type.isRequired === 'Y'
    const statusText = item?.auditStatus === '1' ? '已生效' : item?.auditStatus === '2' ? '已驳回' : '待提交/审核'
    const imageUrls = (item?.qualificationImages || '').split(',').map(value => value.trim()).filter(Boolean)

    return {
      id: type.qualificationCode,
      title: type.qualificationName,
      required,
      statusText,
      showSectionWarn: item?.auditStatus === '2',
      ...(item?.auditStatus === '2' ? { rejectReason: item.rejectReason || '审核未通过' } : {}),
      uploads: [{ key: type.qualificationCode, title: type.qualificationName, required, imageUrls }],
      fields: [
        { key: 'qualificationNo', label: '证件编号', value: item?.qualificationNo || '未填写', muted: !item?.qualificationNo, editor: 'text', optional: true },
        { key: 'validTo', label: '有效期', value: item?.validTo || '长期有效', muted: !item?.validTo, editor: 'date' },
      ],
    }
  })
}
