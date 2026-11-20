import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

const HUES = [166, 186, 202, 218, 236, 252, 270, 288, 306, 326, 342, 18, 38]

function hash(seed: string): number {
  let value = 2166136261
  for (let index = 0; index < seed.length; index++) {
    value ^= seed.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return Math.abs(value)
}

export function stationColors(seed: string): { from: string; to: string; glow: string; hue: number } {
  const hue = HUES[hash(seed) % HUES.length]
  return {
    from: `hsl(${hue} 78% 55%)`,
    to: `hsl(${(hue + 40) % 360} 84% 59%)`,
    glow: `hsla(${hue}, 90%, 58%, 0.3)`,
    hue
  }
}

export function initials(name: string): string {
  const cleaned = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return '··'
  const words = cleaned.split(' ')
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}

export function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url)
}

export function isPlaylistUrl(url: string): boolean {
  return /\.(pls|m3u|xspf|asx)(\?|$)/i.test(url)
}

export function formatBitrate(bitrate?: number, codec?: string): string {
  const codecLabel = (codec || '').toUpperCase().replace('MP3', 'MP3').replace('AAC', 'AAC')
  if (bitrate && bitrate > 0) return `${bitrate} kbps${codecLabel ? ` · ${codecLabel}` : ''}`
  if (codecLabel) return codecLabel
  return 'Live'
}

export function countryLabel(country?: string): string {
  if (!country) return 'Weltweit'
  return country
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}
