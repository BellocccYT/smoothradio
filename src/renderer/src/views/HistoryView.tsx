import { History, Trash2 } from 'lucide-react'
import { usePlayer } from '../store/player'
import { CompactRow } from '../components/CompactRow'
import { EmptyState } from '../components/Section'
import { LogoMark } from '../components/Logo'

export function HistoryView(): React.JSX.Element {
  const recents = usePlayer((state) => state.recents)
  const clearHistory = usePlayer((state) => state.clearHistory)
  const setView = usePlayer((state) => state.setView)

  return (
    <div className="px-7 pb-8">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[12px] text-white/35">
          {recents.length > 0 ? `Die letzten ${recents.length} Sender` : 'Noch nichts gehört'}
        </p>
        {recents.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.07] px-3 py-1.5 text-[11px] text-white/35 transition-colors hover:border-red-400/25 hover:bg-red-500/[0.06] hover:text-red-200/80"
          >
            <Trash2 size={12} />
            Verlauf leeren
          </button>
        )}
      </div>

      {recents.length > 0 ? (
        <div className="grid gap-1.5 md:grid-cols-2">
          {recents.map((station, index) => (
            <CompactRow key={`${station.id}-${index}`} station={station} queue={recents} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          artwork={<LogoMark size={84} className="opacity-60" />}
          title="Der Verlauf ist noch leer"
          text="Sobald du einen Sender startest, taucht er hier auf — praktisch für den nächsten Morgen."
          action={
            <button
              type="button"
              onClick={() => setView('home')}
              className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-[12px] font-semibold text-[#05060a] transition-[filter] hover:brightness-110"
            >
              <History size={13} />
              Zum Entdecken
            </button>
          }
        />
      )}
    </div>
  )
}
