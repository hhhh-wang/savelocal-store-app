<script setup lang="ts">
import defaultMarkerIcon from '@/static/icons/map-marker.svg'

interface MapMarkerLike {
  id: number
  latitude: number
  longitude: number
  iconPath: string
  width?: number
  height?: number
  [key: string]: any
}

interface Props {
  latitude: number
  longitude: number
  markers?: MapMarkerLike[]
  scale?: number
  height?: string
  borderRadius?: string
  background?: string
  enablePoi?: boolean
  enableScroll?: boolean
  enableZoom?: boolean
  showLocation?: boolean
  markerIconPath?: string
  markerWidth?: number
  markerHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  markers: () => [],
  scale: 14,
  height: '260rpx',
  borderRadius: '20rpx',
  background: '#edf5fb',
  enablePoi: true,
  enableScroll: true,
  enableZoom: true,
  showLocation: false,
  markerIconPath: defaultMarkerIcon,
  markerWidth: 34,
  markerHeight: 40,
})

const resolvedMarkers = computed(() => {
  if (props.markers.length) {
    return props.markers
  }

  return [
    {
      id: 1,
      latitude: props.latitude,
      longitude: props.longitude,
      iconPath: props.markerIconPath,
      width: props.markerWidth,
      height: props.markerHeight,
    },
  ]
})
</script>

<template>
  <view
    class="fg-tencent-map"
    :style="{
      height: props.height,
      borderRadius: props.borderRadius,
      background: props.background,
    }"
  >
    <map
      class="fg-tencent-map__inner"
      :latitude="props.latitude"
      :longitude="props.longitude"
      :markers="resolvedMarkers"
      :scale="props.scale"
      :enable-poi="props.enablePoi"
      :enable-scroll="props.enableScroll"
      :enable-zoom="props.enableZoom"
      :show-location="props.showLocation"
    />
  </view>
</template>

<style scoped>
.fg-tencent-map {
  position: relative;
  overflow: hidden;
  width: 100%;
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.75);
}

.fg-tencent-map__inner {
  width: 100%;
  height: 100%;
}
</style>
