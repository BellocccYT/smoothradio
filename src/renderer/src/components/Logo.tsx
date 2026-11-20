import { cn } from '../lib/utils'
import appIcon from '../assets/app-icon.png'

export function Logo({ size = 42, className }: { size?: number; className?: string }): React.JSX.Element {
  return (
    <img
      src={appIcon}
      width={size}
      height={size}
      alt="SmoothRadio"
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
      <g transform="rotate(-8 512 512)">
        <path
          d="M 706 300 C 706 174 358 174 358 366 C 358 492 666 470 666 612 C 666 792 318 798 318 656"
          stroke={`url(#${gradientId})`}
          strokeWidth="92"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
