import { useState } from 'react'
import {
  ArrowUpRight,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Loader2,
  MapPin,
  Moon,
  Newspaper,
  RefreshCw,
  Search,
  Sparkles,
  Sun
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Weather {
  temperature: number
  apparent: number
  code: number
  isDay: boolean
  at: number
}

type WeatherState = 'idle' | 'loading' | 'ready' | 'denied' | 'error'

function weatherInfo(code: number, isDay: boolean): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: 'Klar', Icon: isDay ? Sun : Moon }
  if (code === 1) return { label: 'Überwiegend klar', Icon: isDay ? Sun : Moon }
  if (code === 2) return { label: 'Teilweise bewölkt', Icon: CloudSun }
  if (code === 3) return { label: 'Bedeckt', Icon: Cloud }
  if (code === 45 || code === 48) return { label: 'Nebel', Icon: CloudFog }
  if (code >= 51 && code <= 57) return { label: 'Nieselregen', Icon: CloudDrizzle }
  if (code >= 61 && code <= 67) return { label: 'Regen', Icon: CloudRain }
  if (code >= 71 && code <= 77) return { label: 'Schnee', Icon: CloudSnow }
  if (code >= 80 && code <= 82) return { label: 'Regenschauer', Icon: CloudRain }
  if (code === 85 || code === 86) return { label: 'Schneeschauer', Icon: CloudSnow }
  if (code >= 95) return { label: 'Gewitter', Icon: CloudLightning }
  return { label: 'Unbekannt', Icon: Cloud }
}

function WeatherCard(): React.JSX.Element {
  const [state, setState] = useState<WeatherState>('idle')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = (): void => {
    if (!('geolocation' in navigator)) {
      setState('error')
      setMessage('Dieser Browser unterstützt keinen Standort.')
      return
    }
    setState('loading')
    setMessage(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const url =
            'https://api.open-meteo.com/v1/forecast' +
            `?latitude=${latitude}&longitude=${longitude}` +
            '&current=temperature_2m,apparent_temperature,weather_code,is_day&timezone=auto'
          const response = await fetch(url)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const data = (await response.json()) as {
            current?: {
              temperature_2m?: number
              apparent_temperature?: number
              weather_code?: number
              is_day?: number
            }
          }
          const current = data.current
          if (!current || typeof current.temperature_2m !== 'number') throw new Error('Keine Wetterdaten')
          setWeather({
            temperature: Math.round(current.temperature_2m),
            apparent: Math.round(current.apparent_temperature ?? current.temperature_2m),
            code: current.weather_code ?? 0,
            isDay: current.is_day !== 0,
            at: Date.now()
          })
          setState('ready')
        } catch {
          setState('error')
          setMessage('Wetter konnte nicht geladen werden.')
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setState('denied')
          setMessage('Standortzugriff wurde abgelehnt.')
        } else {
          setState('error')
          setMessage('Standort ist gerade nicht verfügbar.')
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 }
    )
  }

  const info = weather ? weatherInfo(weather.code, weather.isDay) : null
  const Icon = info?.Icon ?? MapPin

  return (
    <div className="flex min-h-[136px] flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/35">
        <Icon size={14} className="text-white/50" />
        Wetter
      </div>

      {state === 'ready' && weather && info ? (
        <>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-[27px] font-semibold leading-none tracking-[-0.03em] text-white">
              {weather.temperature}°
            </span>
            <span className="truncate text-[11.5px] text-white/45">{info.label}</span>
          </div>
          <p className="mt-1 text-[10.5px] text-white/25">
            Gefühlt {weather.apparent}° · Aktueller Standort
          </p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9.5px] text-white/20 underline decoration-white/10 underline-offset-2 hover:text-white/45"
            >
              Daten: Open-Meteo
            </a>
            <button
              type="button"
              onClick={load}
              aria-label="Wetter aktualisieren"
              className="flex items-center gap-1 text-[10px] text-white/35 transition-colors hover:text-white/70"
            >
              <RefreshCw size={11} />
              Aktualisieren
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-[12px] leading-snug text-white/55">
            {state === 'loading'
              ? 'Standort wird abgefragt …'
              : state === 'denied' || state === 'error'
                ? message
                : 'Wetter am aktuellen Standort.'}
          </p>
          <div className="mt-auto pt-3">
            <button
              type="button"
              onClick={load}
              disabled={state === 'loading'}
              className="flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[10.5px] font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              {state === 'loading' ? <Loader2 size={11} className="animate-spin" /> : <MapPin size={11} />}
              {state === 'denied' || state === 'error' ? 'Erneut versuchen' : 'Standort freigeben'}
            </button>
            <p className="mt-2 text-[9px] leading-snug text-white/20">
              Nur nach Klick · Standort wird nicht gespeichert.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function LinkCard({
  title,
  subtitle,
  href,
  icon: Icon
}: {
  title: string
  subtitle: string
  href: string
  icon: LucideIcon
}): React.JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[136px] flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/15 hover:bg-white/[0.04]"
    >
      <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/35">
        <Icon size={14} className="text-white/50" />
        {title}
      </div>
      <p className="mt-2 text-[12px] leading-snug text-white/55">{subtitle}</p>
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="truncate text-[10px] text-white/25">{new URL(href).hostname.replace(/^www\./, '')}</span>
        <ArrowUpRight
          size={13}
          className="shrink-0 text-white/25 transition-colors group-hover:text-white/70"
        />
      </div>
    </a>
  )
}

function PrivateSearchCard(): React.JSX.Element {
  const [query, setQuery] = useState('')

  return (
    <div className="flex min-h-[136px] flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/35">
        <Search size={14} className="text-white/50" />
        Private Suche
      </div>

      <form
        className="mt-3 flex gap-1.5"
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = query.trim()
          if (!trimmed) return
          window.open(
            `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`,
            '_blank',
            'noopener,noreferrer'
          )
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Suchen …"
          aria-label="Privat mit DuckDuckGo suchen"
          spellCheck={false}
          className="h-8 min-w-0 flex-1 rounded-lg border border-white/[0.07] bg-black/30 px-2.5 text-[11.5px] text-white/85 outline-none transition-colors placeholder:text-white/25 focus:border-[var(--accent)]/40"
        />
        <button
          type="submit"
          aria-label="Suche öffnen"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.08] text-white/60 transition-colors hover:bg-white/15 hover:text-white"
        >
          <ArrowUpRight size={13} />
        </button>
      </form>

      <p className="mt-auto pt-2 text-[9px] leading-snug text-white/20">
        Öffnet DuckDuckGo in einem neuen Tab.
      </p>
    </div>
  )
}

export function QuickLinks(): React.JSX.Element {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <WeatherCard />
      <LinkCard
        title="Nachrichten"
        subtitle="Focus – aktuelle Politik, Wirtschaft und Panorama."
        href="https://www.focus.de/"
        icon={Newspaper}
      />
      <PrivateSearchCard />
      <LinkCard
        title="duck.ai"
        subtitle="KI-Chat von DuckDuckGo – ohne Konto, anonymisiert."
        href="https://duck.ai/"
        icon={Sparkles}
      />
    </div>
  )
}
