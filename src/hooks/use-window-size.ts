import { useSyncExternalStore } from "react"

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback)
  return () => window.removeEventListener("resize", callback)
}

const getWidth = () => window.innerWidth
const getHeight = () => window.innerHeight

export function useWindowSize() {
  const width = useSyncExternalStore(subscribe, getWidth)
  const height = useSyncExternalStore(subscribe, getHeight)
  return { width, height }
}
