import { useEffect, useRef } from 'react'
import { cn } from '../lib/utils'

interface VisualizerProps {
  playing: boolean
  bars?: number
  className?: string
  height?: number
}

export function Visualizer({ playing, bars = 28, className, height = 34 }: VisualizerProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playingRef = useRef(playing)

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let frame = 0
    const phases = Array.from({ length: bars }, (_, index) => index * 0.9 + Math.sin(index * 12.9898) * 4)
    const levels = new Array<number>(bars).fill(0.08)
    let accent = '#5eead4'

    const resize = (): void => {
      const dpr = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const rectHeight = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(rectHeight * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5eead4'
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    const rounded = (x: number, y: number, width: number, rectHeight: number, radius: number): void => {
      const r = Math.min(radius, width / 2, rectHeight / 2)
      context.beginPath()
      context.moveTo(x + r, y)
      context.arcTo(x + width, y, x + width, y + rectHeight, r)
      context.arcTo(x + width, y + rectHeight, x, y + rectHeight, r)
      context.arcTo(x, y + rectHeight, x, y, r)
      context.arcTo(x, y, x + width, y, r)
      context.closePath()
      context.fill()
    }

    const draw = (time: number): void => {
      const width = canvas.clientWidth
      const rectHeight = canvas.clientHeight
      context.clearRect(0, 0, width, rectHeight)

      const gap = Math.max(1.5, width / (bars * 3.4))
      const barWidth = Math.max(1.6, (width - gap * (bars - 1)) / bars)
      const gradient = context.createLinearGradient(0, rectHeight, 0, 0)
      gradient.addColorStop(0, accent)
      gradient.addColorStop(1, 'rgba(255,255,255,0.92)')
      context.fillStyle = gradient
      context.shadowColor = accent
      context.shadowBlur = 10

      for (let index = 0; index < bars; index++) {
        const phase = phases[index] ?? index
        const wobble = Math.sin(time * 0.0018 + phase) * 0.5 + 0.5
        const sparkle = Math.sin(time * 0.0052 + index * 0.63) * 0.5 + 0.5
        const centerBias = 1 - Math.abs(index - (bars - 1) / 2) / ((bars - 1) / 2)
        const target = playingRef.current
          ? Math.min(1, 0.12 + wobble * 0.5 * (0.45 + centerBias * 0.55) + sparkle * 0.4)
          : 0.045 + 0.035 * (Math.sin(time * 0.0011 + index) * 0.5 + 0.5)
        levels[index] += (target - levels[index]) * (playingRef.current ? 0.16 : 0.06)
        const barHeight = Math.max(2, levels[index] * rectHeight)
        rounded(index * (barWidth + gap), rectHeight - barHeight, barWidth, barHeight, barWidth / 2)
      }

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [bars])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('block opacity-90 transition-opacity duration-500', playing ? 'opacity-95' : 'opacity-55', className)}
      style={{ height }}
    />
  )
}
