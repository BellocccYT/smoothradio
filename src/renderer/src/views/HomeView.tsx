import { Headphones, Music4, Radio, Sparkles, Waves } from 'lucide-react'
import { usePlayer } from '../store/player'
import { BRAND } from '@shared/brand'
import { curatedStations, genres, pinnedStations } from '../lib/stations'
import { fetchTrending } from '../lib/radioBrowser'
import { useAsync } from '../lib/useAsync'
import { Hero } from '../components/Hero'
import { StationCard } from '../components/StationCard'
import { SectionHeader, SkeletonGrid, ErrorState } from '../components/Section'
import { CompactRow } from '../components/CompactRow'
import { QuickLinks } from '../components/QuickLinks'
import type { Genre } from '../lib/types'

const moodIcons = [Waves, Music4, Sparkles, Headphones]

function MoodTile({ genre, index }: { genre: Genre; index: number }): React.JSX.Element {
  const setView = usePlayer((state) => state.setView)
  const Icon = moodIcons[index % moodIcons.length]

  return (
    <button
      type="button"
      onClick={() => setView('genre', genre.id)}
      className="group relative h-[108px] overflow-hidden rounded-2xl border border-white/[0.06] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15"
      style={{ background: `linear-gradient(135deg, ${genre.from}26 0%, ${genre.to}0d 62%, rgba(10,10,16,0.4) 100%)` }}
    >
      <div
        className="absolute -right-6 -top-8 size-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: genre.to }}
      />
      <Icon size={17} className="text-white/60" style={{ color: genre.from }} />
      <p className="mt-3.5 text-[13px] font-semibold text-white/90">{genre.label}</p>
      <p className="mt-0.5 truncate text-[10.5px] text-white/35">{genre.blurb}</p>
    </button>
  )
}

export function HomeView(): React.JSX.Element {
  const recents = usePlayer((state) => state.recents)
  const setView = usePlayer((state) => state.setView)
  const trending = useAsync(() => fetchTrending(12), [])
  const curated = curatedStations
    .filter((station) => !pinnedStations.some((pinned) => pinned.id === station.id))
    .slice(0, 10)

  return (
    <div className="px-4 pb-8 sm:px-7">
      <section className="mt-1">
        <SectionHeader
          title="QuickLinks"
          subtitle="Wetter, Nachrichten und private Suche – ohne Tracking."
        />
        <QuickLinks />
      </section>

      <div className="mt-4">
        <Hero />
      </div>

      <section className="mt-5">
        <SectionHeader
          title="Deine Sender"
          subtitle="Harmony FM, DASDING, WDR 2 und 1LIVE – direkt reinhören."
        />
        <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          {pinnedStations.map((station) => (
            <CompactRow key={station.id} station={station} queue={pinnedStations} />
          ))}
        </div>
      </section>

      {recents.length > 0 && (
        <section className="mt-9">
          <SectionHeader
            title="Weiterhören"
            subtitle="Deine letzten Sender, direkt griffbereit."
            onMore={() => setView('history')}
            moreLabel="Verlauf"
          />
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {recents.slice(0, 6).map((station) => (
              <CompactRow key={station.id} station={station} queue={recents} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-9">
        <SectionHeader
          title="Stimmungen"
          subtitle="Sag dem Tag, wie er klingen soll."
        />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {genres.slice(0, 4).map((genre, index) => (
            <MoodTile key={genre.id} genre={genre} index={index} />
          ))}
        </div>
      </section>

      <section className="mt-9">
        <SectionHeader
          title="Handverlesen"
          subtitle="Sender mit Geschmack, ohne Algorithmus."
        />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2">
          {curated.map((station) => (
            <StationCard key={station.id} station={station} queue={curatedStations} />
          ))}
        </div>
      </section>

      <section className="mt-9">
        <SectionHeader
          title="Trending weltweit"
          subtitle="Was gerade überall auf der Welt läuft."
          onMore={trending.reload}
          moreLabel="Neu laden"
        />
        {trending.loading ? (
          <SkeletonGrid count={10} />
        ) : trending.error ? (
          <ErrorState message={trending.error} onRetry={trending.reload} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2">
            {(trending.data ?? []).slice(0, 10).map((station) => (
              <StationCard key={station.id} station={station} queue={trending.data ?? undefined} />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-5 text-[10.5px] text-white/22">
        <span className="flex items-center gap-1.5">
          <Radio size={12} />
          {BRAND.name} · {BRAND.tagline}
        </span>
        <span>Streams & Metadaten: SomaFM · Radio Paradise · Radio-Browser</span>
      </footer>
    </div>
  )
}
