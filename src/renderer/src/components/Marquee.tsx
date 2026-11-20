import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

export function Marquee({
  text,
  className
}: {
  text: string
  className?: string
}): React.JSX.Element {
  const measureRef = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const measure = (): void => {
      if (measureRef.current) setWidth(measureRef.current.scrollWidth)
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth)
    }
    measure()
    const frame = requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [text])

  const overflow = width > containerWidth + 4 && containerWidth > 0
  const duration = Math.max(12, Math.round(width / 38))

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      <span ref={measureRef} className="pointer-events-none invisible absolute whitespace-nowrap">
        {text}
      </span>
      <div
        className={overflow ? 'marquee-track' : 'truncate'}
        style={
          overflow
            ? ({
                '--marquee-shift': `-${width + 32}px`,
                animationDuration: `${duration}s`
              } as React.CSSProperties)
            : undefined
        }
      >
        <span className="whitespace-nowrap">{text}</span>
        {overflow && <span className="whitespace-nowrap pl-8">{text}</span>}
      </div>
    </div>
  )
}
