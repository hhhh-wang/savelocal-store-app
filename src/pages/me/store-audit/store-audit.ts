export type StoreAuditPrimaryAction = 'submit' | 'workbench'

export function resolveStoreAuditPrimaryAction(auditStatus: unknown): StoreAuditPrimaryAction {
  return String(auditStatus ?? '') === '2' ? 'workbench' : 'submit'
}
