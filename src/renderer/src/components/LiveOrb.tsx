import type { Station } from '../lib/types'
import { cn, stationColors } from '../lib/utils'
import { Artwork } from './Artwork'
import { Visualizer } from './Visualizer'

interface LiveOrbProps {
  station: Station
  playing: boolean
  className?: string
  initialsClassName?: string
  showPill?: boolean
}

export function LiveOrb({
  station,
  playing,
  className,
  initialsClassName = 'text-[54px]',
  showPill = true
}: LiveOrbProps): React.JSX.Element {
  const colors = stationColors(station.name)

  return (
    <div className={cn('relative aspect-square', className)}>
      <div
        className="absolute inset-[7%] rounded-full opacity-70 blur-3xl"
        style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 68%)` }}
      />

      <div
        className="absolute inset-0 rounded-full p-[2px]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${colors.from} 90deg, ${colors.to} 180deg, transparent 290deg)`,
          animation: playing ? 'spin-slow 16s linear infinite' : 'none'
        }}
      >
        <div className="size-full rounded-full bg-[#08080e]" />
      </div>

      <div className="absolute inset-[3%] rounded-full border border-white/[0.05]" />
      <div className="absolute inset-[6.5%] rounded-full border border-dashed border-white/[0.07]" />

      <div
        className="absolute inset-[10%] overflow-hidden rounded-full"
        style={{ boxShadow: `0 30px 70px -25px ${colors.glow}, inset 0 0 0 1px rgba(255,255,255,0.09)` }}
      >
        <Artwork
          station={station}
          className="size-full rounded-full"
          initialsClassName={initialsClassName}
          imageClassName="p-[21%]"
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-full opacity-25"
          style={{
            background:
              'repeating-radial-gradient(circle at center, transparent 0 6px, rgba(0,0,0,0.35) 6px 7px)'
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_118%,rgba(0,0,0,0.5),transparent_56%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_22%,rgba(255,255,255,0.28),transparent_45%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 ring-1 ring-white/25" />
      </div>

      {showPill && (
        <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 backdrop-blur-xl">
          <Visualizer playing={playing} bars={14} height={16} className="w-10" />
          <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/60">
            {playing ? 'On Air' : 'Paused'}
          </span>
        </div>
      )}
    </div>
  )
}
