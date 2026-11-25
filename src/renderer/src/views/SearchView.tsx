import { useEffect, useState } from 'react'
import { SearchX } from 'lucide-react'
import { usePlayer } from '../store/player'
import { fetchTrending, searchStations } from '../lib/radioBrowser'
import { useAsync } from '../lib/useAsync'
import { genres } from '../lib/stations'
import { StationCard } from '../components/StationCard'
import { EmptyState, ErrorState, SectionHeader, SkeletonGrid } from '../components/Section'
import { LogoMark } from '../components/Logo'
import type { Genre } from '../lib/types'

function GenreChip({ genre }: { genre: Genre }): React.JSX.Element {
  const setView = usePlayer((state) => state.setView)
  return (
    <button
      type="button"
      onClick={() => setView('genre', genre.id)}
      className="group flex items-center gap-2.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-3.5 py-2 text-[12px] font-medium text-white/55 transition-colors hover:border-white/15 hover:bg-white/[0.05] hover:text-white/90"
    >
      <span className="size-1.5 rounded-full" style={{ background: `linear-gradient(135deg, ${genre.from}, ${genre.to})` }} />
      {genre.label}
    </button>
  )
}

export function SearchView(): React.JSX.Element {
  const query = usePlayer((state) => state.query)
  const setView = usePlayer((state) => state.setView)
  const [debounced, setDebounced] = useState('')
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    setTyping(true)
    const timer = setTimeout(() => {
      setDebounced(query.trim())
      setTyping(false)
    }, 420)
    return () => clearTimeout(timer)
  }, [query])

  const results = useAsync(
    () => (debounced ? searchStations(debounced) : Promise.resolve([])),
    [debounced]
  )
  const popular = useAsync(() => fetchTrending(10), [])

  if (!query.trim()) {
    return (
      <div className="px-4 pb-8 sm:px-7">
        <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.015] px-5 py-5 sm:px-7 sm:py-6">
          <p className="font-display text-[20px] font-semibold tracking-[-0.025em] text-white/90">
            Was möchtest du hören?
          </p>
          <p className="mt-1.5 text-[12.5px] text-white/35">
            Durchsuche zehntausende Sender — nach Name, Genre oder Stadt.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {genres.map((genre) => (
              <GenreChip key={genre.id} genre={genre} />
            ))}
          </div>
        </div>

        <section className="mt-9">
          <SectionHeader title="Gerade beliebt" subtitle="Die meistgehörten Sender im Netz." />
          {popular.loading ? (
            <SkeletonGrid count={10} />
          ) : popular.error ? (
            <ErrorState message={popular.error} onRetry={popular.reload} />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2">
              {(popular.data ?? []).map((station) => (
                <StationCard key={station.id} station={station} queue={popular.data ?? undefined} />
              ))}
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="px-4 pb-8 sm:px-7">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] text-white/35">
          {typing || results.loading
            ? 'Suche läuft …'
            : results.data
              ? `${results.data.length} Sender für „${debounced}“`
              : `Keine Treffer für „${debounced}“`}
        </p>
        <button
          type="button"
          onClick={() => setView('home')}
          className="text-[11px] text-white/30 transition-colors hover:text-white/70"
        >
          Suche schließen
        </button>
      </div>

      <div className="mt-4">
        {results.loading || typing ? (
          <SkeletonGrid count={12} />
        ) : results.error ? (
          <ErrorState message={results.error} onRetry={results.reload} />
        ) : results.data && results.data.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2">
            {results.data.map((station) => (
              <StationCard key={station.id} station={station} queue={results.data ?? undefined} />
            ))}
          </div>
        ) : (
          <EmptyState
            artwork={<LogoMark size={84} className="opacity-60" />}
            title="Nichts gefunden"
            text={`Für „${debounced}“ haben wir keinen Sender gefunden. Versuch es mit einem Genre wie Jazz, Chill oder Indie.`}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {genres.slice(0, 4).map((genre) => (
                  <GenreChip key={genre.id} genre={genre} />
                ))}
              </div>
            }
          />
        )}
      </div>

      {!results.loading && !results.error && (results.data?.length ?? 0) === 0 && (
        <div className="mt-6 flex items-start gap-2 text-[11px] text-white/25">
          <SearchX size={13} className="mt-0.5" />
          Tipp: Sender lassen sich auch über ihre Stadt finden, z. B. „Berlin“ oder „Paris“.
        </div>
      )}
    </div>
  )
}
