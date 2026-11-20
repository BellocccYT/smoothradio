import { useRef } from 'react'
import { motion } from 'motion/react'
import {
  Heart,
  Loader2,
  Maximize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX
} from 'lucide-react'
import { usePlayer } from '../store/player'
import { cn } from '../lib/utils'
import { Artwork } from './Artwork'
import { Marquee } from './Marquee'
import { Visualizer } from './Visualizer'
import { DiscordIcon } from './DiscordIcon'
import { SleepControl } from './SleepControl'

export function PlayerBar({ onOpenSettings }: { onOpenSettings: () => void }): React.JSX.Element {
  const current = usePlayer((state) => state.current)
  const isPlaying = usePlayer((state) => state.isPlaying)
  const isLoading = usePlayer((state) => state.isLoading)
  const nowPlaying = usePlayer((state) => state.nowPlaying)
  const error = usePlayer((state) => state.error)
  const volume = usePlayer((state) => state.volume)
  const muted = usePlayer((state) => state.muted)
  const favorites = usePlayer((state) => state.favorites)
  const discord = usePlayer((state) => state.discord)
  const togglePlay = usePlayer((state) => state.togglePlay)
  const next = usePlayer((state) => state.next)
  const previous = usePlayer((state) => state.previous)
  const setVolume = usePlayer((state) => state.setVolume)
  const toggleMute = usePlayer((state) => state.toggleMute)
  const toggleFavorite = usePlayer((state) => state.toggleFavorite)
  const setFullscreen = usePlayer((state) => state.setFullscreen)

  const volumeRef = useRef<HTMLInputElement>(null)

  const isFavorite = current ? favorites.some((item) => item.id === current.id) : false
  const secondary = error
    ? error
    : nowPlaying
      ? nowPlaying.artist
        ? `${nowPlaying.artist} — ${nowPlaying.title}`
        : nowPlaying.raw
      : current
        ? current.tags.length
          ? current.tags.slice(0, 3).join(' · ')
          : 'Live Radio'
        : 'Wähle einen Sender und drück Play.'

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <footer className="relative z-30 px-3 pb-3">
      <div className="glass hairline relative flex h-[84px] items-center rounded-[26px] border border-white/[0.08] px-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)]">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {current ? (
            <Artwork station={current} className="size-[56px] shrink-0 rounded-[17px]" initialsClassName="text-[15px]" />
          ) : (
            <div className="grid size-[56px] shrink-0 place-items-center rounded-[17px] border border-white/[0.06] bg-white/[0.03]">
              <span className="size-2 rounded-full bg-[var(--accent)]/70 shadow-[0_0_16px_var(--accent)]" />
            </div>
          )}

          <div className="min-w-0 flex-1 pr-1">
            <div className="flex items-center gap-2">
              <Marquee
                text={current?.name ?? 'Noch nichts ausgewählt'}
                className="max-w-[220px] text-[13px] font-semibold tracking-[-0.01em] text-white/92"
              />
              {current && (
                <button
                  type="button"
                  aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                  onClick={() => toggleFavorite(current)}
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full transition-all hover:bg-white/[0.06]',
                    isFavorite ? 'text-rose-300' : 'text-white/25 hover:text-white/70'
                  )}
                >
                  <Heart size={13} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={1.9} />
                </button>
              )}
              {isPlaying && (
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-red-400/25 bg-red-500/10 px-1.5 py-[2px] text-[8px] font-bold uppercase tracking-[0.14em] text-red-300">
                  <span className="size-1 animate-pulse rounded-full bg-red-400" />
                  On Air
                </span>
              )}
            </div>
            <Marquee
              text={secondary}
              className={cn(
                'mt-1 max-w-[300px] text-[11.5px]',
                error ? 'text-red-300/80' : 'text-white/42'
              )}
            />
          </div>

        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 px-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Vorheriger Sender"
              onClick={() => void previous()}
              className="grid size-9 place-items-center rounded-full text-white/48 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <SkipBack size={16} fill="currentColor" />
            </button>

            <motion.button
              type="button"
              aria-label={isPlaying ? 'Pause' : 'Abspielen'}
              onClick={() => void togglePlay()}
              whileTap={{ scale: 0.94 }}
              className="relative grid size-[46px] place-items-center rounded-full bg-[var(--accent)] text-[#05060a] shadow-[0_10px_34px_-8px_var(--accent)] transition-[filter] hover:brightness-110"
            >
              {isLoading ? (
                <Loader2 size={19} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </motion.button>

            <button
              type="button"
              aria-label="Nächster Sender"
              onClick={() => void next()}
              className="grid size-9 place-items-center rounded-full text-white/48 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <SkipForward size={16} fill="currentColor" />
            </button>
          </div>
          <span className="text-[8.5px] font-medium uppercase tracking-[0.22em] text-white/22">
            {current?.bitrate ? `${current.bitrate} kbps` : 'Live Radio'}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
          <Visualizer playing={isPlaying} bars={22} className="hidden w-20 lg:block" height={26} />

          <SleepControl />

          <button
            type="button"
            aria-label="Vollbild-Player öffnen"
            title="Vollbild-Player (F)"
            onClick={() => setFullscreen(true)}
            className="grid size-8 place-items-center rounded-full text-white/35 transition-colors hover:bg-white/[0.05] hover:text-white/80"
          >
            <Maximize2 size={14} />
          </button>

          <button
            type="button"
            aria-label="Discord Rich Presence"
            title={
              discord.state === 'ready'
                ? `Rich Presence aktiv${discord.username ? ` als ${discord.username}` : ''}`
                : discord.message ?? 'Discord Rich Presence'
            }
            onClick={onOpenSettings}
            className={cn(
              'grid size-8 place-items-center rounded-full transition-colors hover:bg-white/[0.05]',
              discord.state === 'ready' ? 'text-[#a5b4fc]' : 'text-white/25 hover:text-white/60'
            )}
          >
            <DiscordIcon className="size-[15px]" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={muted ? 'Ton einschalten' : 'Stummschalten'}
              onClick={toggleMute}
              className="grid size-8 place-items-center rounded-full text-white/35 transition-colors hover:bg-white/[0.05] hover:text-white/80"
            >
              <VolumeIcon size={15} />
            </button>
            <input
              ref={volumeRef}
              type="range"
              min={0}
              max={100}
              step={1}
              value={muted ? 0 : Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
              aria-label="Lautstärke"
              className="slim-range w-[80px] cursor-pointer"
              style={{ '--fill': `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
