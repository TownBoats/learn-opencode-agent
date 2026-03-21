import { ref, onUnmounted } from 'vue'
import type { DemoPlaybackStatus } from '../components/types'

export interface UseDemoPlayerOptions {
  steps: number
  intervalMs: number
  onStep: (step: number) => void
  onComplete?: () => void
}

export function useDemoPlayer(options: UseDemoPlayerOptions) {
  const status = ref<DemoPlaybackStatus>('idle')
  const currentStep = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const effectiveInterval = prefersReducedMotion ? 0 : options.intervalMs

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function play() {
    if (status.value === 'playing') return
    status.value = 'playing'

    if (prefersReducedMotion) {
      for (let i = currentStep.value; i < options.steps; i++) {
        options.onStep(i)
      }
      currentStep.value = options.steps - 1
      status.value = 'completed'
      options.onComplete?.()
      return
    }

    timer = setInterval(() => {
      if (currentStep.value >= options.steps - 1) {
        stop()
        status.value = 'completed'
        options.onComplete?.()
        return
      }
      currentStep.value++
      options.onStep(currentStep.value)
    }, effectiveInterval)
  }

  function pause() {
    if (status.value !== 'playing') return
    stop()
    status.value = 'paused'
  }

  function restart() {
    stop()
    currentStep.value = 0
    status.value = 'idle'
    options.onStep(0)
    play()
  }

  onUnmounted(() => stop())

  return { status, currentStep, play, pause, restart }
}
