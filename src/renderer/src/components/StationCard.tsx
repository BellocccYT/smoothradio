import { motion } from 'motion/react'
import { Heart, Loader2, Pause, Play } from 'lucide-react'
import type { Station } from '../lib/types'
import { cn, formatBitrate } from '../lib/utils'
import { Artwork } from './Artwork'
import { usePlayer } from '../store/player'

interface StationCardProps {
  station: Station
  queue?: Station[]
  compact?: boolean
}

export function StationCard({ station, queue, compact = false }: StationCardProps): React.JSX.Element {
  const current = usePlayer((state) => state.current)
  const isPlaying = usePlayer((state) => state.isPlaying)
  const isLoading = usePlayer((state) => state.isLoading)
  const favorites = usePlayer((state) => state.favorites)
  const playStation = usePlayer((state) => state.playStation)
  const togglePlay = usePlayer((state) => state.togglePlay)
  const toggleFavorite = usePlayer((state) => state.toggleFavorite)

  const isCurrent = current?.id === station.id
  const isFavorite = favorites.some((item) => item.id === station.id)
  const showPause = isCurrent && isPlaying

  const handlePlay = (): void => {
    if (isCurrent) void togglePlay()
    else void playStation(station, queue)
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onClick={handlePlay}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handlePlay()
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        'group relative cursor-pointer rounded-[20px] p-2.5 text-left outline-none transition-colors duration-300',
        'hover:bg-white/[0.045] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60',
        compact && 'flex items-center gap-3 p-2'
      )}
    >
      <div className={cn('relative aspect-square overflow-hidden rounded-[15px]', compact && 'size-12 shrink-0')}>
        <Artwork
          station={station}
          className="size-full transition-transform duration-500 ease-out group-hover:scale-[1.035]"
          initialsClassName={compact ? 'text-sm' : 'text-3xl'}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-70" />

        {!compact && (
          <>
            <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
              {station.bitrate ? (
                <span className="rounded-full border border-white/10 bg-black/45 px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-white/70 backdrop-blur-md">
                  {formatBitrate(station.bitrate, station.codec)}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
              onClick={(event) => {
                event.stopPropagation()
                toggleFavorite(station)
              }}
              className={cn(
                'absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full border border-white/10 bg-black/35 text-white/70 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white',
                isFavorite ? 'text-rose-300 opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              <Heart size={12.5} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            if (isCurrent) void togglePlay()
            else void playStation(station, queue)
          }}
          aria-label={showPause ? 'Pause' : 'Abspielen'}
          className={cn(
            'absolute bottom-2.5 right-2.5 grid place-items-center rounded-full bg-[var(--accent)] text-black shadow-[0_10px_28px_-8px_var(--accent)] transition-all duration-300',
            compact ? 'size-8' : 'size-10',
            isCurrent ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
          )}
        >
          {isCurrent && isLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : showPause ? (
            <Pause size={15} fill="currentColor" />
          ) : (
            <Play size={15} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        {isCurrent && (
          <div className="absolute bottom-3 left-2.5">
            <span className="eq">
              <span />
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
      </div>

      <div className={cn('min-w-0 px-1 pb-0.5 pt-3', compact && 'pt-0')}>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'truncate text-[13.5px] font-semibold tracking-[-0.01em]',
              isCurrent ? 'text-[var(--accent)]' : 'text-white/90'
            )}
          >
            {station.name}
          </p>
        </div>
        <p className="mt-0.5 truncate text-[11.5px] text-white/38">
          {[station.country, station.tags[0]].filter(Boolean).join(' · ') || 'Live Radio'}
        </p>
      </div>

      {compact && (
        <button
          type="button"
          aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          onClick={(event) => {
            event.stopPropagation()
            toggleFavorite(station)
          }}
          className={cn(
            'ml-auto mr-2 grid size-7 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/10',
            isFavorite ? 'text-rose-300' : 'text-white/30'
          )}
        >
          <Heart size={13} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </motion.div>
  )
}
