import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Compass, Heart, History, Plus, Search, Settings2 } from 'lucide-react'
import { usePlayer } from '../store/player'
import { genres } from '../lib/stations'
import { cn } from '../lib/utils'
import { bridge, isDesktop } from '../lib/bridge'
import { Logo } from './Logo'

const navItems = [
  { id: 'home', label: 'Entdecken', icon: Compass },
  { id: 'search', label: 'Suche', icon: Search },
  { id: 'favorites', label: 'Favoriten', icon: Heart },
  { id: 'history', label: 'Verlauf', icon: History }
] as const

export function focusSearch(): void {
  window.dispatchEvent(new CustomEvent('smooth:focus-search'))
}

export function Sidebar({
  onOpenSettings,
  onOpenAddStream,
  onOpenLegal
}: {
  onOpenSettings: () => void
  onOpenAddStream: () => void
  onOpenLegal: () => void
}): React.JSX.Element {
  const view = usePlayer((state) => state.view)
  const genre = usePlayer((state) => state.genre)
  const favorites = usePlayer((state) => state.favorites)
  const setView = usePlayer((state) => state.setView)
  const [version, setVersion] = useState('')

  useEffect(() => {
    bridge.app.version().then(setVersion).catch(() => setVersion(''))
  }, [])

  return (
    <aside className="relative z-10 hidden w-[238px] shrink-0 flex-col border-r border-white/[0.05] bg-black/20 px-3.5 pb-3 pt-5 lg:flex">
      <button
        type="button"
        onClick={() => setView('home')}
        className="group flex items-center gap-3 rounded-2xl px-1.5 py-1.5 text-left outline-none"
      >
        <Logo size={40} />
        <div className="min-w-0">
          <p className="font-display text-[15.5px] font-semibold leading-tight tracking-[-0.02em] text-white">
            Funk<span className="text-white/45">kunst</span>
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-white/28">
            {isDesktop ? 'Desktop Radio' : 'Webradio'}
          </p>
        </div>
      </button>

      <nav className="mt-7 space-y-1">
        {navItems.map((item) => {
          const active = view === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'search') {
                  setView('search')
                  focusSearch()
                } else {
                  setView(item.id)
                }
              }}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors duration-200',
                active ? 'text-white' : 'text-white/48 hover:bg-white/[0.04] hover:text-white/85'
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl border border-white/[0.07] bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                />
              )}
              <item.icon
                size={15.5}
                strokeWidth={1.9}
                className={cn('relative z-10', active && 'text-[var(--accent)]')}
              />
              <span className="relative z-10">{item.label}</span>
              {item.id === 'favorites' && favorites.length > 0 && (
                <span className="relative z-10 ml-auto rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[9.5px] tabular-nums text-white/45">
                  {favorites.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-8 flex items-center justify-between px-3">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/25">Stimmungen</span>
      </div>
      <div className="mt-2.5 space-y-0.5">
        {genres.slice(0, 6).map((item) => {
          const active = view === 'genre' && genre === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView('genre', item.id)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg px-3 py-[7px] text-left text-[12.5px] transition-colors',
                active ? 'bg-white/[0.05] text-white' : 'text-white/45 hover:bg-white/[0.035] hover:text-white/80'
              )}
            >
              <span
                className="size-1.5 rounded-full transition-transform duration-200 group-hover:scale-125"
                style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
              />
              {item.label}
              {active && <span className="ml-auto size-1 rounded-full bg-[var(--accent)]" />}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onOpenAddStream}
        className="mt-6 flex items-center gap-2.5 rounded-xl border border-dashed border-white/12 px-3 py-2.5 text-[12px] font-medium text-white/45 transition-colors hover:border-[var(--accent)]/40 hover:bg-white/[0.03] hover:text-white/85"
      >
        <Plus size={14} />
        Eigenen Stream hinzufügen
      </button>

      <div className="mt-auto space-y-2 pt-5">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/85"
        >
          <Settings2 size={15} />
          Einstellungen
        </button>
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={onOpenLegal}
            className="text-[10px] text-white/25 underline decoration-white/15 underline-offset-2 transition-colors hover:text-white/60"
          >
            Datenschutz
          </button>
          <span className="text-[10px] tabular-nums text-white/20">{version ? `v${version.split(' ')[0]}` : ''}</span>
        </div>
      </div>
    </aside>
  )
}
