<script lang="ts" setup>
defineOptions({
  name: 'MarketingActivityPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '营销活动',
  },
})

type ActivityType = 'new-customer' | 'full-reduction'

interface MarketingActivity {
  type: ActivityType
  title: string
  description: string
  icon: string
}

const fallbackUrl = '/pages/dashboard/index'

const activities: MarketingActivity[] = [
  {
    type: 'new-customer',
    title: '新客立减',
    description: '针对新用户首单设置立减优惠',
    icon: 'i-carbon-ticket',
  },
  {
    type: 'full-reduction',
    title: '满减活动',
    description: '订单满足金额后自动减免',
    icon: 'i-carbon-task-complete',
  },
]

function handleActivityTap(activity: MarketingActivity) {
  const title = activity.type === 'new-customer' ? '新客立减活动' : '满减活动'
  uni.showToast({ title: `${title}暂未开放`, icon: 'none' })
}
</script>

<template>
  <view class="marketing-activity-page">
    <view class="marketing-activity-page__content">
      <view class="marketing-activity-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="reLaunch"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="marketing-activity-nav__title">
          营销活动
        </text>

        <view class="marketing-activity-nav__spacer" />
      </view>

      <view class="marketing-activity-list">
        <view
          v-for="activity in activities"
          :key="activity.type"
          class="marketing-activity-card"
          hover-class="marketing-activity-card--hover"
          @tap="handleActivityTap(activity)"
        >
          <view class="marketing-activity-card__icon-wrap">
            <view class="marketing-activity-card__icon" :class="activity.icon" />
          </view>

          <view class="marketing-activity-card__copy">
            <text class="marketing-activity-card__title">
              {{ activity.title }}
            </text>
            <text class="marketing-activity-card__description">
              {{ activity.description }}
            </text>
          </view>

          <view class="marketing-activity-card__arrow i-carbon-chevron-right" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.marketing-activity-page {
  min-height: 100vh;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #22252b;
}

.marketing-activity-page__content {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 52rpx calc(env(safe-area-inset-bottom) + 72rpx);
}

.marketing-activity-nav {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) 72rpx;
  align-items: center;
  min-height: 72rpx;
}

.marketing-activity-nav__title {
  color: #202226;
  font-size: 44rpx;
  font-weight: 500;
  line-height: 1.25;
  text-align: center;
}

.marketing-activity-nav__spacer {
  width: 72rpx;
  height: 72rpx;
}

.marketing-activity-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  margin-top: 94rpx;
}

.marketing-activity-card {
  display: flex;
  min-height: 200rpx;
  align-items: center;
  gap: 38rpx;
  padding: 15rpx 20rpx 15rpx 34rpx;
  box-sizing: border-box;
  border-radius: 54rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(68, 73, 85, 0.03);
}

.marketing-activity-card--hover {
  opacity: 0.82;
}

.marketing-activity-card__icon-wrap {
  display: flex;
  width: 100rpx;
  height: 100rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fffef0;
}

.marketing-activity-card__icon {
  color: #f47718;
  font-size: 112rpx;
}

.marketing-activity-card__copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 26rpx;
}

.marketing-activity-card__title {
  color: #111318;
  font-size: 35rpx;
  font-weight: 600;
  line-height: 1.15;
}

.marketing-activity-card__description {
  overflow: hidden;
  color: #56585d;
  font-size: 31rpx;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.marketing-activity-card__arrow {
  display: flex;
  width: 96rpx;
  height: 96rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ff751a;
  color: #fff;
  font-size: 54rpx;
}

@media (max-width: 700rpx) {
  .marketing-activity-page__content {
    padding-right: 28rpx;
    padding-left: 28rpx;
  }

  .marketing-activity-list {
    margin-top: 76rpx;
  }

  .marketing-activity-card {
    min-height: 248rpx;
    gap: 22rpx;
    padding: 24rpx 26rpx 24rpx 22rpx;
    border-radius: 42rpx;
  }

  .marketing-activity-card__icon-wrap {
    width: 156rpx;
    height: 156rpx;
  }

  .marketing-activity-card__icon {
    font-size: 82rpx;
  }

  .marketing-activity-card__copy {
    gap: 16rpx;
  }

  .marketing-activity-card__title {
    font-size: 39rpx;
  }

  .marketing-activity-card__description {
    font-size: 25rpx;
  }

  .marketing-activity-card__arrow {
    width: 74rpx;
    height: 74rpx;
    font-size: 42rpx;
  }
}
</style>
