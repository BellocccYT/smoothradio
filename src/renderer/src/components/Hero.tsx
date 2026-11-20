import { motion } from 'motion/react'
import { ArrowUpRight, Heart, Loader2, Pause, Play, Radio } from 'lucide-react'
import { usePlayer } from '../store/player'
import { bridge } from '../lib/bridge'
import { curatedStations, featuredStation } from '../lib/stations'
import { cn, formatBitrate, stationColors } from '../lib/utils'
import { LogoMark } from './Logo'
import { LiveOrb } from './LiveOrb'

export function Hero(): React.JSX.Element {
  const current = usePlayer((state) => state.current)
  const nowPlaying = usePlayer((state) => state.nowPlaying)
  const isPlaying = usePlayer((state) => state.isPlaying)
  const isLoading = usePlayer((state) => state.isLoading)
  const favorites = usePlayer((state) => state.favorites)
  const playStation = usePlayer((state) => state.playStation)
  const togglePlay = usePlayer((state) => state.togglePlay)
  const toggleFavorite = usePlayer((state) => state.toggleFavorite)
  const setView = usePlayer((state) => state.setView)

  const station = current ?? featuredStation
  const colors = stationColors(station.name)
  const isFavorite = favorites.some((item) => item.id === station.id)
  const isCurrent = Boolean(current) && current?.id === station.id

  const title = current ? current.name : 'Radio, aber smooth.'
  const eyebrow = current ? (isPlaying ? 'Jetzt live' : 'Bereit zum Weiterhören') : 'Dein neuer Lieblingssender'
  const nowLine = nowPlaying
    ? nowPlaying.artist
      ? `${nowPlaying.artist} — ${nowPlaying.title}`
      : nowPlaying.raw
    : current
      ? current.description ?? 'Live-Stream'
      : 'Handverlesene Sender, ein lebendiges Spektrum und Discord Rich Presence. Ein Klick, und die Welt klingt besser.'

  const handlePrimary = (): void => {
    if (current) void togglePlay()
    else void playStation(featuredStation, curatedStations)
  }

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/[0.07]">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(110% 150% at 82% 6%, ${colors.glow} 0%, transparent 52%), linear-gradient(116deg, #111119 0%, #0a0a11 46%, #07070b 100%)`
        }}
      />
      <div className="absolute -left-24 bottom-[-140px] size-[340px] rounded-full bg-[var(--accent)] opacity-[0.07] blur-[90px]" />
      <div className="absolute right-[-90px] top-[-120px] size-[320px] rounded-full bg-white opacity-[0.04] blur-[100px]" />
      <div className="grain absolute inset-0" />
      <div className="absolute -right-10 top-1/2 hidden -translate-y-1/2 opacity-[0.035] md:block">
        <LogoMark size={420} />
      </div>

      <div className="relative grid gap-6 px-8 py-8 md:grid-cols-[minmax(0,1fr)_300px] md:items-center md:py-9 xl:px-10">
        <div className="max-w-[620px]">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/60 backdrop-blur">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  isPlaying ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]' : 'bg-white/35'
                )}
              />
              {eyebrow}
            </span>
            {current?.curated && (
              <span className="rounded-full border border-white/[0.07] px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white/25">
                Kuratiert
              </span>
            )}
          </div>

          <motion.h2
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="font-display mt-3.5 text-[clamp(30px,3.6vw,44px)] font-semibold leading-[1.04] tracking-[-0.035em] text-white"
          >
            {title}
          </motion.h2>

          <p
            className={cn(
              'mt-3 line-clamp-2 max-w-[520px] text-[13px] leading-relaxed',
              nowPlaying ? 'text-white/70' : 'text-white/40'
            )}
          >
            {nowLine}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {current ? (
              <>
                <span className="rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[10px] text-white/45">
                  {formatBitrate(current.bitrate, current.codec)}
                </span>
                <span className="rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[10px] text-white/45">
                  {current.country ?? 'Weltweit'}
                </span>
                {current.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[10px] text-white/45"
                  >
                    {tag}
                  </span>
                ))}
              </>
            ) : (
              <>
                {['24/7 live', 'Kein Account nötig', 'Discord RPC'].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[10px] text-white/45"
                  >
                    {chip}
                  </span>
                ))}
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrimary}
              className="group flex h-[46px] items-center gap-2.5 rounded-full bg-[var(--accent)] px-5 text-[13px] font-semibold text-[#05060a] shadow-[0_16px_40px_-14px_var(--accent)] transition-[filter] hover:brightness-110"
            >
              {isLoading && isCurrent ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isPlaying && isCurrent ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              {isPlaying && isCurrent ? 'Pause' : current ? 'Weiterhören' : 'Jetzt reinhören'}
            </button>

            {current ? (
              <button
                type="button"
                onClick={() => {
                  if (current.homepage) void bridge.app.openExternal(current.homepage)
                }}
                className="flex h-[46px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-[12.5px] font-medium text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90"
              >
                Sender-Website
                <ArrowUpRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView('search')}
                className="flex h-[46px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-[12.5px] font-medium text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90"
              >
                <Radio size={14} />
                Sender entdecken
              </button>
            )}

            {current && (
              <button
                type="button"
                aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                onClick={() => toggleFavorite(current)}
                className={cn(
                  'grid size-[46px] place-items-center rounded-full border transition-colors',
                  isFavorite
                    ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                    : 'border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/85'
                )}
              >
                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </div>

        <div className="hidden justify-center md:flex">
          <LiveOrb station={station} playing={isPlaying && isCurrent} className="size-[290px]" />
        </div>
      </div>
    </section>
  )
}

