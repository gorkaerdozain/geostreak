import { useSyncExternalStore } from "react"

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  return () => observer.disconnect()
}

const getSnapshot = () => document.documentElement.classList.contains("dark")

/** Tracks the resolved theme for code that cannot read CSS variables (WebGL). */
export function useIsDark() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
