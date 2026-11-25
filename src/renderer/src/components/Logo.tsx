import { cn } from '../lib/utils'
import { BRAND } from '@shared/brand'
import appIcon from '../assets/app-icon.png'

export function Logo({ size = 42, className }: { size?: number; className?: string }): React.JSX.Element {
  return (
    <img
      src={appIcon}
      width={size}
      height={size}
      alt={BRAND.name}
      draggable={false}
      className={cn('rounded-[26%] shadow-[0_16px_40px_-18px_rgba(56,189,248,0.75)]', className)}
      style={{ width: size, height: size }}
    />
  )
}

export function LogoMark({ size = 96, className }: { size?: number; className?: string }): React.JSX.Element {
  const gradientId = `logo-gradient-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="290" y1="760" x2="740" y2="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5EEAD4" />
          <stop offset="0.34" stopColor="#38BDF8" />
          <stop offset="0.68" stopColor="#818CF8" />
          <stop offset="1" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      <g transform="rotate(-6 512 512)">
        <circle cx="372" cy="512" r="58" fill={`url(#${gradientId})`} />
        <g fill="none" stroke={`url(#${gradientId})`} strokeLinecap="round">
          <path d="M 480 373 A 176 176 0 0 1 480 651" strokeWidth="72" />
          <path d="M 557 276 A 300 300 0 0 1 557 748" strokeWidth="72" />
          <path d="M 633 178 A 424 424 0 0 1 633 846" strokeWidth="72" />
        </g>
      </g>
    </svg>
  )
}
