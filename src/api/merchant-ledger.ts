import { httpGet, httpPost, httpPut } from '@/http/http'

export interface LedgerMaterials {
  /** 1对公资料开户，2法人对私资料开户。 */
  merchType: string
  /** 营业执照号码。 */
  licenseNumber: string
  /** 营业执照名称。 */
  licenseName: string
  /** 营业执照注册地址。 */
  licenseAddress: string
  /** 营业执照起始日期。 */
  licenseBeginDate: string
  /** 营业执照截止日期。 */
  licenseEndDate: string
  /** 营业执照图片文件标识。 */
  licenseFileId: string
  /** 法人姓名。 */
  legalName: string
  /** 法人身份证号，仅加密存储。 */
  legalNumber: string
  /** 身份证起始日期。 */
  legalBeginDate: string
  /** 身份证截止日期。 */
  legalEndDate: string
  /** 身份证正面文件标识。 */
  legalFrontFileId: string
  /** 身份证反面文件标识。 */
  legalBackFileId: string
  /** 法人手机号。 */
  mobile: string
  /** 结算银行卡号，仅加密存储。 */
  bankCardNo: string
  /** 结算户名。 */
  bankCardName: string
  /** 银行卡照片文件标识。 */
  bankFileId: string
  /** 总行代码。 */
  bankCode: string
  /** 总行名称。 */
  bankName: string
  /** 支行联行号。 */
  bankBranchCode: string
  /** 支行名称。 */
  bankBranchName: string
  /** 硕米与商家签署的分账合作协议图片标识，1至20张。 */
  agreementFileIds: string[]
}

export interface LedgerView {
  enabled: boolean
  initialAuditPassed: boolean
  profileApproved: boolean
  editable: boolean
  version: number
  state: string
  stateLabel: string
  lastError: string
  signLink: string
  materials: LedgerMaterials
}

export function emptyLedgerMaterials(): LedgerMaterials {
  return {
    merchType: '',
    licenseNumber: '',
    licenseName: '',
    licenseAddress: '',
    licenseBeginDate: '',
    licenseEndDate: '',
    licenseFileId: '',
    legalName: '',
    legalNumber: '',
    legalBeginDate: '',
    legalEndDate: '',
    legalFrontFileId: '',
    legalBackFileId: '',
    mobile: '',
    bankCardNo: '',
    bankCardName: '',
    bankFileId: '',
    bankCode: '',
    bankName: '',
    bankBranchCode: '',
    bankBranchName: '',
    agreementFileIds: [],
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** 校验服务端边界，缺失的可选字符串归一为空字符串。 */
function normalize(value: unknown): LedgerView {
  if (!record(value) || typeof value.state !== 'string' || typeof value.stateLabel !== 'string'
    || typeof value.version !== 'number' || !Number.isSafeInteger(value.version)) {
    throw new Error('收款信息格式无效，请稍后重试')
  }
  const materials = emptyLedgerMaterials()
  if (record(value.materials)) {
    const keys = ['merchType', 'licenseNumber', 'licenseName', 'licenseAddress', 'licenseBeginDate', 'licenseEndDate', 'licenseFileId', 'legalName', 'legalNumber', 'legalBeginDate', 'legalEndDate', 'legalFrontFileId', 'legalBackFileId', 'mobile', 'bankCardNo', 'bankCardName', 'bankFileId', 'bankCode', 'bankName', 'bankBranchCode', 'bankBranchName'] as const
    for (const key of keys) {
      const item = value.materials[key]
      if (typeof item === 'string')
        materials[key] = item
    }
    const agreements = value.materials.agreementFileIds
    if (Array.isArray(agreements))
      materials.agreementFileIds = agreements.filter((item): item is string => typeof item === 'string')
  }
  return {
    enabled: value.enabled === true,
    initialAuditPassed: value.initialAuditPassed === true,
    profileApproved: value.profileApproved === true,
    editable: value.editable === true,
    version: value.version,
    state: value.state,
    stateLabel: value.stateLabel,
    lastError: typeof value.lastError === 'string' ? value.lastError : '',
    signLink: typeof value.signLink === 'string' ? value.signLink : '',
    materials,
  }
}

const path = (storeId: string) => `/merchant/stores/${storeId}/ledger`

export async function getLedger(storeId: string): Promise<LedgerView> {
  return normalize(await httpGet<unknown>(path(storeId)))
}

export async function saveLedger(storeId: string, version: number, materials: LedgerMaterials, submit: boolean): Promise<LedgerView> {
  const body = { version, materials }
  return normalize(submit
    ? await httpPost<unknown>(`${path(storeId)}/submit`, body)
    : await httpPut<unknown>(`${path(storeId)}/materials`, body))
}

export async function refreshLedger(storeId: string): Promise<LedgerView> {
  return normalize(await httpPost<unknown>(`${path(storeId)}/refresh`))
}

/** 上传接口复用全局uploadFile认证拦截器；仅返回当前门店的私有附件标识。 */
export function uploadLedgerFile(storeId: string, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${path(storeId)}/files`,
      filePath,
      name: 'file',
      success: (response) => {
        try {
          const payload: unknown = JSON.parse(response.data)
          if (response.statusCode !== 200 || !record(payload) || payload.code !== 200
            || !record(payload.data) || typeof payload.data.fileId !== 'string') {
            throw new Error(record(payload) && typeof payload.msg === 'string' ? payload.msg : '附件上传失败')
          }
          resolve(payload.data.fileId)
        }
        catch (error) {
          reject(error)
        }
      },
      fail: error => reject(new Error(error.errMsg || '附件上传失败')),
    })
  })
}
