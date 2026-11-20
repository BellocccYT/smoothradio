import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowUpRight,
  Heart,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'
import { usePlayer } from '../store/player'
import { bridge } from '../lib/bridge'
import { curatedStations, featuredStation } from '../lib/stations'
import { cn, formatBitrate, stationColors } from '../lib/utils'
import { LiveOrb } from './LiveOrb'
import { Visualizer } from './Visualizer'
import { SleepControl } from './SleepControl'
import { DiscordIcon } from './DiscordIcon'
import { Artwork } from './Artwork'
import { Logo } from './Logo'

function ControlButton({
  label,
  onClick,
  children,
  className
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'grid size-10 place-items-center rounded-full text-white/55 transition-all hover:bg-white/[0.07] hover:text-white',
        className
      )}
    >
      {children}
    </button>
  )
}

export function FullscreenPlayer(): React.JSX.Element {
  const current = usePlayer((state) => state.current)
  const queue = usePlayer((state) => state.queue)
  const nowPlaying = usePlayer((state) => state.nowPlaying)
  const isPlaying = usePlayer((state) => state.isPlaying)
  const isLoading = usePlayer((state) => state.isLoading)
  const favorites = usePlayer((state) => state.favorites)
  const volume = usePlayer((state) => state.volume)
  const muted = usePlayer((state) => state.muted)
  const discord = usePlayer((state) => state.discord)
  const setFullscreen = usePlayer((state) => state.setFullscreen)
  const playStation = usePlayer((state) => state.playStation)
  const togglePlay = usePlayer((state) => state.togglePlay)
  const next = usePlayer((state) => state.next)
  const previous = usePlayer((state) => state.previous)
  const setVolume = usePlayer((state) => state.setVolume)
  const toggleMute = usePlayer((state) => state.toggleMute)
  const toggleFavorite = usePlayer((state) => state.toggleFavorite)

  const [osFullscreen, setOsFullscreen] = useState(false)

  useEffect(() => {
    return bridge.window.onState((state) => setOsFullscreen(state.fullscreen))
  }, [])

  const station = current ?? featuredStation
  const colors = stationColors(station.name)
  const isFavorite = current ? favorites.some((item) => item.id === current.id) : false
  const isCurrent = Boolean(current)

  const activeList = queue.length ? queue : curatedStations
  const currentIndex = activeList.findIndex((item) => item.id === current?.id)
  const upcoming = isCurrent
    ? [...activeList.slice(currentIndex + 1), ...activeList.slice(0, Math.max(0, currentIndex))].slice(0, 5)
    : curatedStations.slice(1, 6)

  const title = current ? current.name : 'Radio, aber smooth.'
  const songTitle = nowPlaying?.title ?? (nowPlaying?.raw || '')
  const artist = nowPlaying?.artist ?? ''
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  const randomStation = (): void => {
    const pool = curatedStations.filter((item) => item.id !== current?.id)
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? featuredStation
    void playStation(pick, curatedStations)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.015 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.01 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#050509]"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(115% 130% at 78% 2%, ${colors.from}4d 0%, transparent 54%), radial-gradient(90% 110% at 4% 100%, ${colors.to}33 0%, transparent 62%), linear-gradient(145deg, #0c0c14 0%, #06060a 58%, #040407 100%)`
        }}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute -left-40 top-1/4 size-[560px] rounded-full opacity-25 blur-[150px]"
        style={{ background: colors.from }}
      />
      <div
        className="absolute -right-32 bottom-0 size-[480px] rounded-full opacity-20 blur-[140px]"
        style={{ background: colors.to }}
      />
      <div className="grain absolute inset-0" />

      <header className="drag-region relative z-10 flex shrink-0 items-center justify-between px-7 py-5 xl:px-10">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <div>
            <p className="font-display text-[13px] font-semibold leading-tight tracking-[-0.01em] text-white/90">
              SmoothRadio
            </p>
            <p className="text-[8.5px] uppercase tracking-[0.24em] text-white/25">Fullscreen Player</p>
          </div>
        </div>

        <div className="no-drag flex items-center gap-1">
          <ControlButton
            label={osFullscreen ? 'Vollbild verlassen' : 'Vollbild'}
            onClick={() => void bridge.window.toggleFullscreen()}
            className="size-9"
          >
            {osFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </ControlButton>
          <ControlButton label="Minimieren" onClick={() => void bridge.window.minimize()} className="size-9">
            <Minus size={14} />
          </ControlButton>
          <ControlButton label="Player schließen (Esc)" onClick={() => setFullscreen(false)} className="size-9">
            <X size={15} />
          </ControlButton>
        </div>
      </header>

      <div className="relative z-10 min-h-0 flex-1">
        <div className="mx-auto grid h-full max-w-[1500px] grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] items-center gap-10 px-10 xl:gap-16 xl:px-16">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 22, delay: 0.05 }}
              className="w-[min(36vw,430px)]"
            >
              <LiveOrb
                station={station}
                playing={isPlaying && isCurrent}
                initialsClassName="text-[76px]"
                showPill={false}
                className="w-full"
              />
            </motion.div>
          </div>

          <div className="min-w-0 max-w-[700px]">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/65 backdrop-blur">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    isPlaying ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]' : 'bg-white/35'
                  )}
                />
                {isCurrent ? (isPlaying ? 'Jetzt live' : 'Pausiert') : 'Bereit'}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">{station.country ?? 'Weltweit'}</span>
              {discord.state === 'ready' && (
                <span className="flex items-center gap-1.5 rounded-full border border-indigo-400/15 bg-indigo-500/10 px-2 py-1 text-[9px] font-medium text-indigo-200/80">
                  <DiscordIcon className="size-3" />
                  Discord live
                </span>
              )}
            </div>

            <h1 className="font-display mt-4 text-[clamp(32px,3.8vw,60px)] font-semibold leading-[0.99] tracking-[-0.045em] text-white">
              {title}
            </h1>

            <div className="mt-4 min-h-[54px]">
              {artist && (
                <p className="text-[10.5px] font-medium uppercase tracking-[0.24em] text-[var(--accent)]/80">{artist}</p>
              )}
              <p className="mt-1 line-clamp-1 text-[clamp(17px,1.6vw,25px)] font-medium tracking-[-0.01em] text-white/85">
                {songTitle || (current ? current.tags.slice(0, 2).join(' · ') || 'Live Radio' : 'Dein Radio für den perfekten Moment.')}
              </p>
              {!nowPlaying && current?.description && (
                <p className="mt-2 line-clamp-2 max-w-[560px] text-[12px] leading-relaxed text-white/35">
                  {current.description}
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                current ? formatBitrate(current.bitrate, current.codec) : '24/7 live',
                ...(current ? current.tags.slice(0, 3) : ['Ohne Konto', 'Handverlesen', 'Discord RPC'])
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[9.5px] text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-1.5">
              <ControlButton label="Zufälliger Sender" onClick={randomStation} className="size-11">
                <Shuffle size={17} />
              </ControlButton>
              <ControlButton label="Vorheriger Sender" onClick={() => void previous()} className="size-11">
                <SkipBack size={19} fill="currentColor" />
              </ControlButton>

              <motion.button
                type="button"
                aria-label={isPlaying ? 'Pause' : 'Abspielen'}
                onClick={() => void togglePlay()}
                whileTap={{ scale: 0.95 }}
                className="mx-2 grid size-[64px] place-items-center rounded-full bg-[var(--accent)] text-[#05060a] shadow-[0_16px_50px_-10px_var(--accent)] transition-[filter] hover:brightness-110"
              >
                {isLoading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-1" />
                )}
              </motion.button>

              <ControlButton label="Nächster Sender" onClick={() => void next()} className="size-11">
                <SkipForward size={19} fill="currentColor" />
              </ControlButton>

              <div className="mx-2 h-7 w-px bg-white/[0.08]" />

              <ControlButton
                label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                onClick={() => current && toggleFavorite(current)}
                className={cn('size-11', isFavorite && 'text-rose-300 hover:text-rose-200')}
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              </ControlButton>

              {current?.homepage && (
                <ControlButton
                  label="Sender-Website"
                  onClick={() => void bridge.app.openExternal(current.homepage!)}
                  className="size-11"
                >
                  <ArrowUpRight size={18} />
                </ControlButton>
              )}
            </div>

            <div className="mt-5 max-w-[580px]">
              <Visualizer playing={isPlaying && isCurrent} bars={54} height={46} className="w-full" />
              <div className="mt-1.5 flex items-center justify-between text-[8px] font-medium uppercase tracking-[0.24em] text-white/25">
                <span className="flex items-center gap-1.5">
                  <span className={cn('size-1 rounded-full', isPlaying ? 'animate-pulse bg-red-400' : 'bg-white/25')} />
                  Live Signal
                </span>
                <span>{current?.codec ?? 'Stream'}</span>
              </div>
            </div>

            <div className="mt-5 flex max-w-[580px] items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={muted ? 'Ton einschalten' : 'Stummschalten'}
                  onClick={toggleMute}
                  className="grid size-8 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <VolumeIcon size={17} />
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={muted ? 0 : Math.round(volume * 100)}
                  onChange={(event) => setVolume(Number(event.target.value) / 100)}
                  aria-label="Lautstärke"
                  className="slim-range w-[150px] cursor-pointer"
                  style={{ '--fill': `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
                />
                <span className="w-7 text-[9px] tabular-nums text-white/25">
                  {muted ? '0' : Math.round(volume * 100)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <SleepControl />
                <span className="hidden items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-white/20 lg:flex">
                  <span className="rounded border border-white/10 px-1 py-0.5 font-mono text-[8px]">ESC</span>
                  schließen
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 shrink-0 px-7 pb-5 xl:px-10">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/25">Als Nächstes</span>
          <span className="text-[9px] text-white/15">{activeList.length} Sender in der Warteschlange</span>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {upcoming.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void playStation(item, activeList)}
              className="group flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.022] p-2 pr-4 text-left transition-colors hover:border-white/10 hover:bg-white/[0.05]"
            >
              <Artwork station={item} className="size-9 shrink-0 rounded-lg" initialsClassName="text-[10px]" />
              <div className="min-w-0">
                <p className="max-w-[190px] truncate text-[11px] font-medium text-white/65 transition-colors group-hover:text-white/90">
                  {item.name}
                </p>
                <p className="mt-0.5 max-w-[190px] truncate text-[9px] text-white/25">
                  {item.tags.slice(0, 2).join(' · ') || 'Live Radio'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </footer>
    </motion.div>
  )
}
