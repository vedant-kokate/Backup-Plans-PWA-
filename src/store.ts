import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Plan } from './types'

interface PlanStore {
  plans: Record<string, Plan>
  nextId: number
  focusedId: string | null
  addPlan: (title: string, parents: string[], notes?: string) => string
  updatePlan: (id: string, patch: Partial<Omit<Plan, 'id'>>) => void
  deletePlan: (id: string) => void
  setFocus: (id: string | null) => void
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      plans: {},
      nextId: 1,
      focusedId: null,
      addPlan: (title, parents, notes = '') => {
        const id = String(get().nextId)
        const plan: Plan = { id, title, notes, parents: [...parents] }

        set((state) => ({
          plans: { ...state.plans, [id]: plan },
          nextId: state.nextId + 1,
          focusedId: id,
        }))

        return id
      },
      updatePlan: (id, patch) => {
        set((state) => {
          const plan = state.plans[id]

          if (!plan) {
            return state
          }

          return {
            plans: { ...state.plans, [id]: { ...plan, ...patch } },
          }
        })
      },
      deletePlan: (id) => {
        set((state) => {
          if (!state.plans[id]) {
            return state
          }

          const remainingPlans = { ...state.plans }
          delete remainingPlans[id]
          const plans = Object.fromEntries(
            Object.entries(remainingPlans).map(([planId, plan]) => [
              planId,
              { ...plan, parents: plan.parents.filter((parentId) => parentId !== id) },
            ]),
          )

          return {
            plans,
            focusedId: state.focusedId === id ? null : state.focusedId,
          }
        })
      },
      setFocus: (id) => {
        set((state) => ({
          focusedId: id !== null && state.plans[id] ? id : null,
        }))
      },
    }),
    { name: 'backup-plans' },
  ),
)
