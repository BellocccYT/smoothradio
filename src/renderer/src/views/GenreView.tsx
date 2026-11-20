import { usePlayer } from '../store/player'
import { fetchByTag } from '../lib/radioBrowser'
import { findGenre } from '../lib/stations'
import { useAsync } from '../lib/useAsync'
import { StationCard } from '../components/StationCard'
import { ErrorState, SkeletonGrid } from '../components/Section'

export function GenreView(): React.JSX.Element {
  const genreId = usePlayer((state) => state.genre)
  const genre = findGenre(genreId)
  const stations = useAsync(
    () => (genre ? fetchByTag(genre.tag, 60) : Promise.resolve([])),
    [genre?.id]
  )

  if (!genre) {
    return (
      <div className="px-7 pb-8">
        <p className="text-[13px] text-white/40">Diese Stimmung gibt es nicht (mehr).</p>
      </div>
    )
  }

  return (
    <div className="px-7 pb-8">
      <div
        className="relative overflow-hidden rounded-[26px] border border-white/[0.07] px-7 py-7"
        style={{ background: `linear-gradient(120deg, ${genre.from}22 0%, ${genre.to}0d 55%, rgba(8,8,13,0.5) 100%)` }}
      >
        <div
          className="absolute -right-10 -top-16 size-56 rounded-full opacity-25 blur-3xl"
          style={{ background: genre.to }}
        />
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-white/40">Stimmung</p>
        <h2 className="font-display mt-1.5 text-[30px] font-semibold tracking-[-0.03em] text-white">{genre.label}</h2>
        <p className="mt-1 text-[12.5px] text-white/45">{genre.blurb} — live, ohne Playlist-Ende.</p>
      </div>

      <div className="mt-6">
        {stations.loading ? (
          <SkeletonGrid count={15} />
        ) : stations.error ? (
          <ErrorState message={stations.error} onRetry={stations.reload} />
        ) : (
          <>
            <p className="mb-4 text-[11px] text-white/30">{stations.data?.length ?? 0} Sender</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2">
              {(stations.data ?? []).map((station) => (
                <StationCard key={station.id} station={station} queue={stations.data ?? undefined} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
