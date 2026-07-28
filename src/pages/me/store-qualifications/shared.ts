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
  validTo?: string
  auditStatus?: string
}

export interface QualificationField {
  label: string
  value?: string
  required?: boolean
  toggle?: boolean
  toggleActive?: boolean
  muted?: boolean
}

export interface QualificationUpload {
  key: string
  title: string
  required?: boolean
}

export interface QualificationSection {
  id: string
  title: string
  required?: boolean
  statusText?: string
  showSectionWarn?: boolean
  uploads: QualificationUpload[]
  fields: QualificationField[]
}

export interface QualificationCatalog {
  templates: QualificationTemplate[]
  records: QualificationRecord[]
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

    return {
      id: type.qualificationCode,
      title: type.qualificationName,
      required,
      statusText,
      showSectionWarn: item?.auditStatus === '2',
      uploads: [{ key: type.qualificationCode, title: type.qualificationName, required }],
      fields: [
        { label: '证件编号', value: item?.qualificationNo || '未填写', muted: !item?.qualificationNo },
        { label: '有效期', value: item?.validTo || '长期有效', muted: !item?.validTo },
      ],
    }
  })
}
