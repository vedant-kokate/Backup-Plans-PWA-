import { useEffect, useRef, useState } from 'react'
import { SearchPalette } from './SearchPalette'
import { wouldCreateCycle } from '../graph'
import { usePlanStore } from '../store'
import type { Plan } from '../types'

interface EditPlanDialogProps {
  plan: Plan
  onClose: () => void
  onDelete: () => void
}

export function EditPlanDialog({ plan, onClose, onDelete }: EditPlanDialogProps) {
  const updatePlan = usePlanStore((state) => state.updatePlan)
  const plans = usePlanStore((state) => state.plans)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(plan.title)
  const [notes, setNotes] = useState(plan.notes)
  const [parents, setParents] = useState<string[]>(plan.parents)
  const [error, setError] = useState('')
  const [isParentSearchOpen, setIsParentSearchOpen] = useState(false)
  const selectedParents = parents
    .map((parentId) => plans[parentId])
    .filter((parent): parent is Plan => parent !== undefined)
  const availablePlans = Object.values(plans)
    .filter((candidate) => !wouldCreateCycle(plans, plan.id, candidate.id))
    .sort((first, second) => Number(first.id) - Number(second.id))

  useEffect(() => {
    titleInputRef.current?.focus()
    titleInputRef.current?.select()
  }, [])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Enter a title for this plan.')
      titleInputRef.current?.focus()
      return
    }

    updatePlan(plan.id, {
      title: trimmedTitle,
      notes: notes.trim(),
      parents,
    })
    onClose()
  }

  function handleNotesKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function handleParentSelect(parent: Plan): void {
    setParents((currentParents) => [...currentParents, parent.id])
    setIsParentSearchOpen(false)
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
        aria-labelledby="edit-plan-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <p className="eyebrow">Edit plan #{plan.id}</p>
          <h2 id="edit-plan-title">Update this plan</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="edit-plan-title-input">Title</label>
          <input
            ref={titleInputRef}
            id="edit-plan-title-input"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              setError('')
            }}
            aria-describedby={error ? 'edit-plan-title-error' : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="off"
          />

          <label htmlFor="edit-plan-notes">Notes</label>
          <textarea
            id="edit-plan-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onKeyDown={handleNotesKeyDown}
            rows={5}
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
            <p id="edit-plan-title-error" className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="danger-button dialog-delete-button" onClick={onDelete}>
              Delete plan
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save changes
            </button>
          </div>
        </form>

        {isParentSearchOpen && (
          <SearchPalette
            plans={availablePlans}
            exclude={[plan.id, ...parents]}
            onClose={() => setIsParentSearchOpen(false)}
            onSelect={handleParentSelect}
          />
        )}
      </div>
    </div>
  )
}
