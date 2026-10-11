import { httpGet, httpPost } from '@/http/http'

export interface LedgerView {
  version: number
  accountVersion: number
  state: string
  stateLabel: string
  lastError: string
  account: {
    accountId: string
    receiverMchId: string
    merchType: string
    subjectName: string
    legalName: string
    licenseNumberMasked: string
    legalNumberMasked: string
    applyStatus: string
    accountState: string
    subjectVerified: boolean
    version: number
  }
  binding: { bindingId: string, bindingState: string, bindingStatus: string, lastError: string }
  settlement: {
    bankCardName: string
    bankCardNoMasked: string
    bankTail: string
    bankCode: string
    bankName: string
    bankBranchCode: string
    bankBranchName: string
    source: string
    verifiedAt: string
  }
  control: { controlStatus: string, maintenance: boolean, storeCount: number }
  sync: { lastSyncTime: string, accountSyncTime: string, bindingSyncTime: string, queryStatus: string, message: string }
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
function version(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error('账户版本格式无效，请刷新重试')
  return value
}

/** 仅接收独立账户、绑定和结算快照，不再解析进件或附件模型。 */
function normalize(value: unknown): LedgerView {
  if (!record(value) || typeof value.state !== 'string' || typeof value.stateLabel !== 'string'
    || !record(value.account) || !record(value.binding) || !record(value.settlement)
    || !record(value.control) || !record(value.sync)) {
    throw new Error('账户信息格式无效，请稍后重试')
  }
  const { account, binding, settlement, control, sync } = value
  return {
    version: version(value.version),
    accountVersion: version(value.accountVersion),
    state: value.state,
    stateLabel: value.stateLabel,
    lastError: text(value.lastError),
    account: {
      accountId: text(account.accountId),
      receiverMchId: text(account.receiverMchId),
      merchType: text(account.merchType),
      subjectName: text(account.subjectName),
      legalName: text(account.legalName),
      licenseNumberMasked: text(account.licenseNumberMasked),
      legalNumberMasked: text(account.legalNumberMasked),
      applyStatus: text(account.applyStatus),
      accountState: text(account.accountState),
      subjectVerified: account.subjectVerified === true,
      version: version(account.version),
    },
    binding: {
      bindingId: text(binding.bindingId),
      bindingState: text(binding.bindingState),
      bindingStatus: text(binding.bindingStatus),
      lastError: text(binding.lastError),
    },
    settlement: {
      bankCardName: text(settlement.bankCardName),
      bankCardNoMasked: text(settlement.bankCardNoMasked),
      bankTail: text(settlement.bankTail),
      bankCode: text(settlement.bankCode),
      bankName: text(settlement.bankName),
      bankBranchCode: text(settlement.bankBranchCode),
      bankBranchName: text(settlement.bankBranchName),
      source: text(settlement.source),
      verifiedAt: text(settlement.verifiedAt),
    },
    control: {
      controlStatus: text(control.controlStatus),
      maintenance: control.maintenance === true,
      storeCount: version(control.storeCount),
    },
    sync: {
      lastSyncTime: text(sync.lastSyncTime),
      accountSyncTime: text(sync.accountSyncTime),
      bindingSyncTime: text(sync.bindingSyncTime),
      queryStatus: text(sync.queryStatus),
      message: text(sync.message),
    },
  }
}

export function ledgerBindingLabel(state: string): string {
  const labels: Record<string, string> = {
    UNVERIFIED: '待核对',
    UNBOUND: '尚未绑定，请联系业务人员',
    BINDING: '渠道审核中',
    BIND_FAILED: '审核未通过，请联系业务人员',
    BOUND: '已绑定',
  }
  return labels[state] || '尚未查询'
}

export function ledgerAccountType(value: string): string {
  const labels: Record<string, string> = { 1: '企业对公', 2: '法人对私', 3: '普通商户账户' }
  return labels[value] || '渠道未返回'
}

export function ledgerContactGuide() {
  uni.showModal({
    title: '联系业务人员',
    content: '如需办理分账关系或变更结算银行卡，请联系为门店办理入驻的业务人员。人工办理完成后，返回此页刷新账户信息。',
    showCancel: false,
    confirmText: '我知道了',
  })
}

const path = (storeId: string) => `/merchant/stores/${storeId}/ledger`

export async function getLedger(storeId: string): Promise<LedgerView> {
  return normalize(await httpGet<unknown>(path(storeId)))
}
export async function refreshLedger(storeId: string): Promise<LedgerView> {
  return normalize(await httpPost<unknown>(`${path(storeId)}/refresh`))
}
