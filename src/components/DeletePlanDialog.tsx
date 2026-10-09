import { useEffect, useRef } from 'react'

interface DeletePlanDialogProps {
  planTitle: string
  onCancel: () => void
  onConfirm: () => void
}

export function DeletePlanDialog({
  planTitle,
  onCancel,
  onConfirm,
}: DeletePlanDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmButtonRef.current?.focus()
  }, [])

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      onConfirm()
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="dialog confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-plan-title"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="dialog-header">
          <p className="eyebrow">Delete plan</p>
          <h2 id="delete-plan-title">Delete “{planTitle}”?</h2>
        </div>
        <p className="confirm-copy">
          Any plans that point to it will keep their other parents, but this plan will be removed.
        </p>
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Keep plan
          </button>
          <button ref={confirmButtonRef} type="button" className="danger-button" onClick={onConfirm}>
            Delete plan
          </button>
        </div>
      </div>
    </div>
  )
}
