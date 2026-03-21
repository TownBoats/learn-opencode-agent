import { computed } from 'vue'
import type { Ref } from 'vue'
import type { PlanTaskNode, DemoStepStatus } from '../components/types'

export interface FlatPlanTask {
  id: string
  title: string
  description: string
  status: DemoStepStatus
  priority: 'p0' | 'p1' | 'p2'
  estimatedTokens: number
  dependsOn: string[]
  depth: number
  parentId?: string
}

function flattenTasks(nodes: PlanTaskNode[], depth = 0, parentId?: string): FlatPlanTask[] {
  const result: FlatPlanTask[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      title: node.title,
      description: node.description,
      status: node.status,
      priority: node.priority,
      estimatedTokens: node.estimatedTokens,
      dependsOn: node.dependsOn,
      depth,
      parentId,
    })
    if (node.children?.length) {
      result.push(...flattenTasks(node.children, depth + 1, node.id))
    }
  }
  return result
}

export function useDependencyGraph(tasks: Ref<PlanTaskNode[]>) {
  const flatTasks = computed(() => flattenTasks(tasks.value))

  const doneIds = computed(() => new Set(flatTasks.value.filter(t => t.status === 'done').map(t => t.id)))

  const readyTasks = computed(() =>
    flatTasks.value.filter(
      t => t.status === 'pending' && t.dependsOn.every(dep => doneIds.value.has(dep))
    )
  )

  const blockedTasks = computed(() =>
    flatTasks.value.filter(
      t => t.status === 'pending' && !readyTasks.value.some(r => r.id === t.id)
    )
  )

  const activeTasks = computed(() => flatTasks.value.filter(t => t.status === 'active'))

  const doneTasks = computed(() => flatTasks.value.filter(t => t.status === 'done'))

  function canStart(taskId: string): boolean {
    const task = flatTasks.value.find(t => t.id === taskId)
    if (!task) return false
    return task.status === 'pending' && task.dependsOn.every(dep => doneIds.value.has(dep))
  }

  return { flatTasks, readyTasks, blockedTasks, activeTasks, doneTasks, canStart }
}
