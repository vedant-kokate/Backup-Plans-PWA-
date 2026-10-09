interface KeyboardShortcutsDialogProps {
  onClose: () => void
}

const shortcuts = [
  ['n', 'New plan'],
  ['/', 'Open search'],
  ['e', 'Edit focused plan'],
  ['d / Delete', 'Delete focused plan'],
  ['Left / Right', 'Move to a parent or child'],
  ['Up / Down', 'Choose a navigation candidate'],
  ['Enter', 'Confirm a highlighted candidate'],
  ['Esc', 'Close the current dialog'],
  ['+ / - / 0', 'Zoom in, zoom out, or fit graph'],
  ['Tab', 'Move from title to notes in a new plan'],
  ['Cmd/Ctrl + P', 'Choose a parent in a new plan'],
  ['?', 'Open this list'],
]

export function KeyboardShortcutsDialog({ onClose }: KeyboardShortcutsDialogProps) {
  return (
    <div className="shortcuts-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="shortcuts-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="shortcuts-header">
          <div>
            <p className="eyebrow">Keyboard first</p>
            <h2 id="shortcuts-title">Keyboard shortcuts</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            x
          </button>
        </div>
        <ul className="shortcuts-list">
          {shortcuts.map(([key, action]) => (
            <li key={key}>
              <kbd>{key}</kbd>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
