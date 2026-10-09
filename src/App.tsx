import { usePlanStore } from './store'
import './App.css'

function App() {
  const plans = usePlanStore((state) => state.plans)
  const focusedId = usePlanStore((state) => state.focusedId)
  const setFocus = usePlanStore((state) => state.setFocus)
  const planList = Object.values(plans).sort(
    (first, second) => Number(first.id) - Number(second.id),
  )

  return (
    <main className="planner">
      <header className="planner-header">
        <p className="eyebrow">Backup Plans</p>
        <h1>Your plans</h1>
        <p className="subtitle">A local-first list of the paths you are considering.</p>
      </header>

      <section className="plan-section" aria-labelledby="plan-list-heading">
        <div className="section-heading">
          <h2 id="plan-list-heading">All plans</h2>
          <span>{planList.length}</span>
        </div>

        {planList.length === 0 ? (
          <p className="empty-state">No plans yet.</p>
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
    </main>
  )
}

export default App
