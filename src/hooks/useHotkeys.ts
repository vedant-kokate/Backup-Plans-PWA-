import { useEffect } from 'react'

type HotkeyHandler = (event: KeyboardEvent) => void

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export function useHotkeys(
  handlers: Record<string, HotkeyHandler>,
  options: { ignoreTyping?: boolean } = {},
): void {
  const { ignoreTyping = true } = options

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (ignoreTyping && event.key !== 'Escape' && isTypingTarget(event.target)) {
        return
      }

      const handler = handlers[event.key] ?? handlers[event.key.toLowerCase()]

      if (!handler) {
        return
      }

      event.preventDefault()
      handler(event)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers, ignoreTyping])
}
