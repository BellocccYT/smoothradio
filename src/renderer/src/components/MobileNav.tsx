import { Compass, Heart, History, Search, Settings2 } from 'lucide-react'
import { usePlayer } from '../store/player'
import { cn } from '../lib/utils'
import { focusSearch } from './Sidebar'

const items = [
  { id: 'home', label: 'Entdecken', icon: Compass },
  { id: 'search', label: 'Suche', icon: Search },
  { id: 'favorites', label: 'Favoriten', icon: Heart },
  { id: 'history', label: 'Verlauf', icon: History }
] as const

/** Kompakte Navigation für die Website auf schmalen Bildschirmen. */
export function MobileNav({ onOpenSettings }: { onOpenSettings: () => void }): React.JSX.Element {
  const view = usePlayer((state) => state.view)
  const setView = usePlayer((state) => state.setView)

  return (
    <nav className="relative z-20 flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/[0.05] bg-black/20 px-2 py-1.5 lg:hidden">
      {items.map((item) => {
        const active = view === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setView(item.id)
              if (item.id === 'search') focusSearch()
            }}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9.5px] font-medium transition-colors',
              active ? 'bg-white/[0.06] text-white' : 'text-white/40'
            )}
          >
            <item.icon
              size={16}
              strokeWidth={1.9}
              className={cn(active && 'text-[var(--accent)]')}
            />
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Einstellungen"
        className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9.5px] font-medium text-white/40"
      >
        <Settings2 size={16} strokeWidth={1.9} />
        <span>Mehr</span>
      </button>
    </nav>
  )
}
