import { useState } from 'react'
import { DeletePlanDialog } from './components/DeletePlanDialog'
import { EditPlanDialog } from './components/EditPlanDialog'
import { FocusGraph } from './components/FocusGraph'
import { KeyboardShortcutsDialog } from './components/KeyboardShortcutsDialog'
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
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [newPlanParents, setNewPlanParents] = useState<string[]>([])
  const [navigationMode, setNavigationMode] = useState<'graph' | 'list'>('graph')
  const [listIndex, setListIndex] = useState(0)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [candidateSide, setCandidateSide] = useState<NavigationSide | null>(null)
  const plans = usePlanStore((state) => state.plans)
  const focusedId = usePlanStore((state) => state.focusedId)
  const setFocus = usePlanStore((state) => state.setFocus)
  const deletePlan = usePlanStore((state) => state.deletePlan)
  const planList = Object.values(plans).sort(
    (first, second) => Number(first.id) - Number(second.id),
  )
  const parentPlans = focusedId ? getParents(plans, focusedId) : []
  const childPlans = focusedId ? getChildren(plans, focusedId) : []
  const focusedPlan = focusedId ? plans[focusedId] : undefined
  const isOverlayOpen =
    isDialogOpen || isSearchOpen || isEditOpen || isDeleteOpen || isShortcutsOpen

  function focusPlan(id: string): void {
    setFocus(id)
    setCandidateId(null)
    setCandidateSide(null)
  }

  function openNewPlan(parentIds: string[] = []): void {
    setIsSearchOpen(false)
    setIsEditOpen(false)
    setIsDeleteOpen(false)
    setIsShortcutsOpen(false)
    setNewPlanParents(parentIds)
    setIsDialogOpen(true)
  }

  function closeNewPlan(): void {
    setIsDialogOpen(false)
    setNewPlanParents([])
  }

  function openSearch(): void {
    setIsDialogOpen(false)
    setIsEditOpen(false)
    setIsDeleteOpen(false)
    setIsShortcutsOpen(false)
    setIsSearchOpen(true)
  }

  function enterListMode(): void {
    setNavigationMode('list')
    const focusedIndex = focusedId
      ? planList.findIndex((plan) => plan.id === focusedId)
      : -1
    setListIndex(focusedIndex >= 0 ? focusedIndex : 0)
  }

  function openShortcuts(): void {
    setIsDialogOpen(false)
    setIsSearchOpen(false)
    setIsEditOpen(false)
    setIsDeleteOpen(false)
    setIsShortcutsOpen(true)
  }

  function openEditPlan(): void {
    if (focusedPlan) {
      setIsEditOpen(true)
    }
  }

  function openDeletePlan(): void {
    if (focusedPlan) {
      setIsDeleteOpen(true)
    }
  }

  function openEditForPlan(id: string): void {
    focusPlan(id)
    setIsEditOpen(true)
  }

  function createChildFromPlan(id: string): void {
    openNewPlan([id])
  }

  function moveListSelection(step: number): void {
    if (planList.length === 0) {
      return
    }

    const nextIndex = Math.min(
      planList.length - 1,
      Math.max(0, listIndex + step),
    )
    const nextPlan = planList[nextIndex]

    setListIndex(nextIndex)
    focusPlan(nextPlan.id)
  }

  function requestDeleteFromEdit(): void {
    setIsEditOpen(false)
    setIsDeleteOpen(true)
  }

  function confirmDeletePlan(): void {
    if (focusedId) {
      deletePlan(focusedId)
    }
    setIsDeleteOpen(false)
    setCandidateId(null)
    setCandidateSide(null)
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
    n: () => openNewPlan(),
    c: () => {
      if (!isOverlayOpen && focusedId) {
        createChildFromPlan(focusedId)
      }
    },
    '/': openSearch,
    '?': () => {
      if (!isOverlayOpen) {
        openShortcuts()
      }
    },
    e: () => {
      if (!isOverlayOpen) {
        openEditPlan()
      }
    },
    d: () => {
      if (!isOverlayOpen) {
        openDeletePlan()
      }
    },
    Delete: () => {
      if (!isOverlayOpen) {
        openDeletePlan()
      }
    },
    ArrowLeft: () => {
      if (!isOverlayOpen) {
        chooseSide('parents')
      }
    },
    ArrowRight: () => {
      if (!isOverlayOpen) {
        chooseSide('children')
      }
    },
    ArrowUp: () => {
      if (!isOverlayOpen) {
        if (navigationMode === 'list') {
          moveListSelection(-1)
        } else {
          moveCandidate(-1)
        }
      }
    },
    ArrowDown: () => {
      if (!isOverlayOpen) {
        if (navigationMode === 'list') {
          moveListSelection(1)
        } else {
          moveCandidate(1)
        }
      }
    },
    Enter: () => {
      if (!isOverlayOpen) {
        if (navigationMode === 'list') {
          const selectedPlan = planList[listIndex]

          if (selectedPlan) {
            focusPlan(selectedPlan.id)
          }
        } else {
          confirmCandidate()
        }
      }
    },
    Escape: () => {
      setIsDialogOpen(false)
      setIsSearchOpen(false)
      setIsEditOpen(false)
      setIsDeleteOpen(false)
      setIsShortcutsOpen(false)
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
            <button
              type="button"
              className="icon-button"
              onClick={openShortcuts}
              aria-label="Show keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              ?
            </button>
            <button type="button" className="secondary-button header-button" onClick={openSearch}>
              Search
            </button>
            <button type="button" className="primary-button header-button" onClick={() => openNewPlan()}>
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
          showShortcuts={isShortcutsOpen}
          onOpenShortcuts={openShortcuts}
          onCloseShortcuts={() => setIsShortcutsOpen(false)}
          onNavigationMode={() => setNavigationMode('graph')}
          onCreateChild={createChildFromPlan}
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
          <ul
            className="plan-list"
            tabIndex={0}
            onFocus={enterListMode}
            aria-label="All plans"
          >
            {planList.map((plan) => (
              <li key={plan.id}>
                <div className="plan-row">
                  <button
                    type="button"
                    className={
                      plan.id === focusedId && plan.id === planList[listIndex]?.id
                        ? 'plan focused list-selected'
                        : plan.id === focusedId
                          ? 'plan focused'
                          : plan.id === planList[listIndex]?.id
                            ? 'plan list-selected'
                            : 'plan'
                    }
                    onClick={() => openEditForPlan(plan.id)}
                  >
                    <span className="plan-id">#{plan.id}</span>
                    <span className="plan-content">
                      <span>{plan.title}</span>
                      {plan.notes && <span className="plan-notes">{plan.notes}</span>}
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isDialogOpen && (
        <NewPlanDialog
          initialParents={newPlanParents}
          onClose={closeNewPlan}
        />
      )}
      {isEditOpen && focusedPlan && (
        <EditPlanDialog
          plan={focusedPlan}
          onClose={() => setIsEditOpen(false)}
          onDelete={requestDeleteFromEdit}
          onEditChild={openEditForPlan}
          onCreateChild={createChildFromPlan}
        />
      )}
      {isDeleteOpen && focusedPlan && (
        <DeletePlanDialog
          planTitle={focusedPlan.title}
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={confirmDeletePlan}
        />
      )}
      {isShortcutsOpen && !focusedId && (
        <KeyboardShortcutsDialog onClose={() => setIsShortcutsOpen(false)} />
      )}
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
