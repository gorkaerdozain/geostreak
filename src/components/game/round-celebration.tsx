import confetti from "canvas-confetti"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

import type { Country } from "@/game/types"

const VISIBLE_MS = 2600
const CONFETTI_COLORS = ["#22c55e", "#facc15", "#f97316", "#38bdf8", "#a78bfa"]

function fireConfetti() {
  const shared = {
    particleCount: 90,
    spread: 70,
    startVelocity: 55,
    colors: CONFETTI_COLORS,
    disableForReducedMotion: true,
    zIndex: 60,
  }
  void confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.75 } })
  void confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.75 } })
}

export interface RoundOutcome {
  /** Changes every round, so each result celebrates once. */
  id: string
  status: "won" | "lost"
  target: Country
  attempts: number
  streak: number
}

/** Centre-screen win/lose moment: confetti or a shake, then it gets out of the way. */
export function RoundCelebration({
  outcome,
}: {
  outcome: RoundOutcome | null
}) {
  // Derived: visible until its timer dismisses this outcome's id.
  const [dismissed, setDismissed] = useState<string | null>(null)
  const shown = outcome && outcome.id !== dismissed ? outcome : null

  useEffect(() => {
    if (!outcome) return undefined
    if (outcome.status === "won") fireConfetti()
    const timer = setTimeout(() => setDismissed(outcome.id), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [outcome])

  const won = shown?.status === "won"

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key={shown.id}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {!won && (
            // Red pulse around the edges so a miss is impossible to overlook.
            <motion.div
              aria-hidden
              className="absolute inset-0 shadow-[inset_0_0_120px_40px_var(--color-destructive)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.2] }}
              transition={{ duration: 0.9, times: [0, 0.3, 1] }}
            />
          )}
          <motion.div
            role="status"
            className="flex -translate-y-1/4 flex-col items-center gap-2 rounded-3xl bg-popover/90 px-8 py-6 text-center text-popover-foreground shadow-2xl ring-1 ring-foreground/10 backdrop-blur-xl"
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={
              won
                ? { scale: 1, opacity: 1, y: 0 }
                : { scale: 1, opacity: 1, y: 0, x: [0, -14, 12, -8, 6, 0] }
            }
            exit={{ scale: 0.9, opacity: 0, y: -10 }}
            transition={
              won
                ? { type: "spring", bounce: 0.5, duration: 0.6 }
                : {
                    type: "spring",
                    bounce: 0.3,
                    duration: 0.5,
                    x: { duration: 0.5, delay: 0.15 },
                  }
            }
          >
            <motion.span
              className="text-6xl leading-none"
              initial={{ rotate: won ? -20 : 0, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.6, delay: 0.1 }}
            >
              {shown.target.flag}
            </motion.span>
            <span className="text-2xl font-semibold tracking-tight">
              {won ? "Spot on!" : `It was ${shown.target.name}`}
            </span>
            <span className="text-sm text-muted-foreground">
              {won
                ? `${shown.target.name} in ${shown.attempts} ${shown.attempts === 1 ? "try" : "tries"} · 🔥 streak ${shown.streak}`
                : "Out of attempts · your streak starts again"}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
