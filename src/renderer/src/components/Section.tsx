import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

export function SectionHeader({
  title,
  subtitle,
  onMore,
  moreLabel = 'Alle anzeigen'
}: {
  title: string
  subtitle?: string
  onMore?: () => void
  moreLabel?: string
}): React.JSX.Element {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-white/92">{title}</h2>
        {subtitle && <p className="mt-1 text-[12px] text-white/35">{subtitle}</p>}
      </div>
      {onMore && (
        <button
          type="button"
          onClick={onMore}
          className="group flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.07] px-3 py-1.5 text-[11px] font-medium text-white/45 transition-colors hover:border-white/15 hover:text-white/85"
        >
          {moreLabel}
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  )
}

export function SkeletonGrid({ count = 10 }: { count?: number }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse p-2.5">
          <div className="aspect-square rounded-[15px] bg-white/[0.045]" />
          <div className="mt-3 h-3 w-3/4 rounded-full bg-white/[0.05]" />
          <div className="mt-2 h-2.5 w-1/2 rounded-full bg-white/[0.035]" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  artwork,
  title,
  text,
  action
}: {
  artwork: ReactNode
  title: string
  text: string
  action?: ReactNode
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-white/[0.08] px-8 py-16 text-center">
      <div className="mb-6 opacity-80">{artwork}</div>
      <h3 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-white/85">{title}</h3>
      <p className="mt-2 max-w-[380px] text-[12.5px] leading-relaxed text-white/35">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry
}: {
  message: string
  onRetry: () => void
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-400/15 bg-red-500/[0.04] px-5 py-4">
      <p className="text-[12.5px] text-red-200/70">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border border-white/10 px-3.5 py-1.5 text-[11px] font-medium text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
      >
        Erneut versuchen
      </button>
    </div>
  )
}
