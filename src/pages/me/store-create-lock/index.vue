<script setup lang="ts">
import StoreCreateLock from '@/components/store-create-lock/store-create-lock.vue'
import { buildAuditPagePath, defaultAuditPagePath } from './shared'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '开新店',
  },
})

const auditPagePath = ref(defaultAuditPagePath)

onLoad((options) => {
  const encodedAuditPath = typeof options?.auditPath === 'string' ? options.auditPath : ''
  if (encodedAuditPath) {
    try {
      auditPagePath.value = decodeURIComponent(encodedAuditPath)
    }
    catch {
      auditPagePath.value = encodedAuditPath
    }
    return
  }

  const storeId = Number(options?.storeId)
  if (Number.isFinite(storeId) && storeId > 0) {
    auditPagePath.value = buildAuditPagePath(storeId)
  }
})
</script>

<template>
  <store-create-lock :audit-page-path="auditPagePath" />
</template>
