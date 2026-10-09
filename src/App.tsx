import { useState } from 'react'
import { FocusGraph } from './components/FocusGraph'
import { NewPlanDialog } from './components/NewPlanDialog'
import { SearchPalette } from './components/SearchPalette'
import { useHotkeys } from './hooks/useHotkeys'
import { usePlanStore } from './store'
import './App.css'

function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const plans = usePlanStore((state) => state.plans)
  const focusedId = usePlanStore((state) => state.focusedId)
  const setFocus = usePlanStore((state) => state.setFocus)
  const planList = Object.values(plans).sort(
    (first, second) => Number(first.id) - Number(second.id),
  )

  function openNewPlan(): void {
    setIsSearchOpen(false)
    setIsDialogOpen(true)
  }

  function openSearch(): void {
    setIsDialogOpen(false)
    setIsSearchOpen(true)
  }

  useHotkeys({
    n: openNewPlan,
    '/': openSearch,
    'mod+k': openSearch,
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
        <FocusGraph plans={plans} focusedId={focusedId} onFocus={setFocus} />
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
                  onClick={() => setFocus(plan.id)}
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
            setFocus(plan.id)
            setIsSearchOpen(false)
          }}
        />
      )}
    </main>
  )
}

export default App
