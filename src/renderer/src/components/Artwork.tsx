import { useEffect, useState } from 'react'
import type { Station } from '../lib/types'
import { cn, initials, stationColors } from '../lib/utils'

interface ArtworkProps {
  station: Station
  className?: string
  initialsClassName?: string
  imageClassName?: string
}

export function Artwork({ station, className, initialsClassName, imageClassName }: ArtworkProps): React.JSX.Element {
  const [failed, setFailed] = useState(false)
  const colors = stationColors(station.name)
  const src = station.favicon?.startsWith('//') ? `https:${station.favicon}` : station.favicon
  const lightLogo = station.logoBackground === 'light' && Boolean(src) && !failed

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <div
      className={cn('relative isolate overflow-hidden', className)}
      style={{
        background: lightLogo
          ? 'linear-gradient(135deg, #ffffff 0%, #e9e9ef 100%)'
          : `radial-gradient(125% 125% at 18% 8%, ${colors.from} 0%, ${colors.to} 58%, #0b0b12 130%)`
      }}
    >
      {!lightLogo && (
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 78% 82%, rgba(255,255,255,0.6) 0%, transparent 46%), radial-gradient(circle at 15% 92%, rgba(0,0,0,0.55) 0%, transparent 55%)'
          }}
        />
      )}
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 size-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]',
            lightLogo ? 'p-[11%]' : 'p-[16%]',
            imageClassName
          )}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span
            className={cn(
              'font-display font-semibold tracking-[-0.04em] text-white/95 drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]',
              initialsClassName ?? 'text-2xl'
            )}
          >
            {initials(station.name)}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
    </div>
  )
}
