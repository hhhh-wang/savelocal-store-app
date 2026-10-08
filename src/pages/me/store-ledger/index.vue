<script setup lang="ts">
import StoreLedgerForm from '@/components/store-ledger-form/store-ledger-form.vue'

definePage({ style: { navigationStyle: 'default', navigationBarTitleText: '商家收款开户' } })
const storeId = ref('')
onLoad((options) => {
  const id = options?.storeId
  if (typeof id === 'string' && /^[1-9]\d*$/.test(id))
    storeId.value = id
})
</script>

<template>
  <StoreLedgerForm v-if="storeId" :store-id="storeId" />
  <view v-else class="p-6">
    缺少有效门店信息，请从审核资料或结算账户进入。
  </view>
</template>
