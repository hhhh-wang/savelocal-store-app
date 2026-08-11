export interface StoreInfoFooterAction {
  label: string
  action: 'submit' | 'edit'
  auditPagePath: string
}

export interface StoreInfoAuditDraftSummary {
  auditType?: string
  auditStatus?: string
  auditSummary?: string | null
  auditIssues?: Array<{ message?: string | null }>
}

export interface StoreInfoAuditNotice {
  status: 'rejected' | 'pending'
  title: string
  detail: string
}

export function resolveStoreInfoFooterAction(
  isCreateMode: boolean,
  auditStatus?: string,
): StoreInfoFooterAction {
  const status = String(auditStatus ?? '')
  return {
    label: isCreateMode
      ? '填写审核资料'
      : status === '3'
        ? '提交变更资料审核'
        : status === '1'
          ? '资料审核中'
          : '提交变更资料审核',
    action: isCreateMode ? 'edit' : 'submit',
    auditPagePath: '/pages/me/store-audit/index',
  }
}

export function resolveStoreInfoAuditNotice(
  draft?: StoreInfoAuditDraftSummary,
): StoreInfoAuditNotice | undefined {
  if (draft?.auditType !== 'PROFILE_CHANGE') {
    return undefined
  }

  const status = String(draft.auditStatus ?? '')
  if (status === '1') {
    return {
      status: 'pending',
      title: '资料变更审核中',
      detail: '资料已提交，审核期间暂不可修改',
    }
  }

  if (status !== '3') {
    return undefined
  }

  const summary = draft.auditSummary?.trim()
  const issues = (draft.auditIssues || [])
    .map(issue => issue.message?.trim() || '')
    .filter(Boolean)
  return {
    status: 'rejected',
    title: '资料变更审核已驳回',
    detail: summary || issues.join('；') || '请按审核问题修改资料后重新提交',
  }
}
