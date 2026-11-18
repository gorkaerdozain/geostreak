import { cn } from "cn"
import createGlobe, { type Globe as CobeGlobe, type Marker } from "cobe"
import { useEffect, useMemo, useRef, useState } from "react"

import { CORRECT_COLOR, distanceColor, distanceRgb } from "@/game/color"
import { COUNTRIES_BY_CODE } from "@/game/countries"
import { countryDots } from "@/game/dots"
import type { Guess } from "@/game/game"
import type { GlobeSettings } from "@/game/globe-settings"
import type { Country } from "@/game/types"
import { useIsDark } from "@/hooks/use-is-dark"
import { useWindowSize } from "@/hooks/use-window-size"

/** Dots in cobe's map; more samples draw sharper coastlines. */
const MAP_SAMPLES = 24000
/** Marker size that covers exactly one map dot. */
const DOT_SIZE = 0.015
/** Default zoom; the wheel or a pinch moves between MIN and MAX. */
const SCALE = 0.8
const MIN_SCALE = 0.6
const MAX_SCALE = 2
/** Matches react-globe.gl's OrbitControls autoRotateSpeed 0.35 (rad per second). */
const AUTO_ROTATE_SPEED = (0.35 * 2 * Math.PI) / 60
/** Lifts the globe above the game card, as a fraction of the height. */
const LIFT = 0.04
/** Same duration as the other globe's pointOfView transition. */
const FLIGHT_MS = 900
const formatKm = new Intl.NumberFormat("en", { maximumFractionDigits: 0 })

const LIGHT = {
  dark: 0,
  diffuse: 1.2,
  mapBrightness: 6,
  baseColor: [1, 1, 1],
  glowColor: [0.92, 0.94, 0.98],
} as const
const DARK = {
  dark: 1,
  diffuse: 1.4,
  mapBrightness: 6,
  baseColor: [0.55, 0.55, 0.58],
  glowColor: [0.35, 0.36, 0.42],
} as const

/** cobe angles that bring [lat, lng] to the centre of the globe. */
function anglesFor([lat, lng]: [number, number]) {
  return {
    phi: -Math.PI / 2 - (lng * Math.PI) / 180,
    theta: (lat * Math.PI) / 180,
  }
}

/** Entry animation: the globe grows, turns into place and fades in. */
const INTRO_MS = 1400
const INTRO_TURN = 1.6
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2

const clampScale = (scale: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))

interface ViewAngles {
  phi: number
  theta: number
  scale: number
}

interface Flight {
  from: ViewAngles
  /** Shortest phi turn, so the globe never spins the long way round. */
  dPhi: number
  to: ViewAngles
  start: number
}

/** Shortest signed turn from `from` to `to`. */
function angleDelta(from: number, to: number) {
  const d = (to - from) % (2 * Math.PI)
  return d > Math.PI ? d - 2 * Math.PI : d < -Math.PI ? d + 2 * Math.PI : d
}

interface Marked {
  country: Country
  color: string
  rgb: [number, number, number]
  distanceKm: number | null
  isTarget: boolean
}

export function WorldGlobe({
  guesses,
  target,
  revealTarget,
  focus,
  settings,
  onCountryClick,
}: {
  guesses: Guess[]
  target: Country
  revealTarget: boolean
  focus: Country | null
  settings: GlobeSettings
  onCountryClick: (country: Country) => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const { width, height } = useWindowSize()
  const isDark = useIsDark()
  const [hovered, setHovered] = useState<string | null>(null)

  // Mutable view state, read by the render loop without re-rendering React.
  const view = useRef({
    phi: 0,
    theta: 0.3,
    scale: SCALE,
    dragging: false,
    lastX: 0,
    lastY: 0,
  })
  const flight = useRef<Flight | null>(null)
  const intro = useRef<number | null>(null)
  const autoRotate = useRef(settings.autoRotate)
  useEffect(() => {
    autoRotate.current = settings.autoRotate
  }, [settings.autoRotate])

  const marked = useMemo<Marked[]>(() => {
    const items: Marked[] = guesses.flatMap((g) => {
      const country = COUNTRIES_BY_CODE.get(g.code)
      if (!country) return []
      const isTarget = g.code === target.code
      return [
        {
          country,
          color: distanceColor(g.distanceKm, isTarget),
          rgb: distanceRgb(g.distanceKm, isTarget),
          distanceKm: g.distanceKm,
          isTarget,
        },
      ]
    })
    if (revealTarget && !guesses.some((g) => g.code === target.code)) {
      items.push({
        country: target,
        color: CORRECT_COLOR,
        rgb: distanceRgb(0, true),
        distanceKm: null,
        isTarget: true,
      })
    }
    return items
  }, [guesses, target, revealTarget])

  const markers = useMemo<Marker[]>(
    () =>
      marked.flatMap(({ country, rgb }) => [
        ...countryDots(country, MAP_SAMPLES).map((location): Marker => ({
          location,
          size: DOT_SIZE,
          color: rgb,
        })),
        // Invisible anchor for the HTML label (CSS anchor positioning).
        { location: country.latlng, size: 0, id: country.code },
      ]),
    [marked]
  )
  // Latest markers, so a recreated globe (resize, theme) starts with them.
  const markersRef = useRef(markers)

  const globeRef = useRef<CobeGlobe | null>(null)

  // cobe owns its canvas (it wraps it in a div), so it lives outside React's tree.
  useEffect(() => {
    const host = hostRef.current
    const root = rootRef.current
    if (!host || !root) return undefined
    const canvas = document.createElement("canvas")
    canvas.style.cssText = "width:100%;height:100%;touch-action:none"
    host.append(canvas)
    const devicePixelRatio = Math.min(window.devicePixelRatio, 2)
    const globe = createGlobe(canvas, {
      devicePixelRatio,
      width,
      height,
      phi: view.current.phi,
      theta: view.current.theta,
      scale: view.current.scale,
      mapSamples: MAP_SAMPLES,
      markerColor: [1, 0.5, 0],
      markerElevation: 0,
      markers: markersRef.current,
      ...(isDark ? DARK : LIGHT),
      baseColor: [...(isDark ? DARK : LIGHT).baseColor],
      glowColor: [...(isDark ? DARK : LIGHT).glowColor],
    })
    globeRef.current = globe
    // Only the first globe plays the intro; theme or size changes reuse the view.
    intro.current ??= performance.now()
    const introStart = intro.current

    // Time-based, so speed is the same at 60 Hz and 120 Hz.
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const v = view.current
      const seconds = Math.min(now - last, 100) / 1000
      last = now
      const f = flight.current
      if (f && !v.dragging) {
        const t = Math.min((now - f.start) / FLIGHT_MS, 1)
        const k = easeInOutCubic(t)
        v.phi = f.from.phi + f.dPhi * k
        v.theta = f.from.theta + (f.to.theta - f.from.theta) * k
        v.scale = f.from.scale + (f.to.scale - f.from.scale) * k
        if (t === 1) flight.current = null
      } else if (autoRotate.current && !v.dragging) {
        v.phi += AUTO_ROTATE_SPEED * seconds
      }
      const k = easeOutCubic(Math.min((now - introStart) / INTRO_MS, 1))
      const scale = v.scale * (0.35 + 0.65 * k)
      // cobe's offset is in device pixels and shrinks with scale, so recompute it.
      const offset: [number, number] = [
        0,
        (-2 * LIFT * height * devicePixelRatio) / scale,
      ]
      globe.update({
        phi: v.phi - (1 - k) * INTRO_TURN,
        theta: v.theta,
        scale,
        offset,
        opacity: k,
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    // Wheel and trackpad pinch (ctrl+wheel) zoom; non-passive to stop page zoom.
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      flight.current = null
      const v = view.current
      v.scale = clampScale(v.scale * Math.exp(-event.deltaY * 0.001))
    }
    root.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      root.removeEventListener("wheel", handleWheel)
      cancelAnimationFrame(frame)
      globe.destroy()
      globeRef.current = null
      host.replaceChildren()
    }
  }, [width, height, isDark])

  useEffect(() => {
    markersRef.current = markers
    globeRef.current?.update({ markers })
  }, [markers])

  useEffect(() => {
    if (!focus) return
    const v = view.current
    const to = { ...anglesFor(focus.latlng), scale: SCALE }
    flight.current = {
      from: { phi: v.phi, theta: v.theta, scale: v.scale },
      dPhi: angleDelta(v.phi, to.phi),
      to,
      start: performance.now(),
    }
  }, [focus])

  const handlePointerDown = (event: React.PointerEvent) => {
    const v = view.current
    v.dragging = true
    v.lastX = event.clientX
    v.lastY = event.clientY
    flight.current = null
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event: React.PointerEvent) => {
    const v = view.current
    if (!v.dragging) return
    // Slower when zoomed in, so the ground follows the pointer.
    const speed = 250 * (v.scale / SCALE)
    v.phi += (event.clientX - v.lastX) / speed
    v.theta = Math.max(
      -1.2,
      Math.min(1.2, v.theta + (event.clientY - v.lastY) / speed)
    )
    v.lastX = event.clientX
    v.lastY = event.clientY
  }
  const handlePointerUp = () => {
    view.current.dragging = false
  }

  return (
    // Wheel zoom listens here so it also works over the labels.
    <div ref={rootRef} className="relative size-full">
      <div
        ref={hostRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {marked.map(({ country, color, distanceKm, isTarget }) => {
        const isHovered = hovered === country.code
        const showName = isTarget || isHovered
        const km =
          distanceKm === null ? "" : `${formatKm.format(distanceKm)} km`
        const text = showName
          ? `${country.name}${isTarget || !km ? "" : ` · ${km}`}`
          : settings.alwaysShowLabels
            ? km
            : ""
        const visible = `var(--cobe-visible-${country.code}, 0)`
        return (
          <button
            key={country.code}
            type="button"
            onClick={() => onCountryClick(country)}
            onPointerEnter={() => setHovered(country.code)}
            onPointerLeave={() => setHovered(null)}
            className="absolute mb-3 -translate-x-1/2 transition-[opacity,filter] duration-300"
            style={{
              positionAnchor: `--cobe-${country.code}`,
              bottom: "anchor(top)",
              left: "anchor(center)",
              // cobe sets the variable while the anchor faces the camera.
              opacity: visible,
              filter: `blur(calc((1 - ${visible}) * 8px))`,
              zIndex: isHovered ? 10 : undefined,
            }}
          >
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full bg-popover/90 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground shadow-md ring-1 ring-foreground/10 backdrop-blur-md transition-[opacity,scale] duration-300",
                isHovered && "scale-105",
                hovered && !isHovered && "opacity-25"
              )}
            >
              <span
                aria-hidden
                className="size-2 rounded-full ring-1 ring-foreground/20"
                style={{ backgroundColor: color }}
              />
              {country.flag}
              {text && <span>{text}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
