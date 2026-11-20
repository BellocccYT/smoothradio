import { useEffect, useRef, useState } from 'react'
import { Search, Settings2, X } from 'lucide-react'
import { usePlayer } from '../store/player'
import { genres } from '../lib/stations'
import { cn } from '../lib/utils'
import { DiscordIcon } from './DiscordIcon'

export function Header({ onOpenSettings }: { onOpenSettings: () => void }): React.JSX.Element {
  const view = usePlayer((state) => state.view)
  const genre = usePlayer((state) => state.genre)
  const query = usePlayer((state) => state.query)
  const setQuery = usePlayer((state) => state.setQuery)
  const discord = usePlayer((state) => state.discord)
  const settings = usePlayer((state) => state.settings)
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const handler = (): void => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener('smooth:focus-search', handler)
    return () => window.removeEventListener('smooth:focus-search', handler)
  }, [])

  const genreMeta = genres.find((item) => item.id === genre)
  const heading =
    view === 'home'
      ? { eyebrow: 'Willkommen', title: 'Entdecken' }
      : view === 'search'
        ? { eyebrow: 'Finden', title: 'Suche' }
        : view === 'favorites'
          ? { eyebrow: 'Deine Sammlung', title: 'Favoriten' }
          : view === 'history'
            ? { eyebrow: 'Zuletzt gehört', title: 'Verlauf' }
            : { eyebrow: 'Stimmung', title: genreMeta?.label ?? 'Genre' }

  const discordColor =
    discord.state === 'ready'
      ? 'bg-emerald-400'
      : discord.state === 'connecting'
        ? 'bg-amber-400'
        : discord.state === 'error'
          ? 'bg-red-400'
          : 'bg-white/25'

  return (
    <div className="sticky top-0 z-20 bg-gradient-to-b from-[#07070b] via-[#07070b]/92 to-transparent px-7 pb-5 pt-5 backdrop-blur-[6px]">
      <div className="flex items-end gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-white/28">{heading.eyebrow}</p>
          <h1 className="mt-1 font-display text-[24px] font-semibold leading-none tracking-[-0.025em] text-white">
            {heading.title}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div
            className={cn(
              'flex h-10 items-center gap-2.5 rounded-2xl border bg-white/[0.035] pl-3 pr-2.5 transition-all duration-300',
              focused
                ? 'border-[var(--accent)]/40 bg-white/[0.055] shadow-[0_0_0_4px_var(--accent-soft)]'
                : 'border-white/[0.07]'
            )}
          >
            <Search size={15} className={focused ? 'text-[var(--accent)]' : 'text-white/35'} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.currentTarget.blur()
                  if (!query) usePlayer.getState().setView('home')
                }
              }}
              placeholder="Sender, Genre oder Stadt …"
              aria-label="Sender suchen"
              className="w-[200px] bg-transparent text-[12.5px] text-white/85 outline-none placeholder:text-white/25"
              spellCheck={false}
            />
            {query ? (
              <button
                type="button"
                aria-label="Suche leeren"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="grid size-5 place-items-center rounded-full text-white/35 hover:bg-white/10 hover:text-white/80"
              >
                <X size={11} />
              </button>
            ) : (
              <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-white/30">
                Ctrl K
              </kbd>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            title={discord.message ?? 'Discord Rich Presence'}
            className="flex h-10 items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 text-[11.5px] font-medium text-white/55 transition-colors hover:border-white/12 hover:bg-white/[0.06] hover:text-white/85"
          >
            <DiscordIcon className="size-4 text-[#8b9cf7]" />
            <span className={cn('size-1.5 rounded-full', discordColor)} />
            <span className={cn('hidden lg:inline', discord.state === 'ready' && 'text-emerald-300/80')}>
              {discord.state === 'ready' ? 'Discord live' : settings?.discordEnabled ? 'Discord' : 'RPC aus'}
            </span>
          </button>

          <button
            type="button"
            aria-label="Einstellungen öffnen"
            onClick={onOpenSettings}
            className="grid size-10 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-white/45 transition-colors hover:border-white/12 hover:bg-white/[0.06] hover:text-white/85"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
