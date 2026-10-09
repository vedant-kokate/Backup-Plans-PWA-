import { useEffect, useRef, useState } from 'react'
import { usePlanStore } from '../store'
import type { Plan } from '../types'

interface EditPlanDialogProps {
  plan: Plan
  onClose: () => void
}

export function EditPlanDialog({ plan, onClose }: EditPlanDialogProps) {
  const updatePlan = usePlanStore((state) => state.updatePlan)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(plan.title)
  const [notes, setNotes] = useState(plan.notes)
  const [error, setError] = useState('')

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

    updatePlan(plan.id, { title: trimmedTitle, notes: notes.trim() })
    onClose()
  }

  function handleNotesKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
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

          {error && (
            <p id="edit-plan-title-error" className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
