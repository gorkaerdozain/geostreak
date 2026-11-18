import { SearchRemoveIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useRef, useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { InputGroupAddon } from "@/components/ui/input-group"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { PLAYABLE_COUNTRIES } from "@/game/countries"
import { searchCountries } from "@/game/search"
import type { Country } from "@/game/types"
import { useFocusShortcut } from "@/hooks/use-focus-shortcut"

const IS_MAC = /mac/i.test(navigator.userAgent)

export function CountrySearch({
  excluded,
  disabled,
  onSelect,
}: {
  excluded: Set<string>
  disabled: boolean
  onSelect: (code: string) => void
}) {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  useFocusShortcut(inputRef)
  const available = useMemo(
    () => PLAYABLE_COUNTRIES.filter((c) => !excluded.has(c.code)),
    [excluded]
  )
  const filtered = useMemo(
    () => searchCountries(available, query),
    [available, query]
  )

  return (
    <Combobox
      items={available}
      filteredItems={filtered}
      inputValue={query}
      onInputValueChange={setQuery}
      value={null}
      onValueChange={(country: Country | null) => {
        if (!country) return
        onSelect(country.code)
        setQuery("")
      }}
      itemToStringLabel={(country: Country) => country.name}
      autoHighlight
    >
      <ComboboxInput
        placeholder="Type a country…"
        disabled={disabled}
        className="w-full"
        showTrigger={false}
        ref={inputRef}
        autoFocus
      >
        <InputGroupAddon align="inline-end">
          <KbdGroup>
            <Kbd>{IS_MAC ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>
          <Empty className="gap-3 p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No countries found</EmptyTitle>
              <EmptyDescription>
                {query
                  ? `Nothing matches “${query}”. Try the English or Spanish name.`
                  : "You have guessed every country."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </ComboboxEmpty>
        <ComboboxList className="scroll-fade-y">
          {(country: Country) => (
            <ComboboxItem key={country.code} value={country}>
              <span className="text-base leading-none">{country.flag}</span>
              <span className="truncate">{country.name}</span>
              {country.nameEs !== country.name && (
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {country.nameEs}
                </span>
              )}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
