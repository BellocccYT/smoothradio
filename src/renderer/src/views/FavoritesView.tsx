import { Heart, Plus } from 'lucide-react'
import { usePlayer } from '../store/player'
import { StationCard } from '../components/StationCard'
import { EmptyState, SectionHeader } from '../components/Section'
import { CompactRow } from '../components/CompactRow'
import { LogoMark } from '../components/Logo'

export function FavoritesView({ onOpenAddStream }: { onOpenAddStream: () => void }): React.JSX.Element {
  const favorites = usePlayer((state) => state.favorites)
  const customStations = usePlayer((state) => state.customStations)
  const setView = usePlayer((state) => state.setView)
  const removeCustomStation = usePlayer((state) => state.removeCustomStation)

  return (
    <div className="px-7 pb-8">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <div>
          <p className="text-[12.5px] font-medium text-white/75">
            {favorites.length + customStations.length} Sender in deiner Sammlung
          </p>
          <p className="mt-0.5 text-[11px] text-white/30">
            Favoriten werden lokal gespeichert — ohne Konto, ohne Cloud.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddStream}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-[11.5px] font-medium text-white/55 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
        >
          <Plus size={13} />
          Stream
        </button>
      </div>

      <section className="mt-7">
        <SectionHeader title="Favoriten" subtitle="Alles, was bleiben darf." />
        {favorites.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2">
            {favorites.map((station) => (
              <StationCard key={station.id} station={station} queue={favorites} />
            ))}
          </div>
        ) : (
          <EmptyState
            artwork={<LogoMark size={84} className="opacity-60" />}
            title="Noch keine Favoriten"
            text="Tippe bei einem Sender auf das Herz — er wartet dann hier auf dich."
            action={
              <button
                type="button"
                onClick={() => setView('search')}
                className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-[12px] font-semibold text-[#05060a] transition-[filter] hover:brightness-110"
              >
                <Heart size={13} fill="currentColor" />
                Sender entdecken
              </button>
            }
          />
        )}
      </section>

      {customStations.length > 0 && (
        <section className="mt-9">
          <SectionHeader
            title="Eigene Streams"
            subtitle="Deine URLs, deine Sender."
            onMore={onOpenAddStream}
            moreLabel="Hinzufügen"
          />
          <div className="grid gap-1.5 md:grid-cols-2">
            {customStations.map((station) => (
              <CompactRow
                key={station.id}
                station={station}
                queue={customStations}
                onRemove={removeCustomStation}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
