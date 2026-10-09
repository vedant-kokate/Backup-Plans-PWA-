import { useState } from 'react'
import { FocusGraph } from './components/FocusGraph'
import { NewPlanDialog } from './components/NewPlanDialog'
import { SearchPalette } from './components/SearchPalette'
import { getChildren, getParents } from './graph'
import { useHotkeys } from './hooks/useHotkeys'
import { usePlanStore } from './store'
import './App.css'

type NavigationSide = 'parents' | 'children'

function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [candidateSide, setCandidateSide] = useState<NavigationSide | null>(null)
  const plans = usePlanStore((state) => state.plans)
  const focusedId = usePlanStore((state) => state.focusedId)
  const setFocus = usePlanStore((state) => state.setFocus)
  const planList = Object.values(plans).sort(
    (first, second) => Number(first.id) - Number(second.id),
  )
  const parentPlans = focusedId ? getParents(plans, focusedId) : []
  const childPlans = focusedId ? getChildren(plans, focusedId) : []

  function focusPlan(id: string): void {
    setFocus(id)
    setCandidateId(null)
    setCandidateSide(null)
  }

  function openNewPlan(): void {
    setIsSearchOpen(false)
    setIsDialogOpen(true)
  }

  function openSearch(): void {
    setIsDialogOpen(false)
    setIsSearchOpen(true)
  }

  function getCandidates(side: NavigationSide) {
    return side === 'parents' ? parentPlans : childPlans
  }

  function chooseSide(side: NavigationSide): void {
    const candidates = getCandidates(side)

    if (candidates.length === 0) {
      return
    }

    if (candidates.length === 1) {
      focusPlan(candidates[0].id)
      return
    }

    setCandidateSide(side)
    setCandidateId((currentId) =>
      currentId && candidates.some((candidate) => candidate.id === currentId)
        ? currentId
        : candidates[0].id,
    )
  }

  function moveCandidate(step: number): void {
    let side = candidateSide

    if (!side) {
      if (parentPlans.length > 1) {
        side = 'parents'
      } else if (childPlans.length > 1) {
        side = 'children'
      } else if (parentPlans.length === 1) {
        focusPlan(parentPlans[0].id)
        return
      } else if (childPlans.length === 1) {
        focusPlan(childPlans[0].id)
        return
      } else {
        return
      }
    }

    const candidates = getCandidates(side)

    if (candidates.length === 0) {
      return
    }

    if (candidates.length === 1) {
      focusPlan(candidates[0].id)
      return
    }

    const currentIndex = candidateId
      ? candidates.findIndex((candidate) => candidate.id === candidateId)
      : step > 0
        ? -1
        : 0
    const nextIndex = (currentIndex + step + candidates.length) % candidates.length

    setCandidateSide(side)
    setCandidateId(candidates[nextIndex].id)
  }

  function confirmCandidate(): void {
    if (candidateId) {
      focusPlan(candidateId)
    }
  }

  useHotkeys({
    n: openNewPlan,
    '/': openSearch,
    'mod+k': openSearch,
    ArrowLeft: () => {
      if (!isDialogOpen && !isSearchOpen) {
        chooseSide('parents')
      }
    },
    ArrowRight: () => {
      if (!isDialogOpen && !isSearchOpen) {
        chooseSide('children')
      }
    },
    ArrowUp: () => {
      if (!isDialogOpen && !isSearchOpen) {
        moveCandidate(-1)
      }
    },
    ArrowDown: () => {
      if (!isDialogOpen && !isSearchOpen) {
        moveCandidate(1)
      }
    },
    Enter: () => {
      if (!isDialogOpen && !isSearchOpen) {
        confirmCandidate()
      }
    },
    Escape: () => {
      setIsDialogOpen(false)
      setIsSearchOpen(false)
    },
  })

  return (
    <main className="planner">
      <header className="planner-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Backup Plans</p>
            <h1>Your plans</h1>
          </div>
          <div className="header-actions">
            <button type="button" className="secondary-button header-button" onClick={openSearch}>
              Search
            </button>
            <button type="button" className="primary-button header-button" onClick={openNewPlan}>
              New plan
            </button>
          </div>
        </div>
        <p className="subtitle">A local-first list of the paths you are considering.</p>
      </header>

      <section className="graph-section" aria-labelledby="graph-heading">
        <div className="section-heading">
          <h2 id="graph-heading">Focused path</h2>
        </div>
        <FocusGraph
          plans={plans}
          focusedId={focusedId}
          highlightedId={candidateId}
          onFocus={focusPlan}
        />
      </section>

      <section className="plan-section" aria-labelledby="plan-list-heading">
        <div className="section-heading">
          <h2 id="plan-list-heading">All plans</h2>
          <span>{planList.length}</span>
        </div>

        {planList.length === 0 ? (
          <p className="empty-state">No plans yet. Press n to create one.</p>
        ) : (
          <ul className="plan-list">
            {planList.map((plan) => (
              <li key={plan.id}>
                <button
                  type="button"
                  className={plan.id === focusedId ? 'plan focused' : 'plan'}
                  onClick={() => focusPlan(plan.id)}
                >
                  <span className="plan-id">#{plan.id}</span>
                  <span>{plan.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isDialogOpen && <NewPlanDialog onClose={() => setIsDialogOpen(false)} />}
      {isSearchOpen && (
        <SearchPalette
          plans={planList}
          onClose={() => setIsSearchOpen(false)}
          onSelect={(plan) => {
            focusPlan(plan.id)
            setIsSearchOpen(false)
          }}
        />
      )}
    </main>
  )
}

export default App
