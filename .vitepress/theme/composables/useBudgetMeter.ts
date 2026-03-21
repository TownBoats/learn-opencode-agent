import { computed } from 'vue'
import type { Ref } from 'vue'
import type { DemoBudget, DemoTone } from '../components/types'

export function useBudgetMeter(budget: Ref<DemoBudget>) {
  const ratio = computed(() => budget.value.used / budget.value.total)

  const reservedRatio = computed(() =>
    budget.value.reserved !== undefined ? budget.value.reserved / budget.value.total : 0
  )

  const tone = computed((): DemoTone => {
    const r = ratio.value
    const danger = budget.value.dangerAt ?? 0.9
    const warning = budget.value.warningAt ?? 0.7
    if (r >= danger) return 'danger'
    if (r >= warning) return 'warning'
    return 'neutral'
  })

  const label = computed(() => {
    const used = budget.value.used.toLocaleString()
    const total = budget.value.total.toLocaleString()
    return `${used} / ${total}`
  })

  const percent = computed(() => Math.min(100, Math.round(ratio.value * 100)))

  return { ratio, reservedRatio, tone, label, percent }
}
