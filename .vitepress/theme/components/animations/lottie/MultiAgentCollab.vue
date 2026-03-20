<template>
  <AnimationContainer title="多 Agent 协作流程" @restart="handleRestart">
    <template #default="{ isVisible }">
      <LottiePlayer
        ref="playerRef"
        :animation-data="animationData"
        :autoplay="isVisible"
        :loop="false"
        @complete="handleComplete"
      />
    </template>
  </AnimationContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AnimationContainer from '../core/AnimationContainer.vue'
import LottiePlayer from '../core/LottiePlayer.vue'
import animationData from './assets/multi-agent-collab.json'

const playerRef = ref<InstanceType<typeof LottiePlayer> | null>(null)

function handleRestart() {
  playerRef.value?.restart()
}

function handleComplete() {
  console.log('Multi-agent animation completed')
}
</script>
