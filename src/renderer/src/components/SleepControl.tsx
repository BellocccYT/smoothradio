import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Timer } from 'lucide-react'
import { usePlayer } from '../store/player'
import { cn } from '../lib/utils'

const sleepOptions = [15, 30, 60, 90]

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function SleepControl({ className }: { className?: string }): React.JSX.Element {
  const sleepEndsAt = usePlayer((state) => state.sleepEndsAt)
  const setSleep = usePlayer((state) => state.setSleep)
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!sleepEndsAt) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [sleepEndsAt])

  const remaining = sleepEndsAt ? sleepEndsAt - now : 0

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Sleep-Timer"
        onClick={() => setOpen((value) => !value)}
        title="Sleep-Timer"
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-full border px-2 text-[10px] font-medium tabular-nums transition-colors',
          sleepEndsAt
            ? 'border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'border-transparent text-white/35 hover:bg-white/[0.05] hover:text-white/75',
          className
        )}
      >
        <Timer size={14} />
        {sleepEndsAt ? formatRemaining(remaining) : ''}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="panel absolute bottom-[calc(100%+10px)] right-0 z-50 w-48 rounded-2xl p-1.5"
            >
              <p className="px-2.5 pb-1.5 pt-1 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Sleep-Timer
              </p>
              {sleepOptions.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => {
                    setSleep(minutes)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  In {minutes} Minuten
                </button>
              ))}
              {sleepEndsAt && (
                <button
                  type="button"
                  onClick={() => {
                    setSleep(null)
                    setOpen(false)
                  }}
                  className="mt-1 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-200"
                >
                  Ausschalten
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
