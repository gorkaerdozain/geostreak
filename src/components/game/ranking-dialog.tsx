import { AnimatePresence, motion } from "motion/react"
import { ChampionIcon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { COUNTRIES_BY_CODE } from "@/game/countries"
import type { GameStats, RoundRecord, Run } from "@/game/game"

const MEDALS = ["🥇", "🥈", "🥉"]
const MAX_FLAGS = 8
const formatDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

function AnimatedCount({ value }: { value: number }) {
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-muted/60 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function flagsOf(codes: string[]) {
  return codes
    .map((code) => COUNTRIES_BY_CODE.get(code)?.flag)
    .filter((flag) => flag !== undefined)
}

function Flags({ codes }: { codes: string[] }) {
  const flags = flagsOf(codes)
  return (
    <span className="truncate text-sm leading-none">
      {flags.slice(0, MAX_FLAGS).join(" ")}
      {flags.length > MAX_FLAGS && (
        <span className="text-xs text-muted-foreground">
          {" "}
          +{flags.length - MAX_FLAGS}
        </span>
      )}
    </span>
  )
}

function CurrentRunRow({ streak, codes }: { streak: number; codes: string[] }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed px-3 py-2.5">
      <span className="w-7 text-center text-lg leading-none">🔥</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium tabular-nums">
          {streak} {streak === 1 ? "country" : "countries"}
        </span>
        <Flags codes={codes} />
      </div>
      <Badge variant="secondary" className="shrink-0">
        In progress
      </Badge>
    </div>
  )
}

function RunRow({ run, position }: { run: Run; position: number }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl px-3 py-2.5 odd:bg-muted/40">
      <span className="w-7 text-center text-lg leading-none">
        {MEDALS[position] ?? (
          <span className="text-sm text-muted-foreground">{position + 1}</span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium tabular-nums">
          {run.streak} {run.streak === 1 ? "country" : "countries"}
        </span>
        <Flags codes={run.countries} />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {run.endedAt ? formatDate.format(run.endedAt) : ""}
      </span>
    </li>
  )
}

function RoundRow({ round }: { round: RoundRecord }) {
  const country = COUNTRIES_BY_CODE.get(round.code)
  return (
    <li className="flex items-center gap-3 rounded-2xl px-3 py-2.5 odd:bg-muted/40">
      <span className="w-7 text-center text-lg leading-none">
        {country?.flag}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">
          {country?.name ?? round.code}
        </span>
        <span className="text-xs text-muted-foreground">
          {round.endedAt ? formatDate.format(round.endedAt) : ""}
        </span>
      </div>
      <Badge variant={round.won ? "secondary" : "outline"} className="shrink-0">
        {round.won
          ? `Guessed in ${round.attempts}`
          : `Missed · ${round.attempts} tries`}
      </Badge>
    </li>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: typeof ChampionIcon
  title: string
  description: string
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

const LIST_CLASS =
  "no-scrollbar flex max-h-72 scroll-fade-y flex-col gap-1 overflow-y-auto"

export function RankingDialog({
  stats,
  runs,
  history,
  bestStreak,
  streak,
  currentRun,
}: {
  stats: GameStats
  runs: Run[]
  history: RoundRecord[]
  bestStreak: number
  streak: number
  currentRun: string[]
}) {
  const winRate = stats.played
    ? Math.round((stats.won / stats.played) * 100)
    : 0
  const avgTries = stats.won ? (stats.winAttempts / stats.won).toFixed(1) : "—"

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" />}>
        🔥 Streak <AnimatedCount value={streak} />
      </DialogTrigger>
      <DialogTrigger render={<Button variant="secondary" />}>
        🏆 Best <AnimatedCount value={bestStreak} />
      </DialogTrigger>
      <DialogTrigger render={<Button variant="secondary" />}>
        <HugeiconsIcon
          icon={ChampionIcon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Ranking
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ranking</DialogTitle>
          <DialogDescription>
            Your streaks and rounds on this device.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          <StatTile label="Played" value={String(stats.played)} />
          <StatTile label="Win rate" value={`${winRate}%`} />
          <StatTile label="Avg tries" value={avgTries} />
          <StatTile label="Best" value={String(bestStreak)} />
        </div>
        <Tabs defaultValue="streaks" className="gap-3">
          <TabsList className="w-full">
            <TabsTrigger value="streaks">Top streaks</TabsTrigger>
            <TabsTrigger value="rounds">Recent rounds</TabsTrigger>
          </TabsList>
          <TabsContent value="streaks" className="flex flex-col gap-2">
            {streak > 0 && <CurrentRunRow streak={streak} codes={currentRun} />}
            {runs.length > 0 ? (
              <ol className={LIST_CLASS}>
                {runs.map((run, i) => (
                  <RunRow key={`${run.endedAt}-${i}`} run={run} position={i} />
                ))}
              </ol>
            ) : (
              streak === 0 && (
                <EmptyState
                  icon={ChampionIcon}
                  title="No streaks yet"
                  description="Guess countries in a row to build a streak. It enters the top when a round is lost."
                />
              )
            )}
          </TabsContent>
          <TabsContent value="rounds">
            {history.length > 0 ? (
              <ol className={LIST_CLASS}>
                {history.map((round, i) => (
                  <RoundRow key={`${round.endedAt}-${i}`} round={round} />
                ))}
              </ol>
            ) : (
              <EmptyState
                icon={Clock01Icon}
                title="No rounds yet"
                description="Every country you guess or miss shows up here."
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
