import { Pause, Play, X } from 'lucide-react'
import type { Station } from '../lib/types'
import { usePlayer } from '../store/player'
import { cn } from '../lib/utils'
import { Artwork } from './Artwork'

export function CompactRow({
  station,
  queue,
  onRemove,
  index
}: {
  station: Station
  queue?: Station[]
  onRemove?: (id: string) => void
  index?: number
}): React.JSX.Element {
  const current = usePlayer((state) => state.current)
  const isPlaying = usePlayer((state) => state.isPlaying)
  const isLoading = usePlayer((state) => state.isLoading)
  const playStation = usePlayer((state) => state.playStation)
  const togglePlay = usePlayer((state) => state.togglePlay)

  const isCurrent = current?.id === station.id

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isCurrent) void togglePlay()
        else void playStation(station, queue)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (isCurrent) void togglePlay()
          else void playStation(station, queue)
        }
      }}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-2.5 py-2 transition-colors hover:border-white/[0.06] hover:bg-white/[0.035]',
        isCurrent && 'border-white/[0.06] bg-white/[0.03]'
      )}
    >
      {typeof index === 'number' && (
        <span className="w-5 shrink-0 text-center text-[11px] tabular-nums text-white/20">{index + 1}</span>
      )}
      <Artwork station={station} className="size-11 shrink-0 rounded-xl" initialsClassName="text-[13px]" />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-[12.5px] font-medium',
            isCurrent ? 'text-[var(--accent)]' : 'text-white/85'
          )}
        >
          {station.name}
        </p>
        <p className="mt-0.5 truncate text-[10.5px] text-white/35">
          {[station.country, station.tags.slice(0, 2).join(', ')].filter(Boolean).join(' · ') || 'Live Radio'}
        </p>
      </div>

      {isCurrent && isPlaying ? (
        <span className="eq mr-1">
          <span />
          <span />
          <span />
          <span />
        </span>
      ) : null}

      <button
        type="button"
        aria-label={isCurrent && isPlaying ? 'Pause' : 'Abspielen'}
        onClick={(event) => {
          event.stopPropagation()
          if (isCurrent) void togglePlay()
          else void playStation(station, queue)
        }}
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full text-white/40 transition-all hover:bg-white/[0.07] hover:text-white',
          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        {isCurrent && isLoading ? (
          <span className="size-3 animate-spin rounded-full border border-white/30 border-t-white" />
        ) : isCurrent && isPlaying ? (
          <Pause size={12} fill="currentColor" />
        ) : (
          <Play size={12} fill="currentColor" />
        )}
      </button>

      {onRemove && (
        <button
          type="button"
          aria-label="Stream entfernen"
          onClick={(event) => {
            event.stopPropagation()
            onRemove(station.id)
          }}
          className="grid size-7 shrink-0 place-items-center rounded-full text-white/20 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
