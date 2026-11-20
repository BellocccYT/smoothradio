import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Check, Info, X } from 'lucide-react'
import { usePlayer } from '../store/player'
import { cn } from '../lib/utils'

export function Toast(): React.JSX.Element {
  const toast = usePlayer((state) => state.toast)
  const dismiss = usePlayer((state) => state.dismissToast)

  const Icon = toast?.tone === 'error' ? AlertTriangle : toast?.tone === 'success' ? Check : Info

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[118px] z-50 flex justify-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex max-w-[520px] items-center gap-3 rounded-2xl border border-white/10 bg-[#101018]/95 px-4 py-2.5 text-[13px] text-white/85 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full',
                toast.tone === 'error'
                  ? 'bg-red-500/15 text-red-300'
                  : toast.tone === 'success'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-white/10 text-white/70'
              )}
            >
              <Icon size={13} strokeWidth={2.2} />
            </span>
            <span className="truncate">{toast.message}</span>
            <button
              type="button"
              onClick={dismiss}
              className="ml-1 grid size-6 place-items-center rounded-full text-white/35 transition-colors hover:bg-white/10 hover:text-white/80"
              aria-label="Hinweis schließen"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
