import { Button } from "@/components/ui/button"
import type { Country } from "@/game/types"

export function RoundResult({
  status,
  target,
  attempts,
  onNext,
}: {
  status: "won" | "lost"
  target: Country
  attempts: number
  onNext: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl leading-none">{target.flag}</span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">
          {status === "won" ? "You got it!" : `It was ${target.name}`}
        </span>
        <span className="text-xs text-muted-foreground">
          {status === "won"
            ? `${target.name} in ${attempts} ${attempts === 1 ? "try" : "tries"}`
            : "Streak reset. Keep going!"}
        </span>
      </div>
      <Button className="ml-auto" onClick={onNext} autoFocus>
        Next country
      </Button>
    </div>
  )
}
