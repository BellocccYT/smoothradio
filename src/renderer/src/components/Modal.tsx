import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../lib/utils'

export function Modal({
  open,
  onClose,
  children,
  className
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-[10px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className={cn(
              'panel relative z-10 w-full max-w-[680px] overflow-hidden rounded-[28px]',
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label: string
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors duration-300',
        checked
          ? 'border-[var(--accent)]/40 bg-[var(--accent)]/85'
          : 'border-white/10 bg-white/[0.08]',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 size-[16px] -translate-y-1/2 rounded-full shadow-sm transition-all duration-300',
          checked ? 'left-[18px] bg-[#06060a]' : 'left-[3px] bg-white/55'
        )}
      />
    </button>
  )
}

export function SettingsRow({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-white/80">{title}</p>
        {description && <p className="mt-0.5 text-[11px] leading-relaxed text-white/30">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
