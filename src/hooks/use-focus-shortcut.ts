import { useEffect, type RefObject } from "react"

/** Focuses the element on Cmd+K (macOS) or Ctrl+K (elsewhere). */
export function useFocusShortcut(
  ref: RefObject<HTMLElement | null>,
  key = "k"
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== key)
        return
      event.preventDefault()
      ref.current?.focus()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [ref, key])
}
