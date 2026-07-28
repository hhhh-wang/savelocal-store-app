import type { MerchantFoodStore, MerchantFoodStoreProfile } from '@/api/types/merchant-food'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMerchantFoodStoreProfile, getMerchantFoodStores } from '@/api/merchant-food'

export const useMerchantFoodStore = defineStore(
  'merchant-food',
  () => {
    const stores = ref<MerchantFoodStore[]>([])
    const currentStoreId = ref<number>()
    const profile = ref<MerchantFoodStoreProfile>()
    const loading = ref(false)

    const currentStore = computed(() => {
      return stores.value.find(store => store.storeId === currentStoreId.value)
        ?? profile.value?.store
    })

    function selectStore(storeId: number) {
      if (currentStoreId.value !== storeId) {
        currentStoreId.value = storeId
        profile.value = undefined
      }
    }

    async function loadStores() {
      loading.value = true
      try {
        stores.value = await getMerchantFoodStores()
        const selectedExists = stores.value.some(store => store.storeId === currentStoreId.value)
        if (!selectedExists) {
          currentStoreId.value = stores.value[0]?.storeId
        }
        return stores.value
      }
      finally {
        loading.value = false
      }
    }

    async function ensureCurrentStoreId() {
      if (!currentStoreId.value) {
        await loadStores()
      }
      if (!currentStoreId.value) {
        throw new Error('当前账号没有可管理的餐饮门店')
      }
      return currentStoreId.value
    }

    async function loadProfile(force = false) {
      const storeId = await ensureCurrentStoreId()
      if (!force && profile.value?.store.storeId === storeId) {
        return profile.value
      }
      loading.value = true
      try {
        profile.value = await getMerchantFoodStoreProfile(storeId)
        const index = stores.value.findIndex(store => store.storeId === storeId)
        if (index >= 0) {
          stores.value[index] = profile.value.store
        }
        return profile.value
      }
      finally {
        loading.value = false
      }
    }

    function reset() {
      stores.value = []
      currentStoreId.value = undefined
      profile.value = undefined
    }

    return {
      stores,
      currentStoreId,
      profile,
      loading,
      currentStore,
      selectStore,
      loadStores,
      ensureCurrentStoreId,
      loadProfile,
      reset,
    }
  },
  {
    persist: {
      paths: ['currentStoreId'],
    },
  },
)
