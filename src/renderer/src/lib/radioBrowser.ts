import { isHlsUrl, isPlayableUrl, isPlaylistUrl } from './utils'
import { isWebApp } from './env'
import type { Station } from './types'

const HOSTS = [
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://all.api.radio-browser.info'
]

interface RawStation {
  stationuuid: string
  name: string
  url: string
  url_resolved?: string
  homepage?: string
  favicon?: string
  tags?: string
  country?: string
  codec?: string
  bitrate?: number
  hls?: number
  lastcheckok?: number
  clickcount?: number
}

const cache = new Map<string, { at: number; stations: Station[] }>()
const mirrorCache = new Map<string, { at: number; url: string | null }>()
const CACHE_TTL = 3 * 60 * 1000
const MIRROR_TTL = 10 * 60 * 1000

function mapStation(raw: RawStation): Station | null {
  const url = (raw.url_resolved || raw.url || '').trim()
  if (!url || !isPlayableUrl(url)) return null
  if (isPlaylistUrl(url)) return null
  if (raw.lastcheckok === 0) return null
  const name = (raw.name || '').replace(/\s+/g, ' ').trim()
  if (!name) return null

  const favicon = raw.favicon?.trim()
  const safeFavicon =
    favicon && (!isWebApp || /^https:\/\//i.test(favicon) || favicon.startsWith('//')) ? favicon : undefined

  return {
    id: raw.stationuuid,
    name,
    url,
    homepage: raw.homepage?.trim() || undefined,
    favicon: safeFavicon,
    tags: (raw.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 4),
    country: raw.country?.trim() || undefined,
    codec: raw.codec?.trim() || undefined,
    bitrate: raw.bitrate && raw.bitrate > 0 ? raw.bitrate : undefined,
    hls: raw.hls === 1 || isHlsUrl(url)
  }
}

function dedupe(stations: Station[], limit: number): Station[] {
  const seen = new Set<string>()
  const output: Station[] = []
  for (const station of stations) {
    const key = `${station.name.toLowerCase()}|${station.url}`
    if (seen.has(key)) continue
    seen.add(key)
    output.push(station)
    if (output.length >= limit) break
  }
  return output
}

async function request(path: string, ttl = CACHE_TTL): Promise<Station[]> {
  const cached = cache.get(path)
  if (cached && Date.now() - cached.at < ttl) return cached.stations

  let lastError: unknown = null
  for (const host of HOSTS) {
    try {
      const response = await fetch(`${host}${path}`, {
        signal: AbortSignal.timeout(12_000),
        headers: { Accept: 'application/json' }
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = (await response.json()) as RawStation[]
      if (!Array.isArray(payload)) throw new Error('Unexpected payload')
      const stations = dedupe(
        payload.map(mapStation).filter((station): station is Station => station !== null),
        120
      )
      cache.set(path, { at: Date.now(), stations })
      return stations
    } catch (error) {
      lastError = error
    }
  }

  if (cached) return cached.stations
  throw new Error(
    lastError instanceof Error && lastError.name === 'TimeoutError'
      ? 'Radio-Browser antwortet zu langsam. Bitte gleich nochmal versuchen.'
      : 'Radio-Browser ist gerade nicht erreichbar. Prüfe deine Verbindung.'
  )
}

export async function fetchTrending(limit = 24): Promise<Station[]> {
  const stations = await request('/json/stations/topclick/120')
  return stations.slice(0, limit)
}

export async function searchStations(query: string, limit = 48): Promise<Station[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const params = new URLSearchParams({
    name: trimmed,
    limit: String(limit),
    hidebroken: 'true',
    order: 'clickcount',
    reverse: 'true'
  })
  const stations = await request(`/json/stations/search?${params.toString()}`)
  if (stations.length > 0) return stations.slice(0, limit)

  const tagParams = new URLSearchParams({
    tag: trimmed,
    limit: String(limit),
    hidebroken: 'true',
    order: 'clickcount',
    reverse: 'true'
  })
  return (await request(`/json/stations/search?${tagParams.toString()}`)).slice(0, limit)
}

/**
 * HLS radio streams often have no ICY metadata. Radio-Browser usually knows
 * an MP3 mirror of the same station, which does. Use it only for metadata,
 * playback stays on the original (higher quality) stream.
 */
export async function findIcyMirror(station: Station): Promise<string | null> {
  const key = station.name.toLowerCase()
  const cached = mirrorCache.get(key)
  if (cached && Date.now() - cached.at < MIRROR_TTL) return cached.url

  const query = station.name.replace(/\s*\(\s*\d+\s*kbps[^)]*\)/gi, '').trim()
  const params = new URLSearchParams({
    name: query || station.name,
    limit: '30',
    hidebroken: 'true',
    order: 'clickcount',
    reverse: 'true'
  })

  try {
    const candidates = await request(`/json/stations/search?${params.toString()}`)
    const usable = candidates.filter(
      (candidate) =>
        candidate.id !== station.id &&
        !candidate.hls &&
        !isPlaylistUrl(candidate.url) &&
        candidate.url !== station.url
    )
    const https = usable.filter((candidate) => candidate.url.startsWith('https://'))
    const mp3 =
      https.find((candidate) => /\.mp3(\?|$)/i.test(candidate.url) || /mp3/i.test(candidate.codec ?? '')) ??
      usable.find((candidate) => /\.mp3(\?|$)/i.test(candidate.url) || /mp3/i.test(candidate.codec ?? ''))
    const mirror = mp3 ?? https[0] ?? usable[0] ?? null
    mirrorCache.set(key, { at: Date.now(), url: mirror?.url ?? null })
    return mirror?.url ?? null
  } catch {
    mirrorCache.set(key, { at: Date.now(), url: null })
    return null
  }
}

export async function fetchByTag(tag: string, limit = 60): Promise<Station[]> {
  const params = new URLSearchParams({
    tag,
    limit: String(limit),
    hidebroken: 'true',
    order: 'clickcount',
    reverse: 'true'
  })
  return (await request(`/json/stations/search?${params.toString()}`, 5 * 60 * 1000)).slice(0, limit)
}

