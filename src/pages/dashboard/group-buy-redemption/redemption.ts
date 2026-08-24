export const GROUP_BUY_REDEMPTION_PATH = '/pages/dashboard/group-buy-redemption/index'
export const GROUP_BUY_VOUCHER_LENGTH = 9

export function sanitizeVoucherInput(value: unknown) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, GROUP_BUY_VOUCHER_LENGTH)
}

export function parseScannedVoucher(value: unknown) {
  const content = String(value ?? '').trim()
  return /^\d{9}$/.test(content) ? content : ''
}

export function validateVoucherCode(value: string) {
  if (!value)
    return '请输入核销码'
  if (!/^\d{9}$/.test(value))
    return '请输入9位数字核销码'
  return undefined
}

export function formatVoucherCode(value: string) {
  return value.replace(/(\d{3})(?=\d)/g, '$1 ')
}
