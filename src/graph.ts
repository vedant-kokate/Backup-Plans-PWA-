import type { Plan } from './types'

export type Plans = Record<string, Plan>

export function getChildren(plans: Plans, id: string): Plan[] {
  return Object.values(plans).filter((plan) => plan.parents.includes(id))
}

export function getParents(plans: Plans, id: string): Plan[] {
  return (plans[id]?.parents ?? [])
    .map((parentId) => plans[parentId])
    .filter((plan): plan is Plan => plan !== undefined)
}

export function wouldCreateCycle(
  plans: Plans,
  childId: string,
  parentId: string,
): boolean {
  if (childId === parentId) {
    return true
  }

  const visited = new Set<string>()
  const pending = [parentId]

  while (pending.length > 0) {
    const currentId = pending.pop()

    if (currentId === undefined || visited.has(currentId)) {
      continue
    }

    if (currentId === childId) {
      return true
    }

    visited.add(currentId)
    pending.push(...(plans[currentId]?.parents ?? []))
  }

  return false
}
