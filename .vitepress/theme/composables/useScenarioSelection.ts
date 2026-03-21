import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { DemoScenarioMeta } from '../components/types'

export function useScenarioSelection<T extends { meta: DemoScenarioMeta }>(
  scenarios: Ref<T[]>,
  initialId?: string
) {
  const firstId = scenarios.value[0]?.meta.id ?? ''
  const currentId = ref<string>(initialId ?? firstId)

  const current = computed<T | undefined>(() =>
    scenarios.value.find(s => s.meta.id === currentId.value)
  )

  const currentIndex = computed(() =>
    scenarios.value.findIndex(s => s.meta.id === currentId.value)
  )

  function select(id: string) {
    if (scenarios.value.some(s => s.meta.id === id)) {
      currentId.value = id
    }
  }

  function reset() {
    currentId.value = initialId ?? scenarios.value[0]?.meta.id ?? ''
  }

  return { currentId, current, currentIndex, select, reset }
}
