import { useEffect, useState } from 'react'
import { Copy, Minus, Square, X } from 'lucide-react'
import { bridge, isDesktop } from '../lib/bridge'
import { cn } from '../lib/utils'
import { BRAND } from '@shared/brand'

function WindowButton({
  label,
  onClick,
  children,
  danger = false
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'no-drag flex h-8 w-10 items-center justify-center rounded-lg text-white/45 transition-colors',
        danger ? 'hover:bg-red-500 hover:text-white' : 'hover:bg-white/10 hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

export function TitleBar(): React.JSX.Element {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    return bridge.window.onState((state) => setMaximized(state.maximized))
  }, [])

  return (
    <header
      className="drag-region relative z-30 flex h-9 shrink-0 items-center justify-between border-b border-white/[0.045] bg-black/30 pl-4 pr-1.5"
      onDoubleClick={() => {
        if (isDesktop) void bridge.window.toggleMaximize()
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/32">
          {BRAND.name}
        </span>
        <span className="hidden text-[10px] tracking-[0.16em] text-white/18 sm:inline">
          {isDesktop ? 'Desktop Radio' : 'Webradio'}
        </span>
      </div>

      <div className="flex items-center">
        {isDesktop && (
          <>
            <WindowButton label="Minimieren" onClick={() => void bridge.window.minimize()}>
              <Minus size={13} strokeWidth={1.8} />
            </WindowButton>
            <WindowButton label={maximized ? 'Wiederherstellen' : 'Maximieren'} onClick={() => void bridge.window.toggleMaximize()}>
              {maximized ? <Copy size={11} strokeWidth={1.8} /> : <Square size={10.5} strokeWidth={1.8} />}
            </WindowButton>
            <WindowButton label="Schließen" danger onClick={() => void bridge.window.close()}>
              <X size={13} strokeWidth={1.8} />
            </WindowButton>
          </>
        )}
      </div>
    </header>
  )
}
