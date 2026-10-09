import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import type { Plan } from '../types'

interface SearchPaletteProps {
  plans: Plan[]
  onSelect: (plan: Plan) => void
  onClose: () => void
  exclude?: string[]
}

export function SearchPalette({
  plans,
  onSelect,
  onClose,
  exclude = [],
}: SearchPaletteProps) {
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const excludedIds = new Set(exclude)
  const searchablePlans = plans.filter((plan) => !excludedIds.has(plan.id))
  const fuse = useMemo(
    () => new Fuse(searchablePlans, { keys: ['id', 'title'], threshold: 0.35 }),
    [searchablePlans],
  )
  const normalizedQuery = query.trim().replace(/^#/, '')
  const results = normalizedQuery
    ? fuse.search(normalizedQuery).map((result) => result.item)
    : searchablePlans

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((index) => (index + 1) % Math.max(results.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex(
        (index) => (index - 1 + results.length) % Math.max(results.length, 1),
      )
    } else if (event.key === 'Enter' && results[highlightedIndex]) {
      event.preventDefault()
      onSelect(results[highlightedIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
  }

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-palette-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="palette-heading">
          <p className="eyebrow">Find a plan</p>
          <h2 id="search-palette-title">Search your plans</h2>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search by # or title"
          aria-label="Search plans"
        />
        <ul className="palette-results" role="listbox" aria-label="Plans">
          {results.length === 0 ? (
            <li className="palette-empty">No matching plans.</li>
          ) : (
            results.map((plan, index) => (
              <li key={plan.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={index === highlightedIndex ? 'palette-result highlighted' : 'palette-result'}
                  onClick={() => onSelect(plan)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="plan-id">#{plan.id}</span>
                  <span>{plan.title}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
