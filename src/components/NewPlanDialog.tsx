import { useEffect, useRef, useState } from 'react'
import { usePlanStore } from '../store'

interface NewPlanDialogProps {
  onClose: () => void
}

export function NewPlanDialog({ onClose }: NewPlanDialogProps) {
  const addPlan = usePlanStore((state) => state.addPlan)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

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

    addPlan(trimmedTitle, [])
    onClose()
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
            aria-describedby={error ? 'plan-title-error' : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="off"
          />
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
      </div>
    </div>
  )
}
