export interface MerchantStoreDraftUser {
  username?: string
  nickname?: string
  mobile?: string
  phonenumber?: string
  contactMobile?: string
  merchantInfo?: {
    contactMobile?: string
  }
}

export function buildMerchantStoreDraft(userInfo: MerchantStoreDraftUser) {
  const contactName = userInfo.nickname?.trim()
    || userInfo.username?.trim()
    || '待完善联系人'
  const contactMobile = userInfo.mobile?.trim()
    || userInfo.phonenumber?.trim()
    || userInfo.contactMobile?.trim()
    || userInfo.merchantInfo?.contactMobile?.trim()
    || userInfo.username?.trim()
    || '待完善'

  return {
    storeName: '待完善门店',
    shortName: '待完善门店',
    contactName,
    contactMobile,
    addressDetail: '待完善',
    mainIndustryCode: 'CATERING',
  }
}
