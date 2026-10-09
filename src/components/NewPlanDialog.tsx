import { useEffect, useRef, useState } from 'react'
import { SearchPalette } from './SearchPalette'
import { usePlanStore } from '../store'
import type { Plan } from '../types'

interface NewPlanDialogProps {
  onClose: () => void
}

export function NewPlanDialog({ onClose }: NewPlanDialogProps) {
  const addPlan = usePlanStore((state) => state.addPlan)
  const plans = usePlanStore((state) => state.plans)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [parents, setParents] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isParentSearchOpen, setIsParentSearchOpen] = useState(false)
  const selectedParents = parents
    .map((parentId) => plans[parentId])
    .filter((plan): plan is Plan => plan !== undefined)
  const availablePlans = Object.values(plans).sort(
    (first, second) => Number(first.id) - Number(second.id),
  )

  useEffect(() => {
    titleInputRef.current?.focus()
  }, [])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Enter a title for this plan.')
      titleInputRef.current?.focus()
      return
    }

    addPlan(trimmedTitle, parents, notes.trim())
    onClose()
  }

  function handleTitleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    const isParentShortcut =
      (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p'

    if (isParentShortcut) {
      event.preventDefault()
      setIsParentSearchOpen(true)
    }
  }

  function handleNotesKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function handleParentSelect(plan: Plan): void {
    setParents((currentParents) => [...currentParents, plan.id])
    setIsParentSearchOpen(false)
    titleInputRef.current?.focus()
  }

  function removeParent(parentId: string): void {
    setParents((currentParents) =>
      currentParents.filter((currentParentId) => currentParentId !== parentId),
    )
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-plan-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <p className="eyebrow">New plan</p>
          <h2 id="new-plan-title">What are you planning?</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="plan-title">Title</label>
          <input
            ref={titleInputRef}
            id="plan-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              setError('')
            }}
            onKeyDown={handleTitleKeyDown}
            aria-describedby={error ? 'plan-title-error' : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="off"
          />

          <label htmlFor="plan-notes">Notes</label>
          <textarea
            id="plan-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onKeyDown={handleNotesKeyDown}
            rows={3}
            placeholder="Add context or next steps"
          />

          <div className="parent-picker">
            <div className="parent-picker-heading">
              <span className="field-label">Parents</span>
              <button
                type="button"
                className="text-button"
                onClick={() => setIsParentSearchOpen(true)}
              >
                Add parent
              </button>
            </div>
            {selectedParents.length === 0 ? (
              <p className="parent-empty">No parents selected. This will be a root plan.</p>
            ) : (
              <ul className="parent-chips" aria-label="Selected parents">
                {selectedParents.map((parent) => (
                  <li key={parent.id} className="parent-chip">
                    <span>#{parent.id} {parent.title}</span>
                    <button
                      type="button"
                      onClick={() => removeParent(parent.id)}
                      aria-label={`Remove parent #${parent.id}`}
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p id="plan-title-error" className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Create plan
            </button>
          </div>
        </form>

        {isParentSearchOpen && (
          <SearchPalette
            plans={availablePlans}
            exclude={parents}
            onClose={() => {
              setIsParentSearchOpen(false)
              titleInputRef.current?.focus()
            }}
            onSelect={handleParentSelect}
          />
        )}
      </div>
    </div>
  )
}
