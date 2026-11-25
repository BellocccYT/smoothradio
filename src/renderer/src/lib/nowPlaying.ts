import type { TrackMetadata } from '@shared/types'
import type { Station } from './types'

/**
 * Die vier Startseiten-Sender stellen ihre aktuellen Titel öffentlich bereit
 * (alle mit Access-Control-Allow-Origin: *). Andere Sender liefern nur
 * ICY-Metadaten im Stream, die ein Browser nicht auslesen kann.
 */
const HARMONY_ENDPOINT =
  'https://www.harmonyfm.de/update-onair-info' +
  '?tx_ffhonair_pi2%5Baction%5D=getallsonginfo' +
  '&tx_ffhonair_pi2%5Bcontroller%5D=Webradio&type=210'

const DASDING_ENDPOINT =
  'https://www.dasding.de/~webradio/administration/dasding-playerbar-100~playerbarContainer.json'

const WDR_ENDPOINTS: Record<string, string> = {
  'curated-wdr2': 'https://www.wdr.de/radio/radiotext/streamtitle_wdr2.txt',
  'curated-einslive': 'https://www.wdr.de/radio/radiotext/streamtitle_1live.txt'
}

interface HarmonySongInfo {
  artist?: string
  title?: string
  claim?: boolean
}

interface DasdingTrack {
  artist?: string
  title?: string
  playingMode?: number
}

interface DasdingResponse {
  playlist?: { data?: DasdingTrack[] }
}

async function fetchHarmony(): Promise<TrackMetadata | null> {
  const response = await fetch(HARMONY_ENDPOINT, { cache: 'no-store' })
  if (!response.ok) return null

  const data = (await response.json()) as Array<Record<string, HarmonySongInfo>>
  const info = data.find((entry) => entry.hrmnational)?.hrmnational
  const title = info?.title?.trim()
  if (!info || !title) return null

  const artist = info.claim ? '' : (info.artist?.trim() ?? '')
  return { raw: artist ? `${artist} — ${title}` : title, artist, title }
}

async function fetchDasding(): Promise<TrackMetadata | null> {
  const response = await fetch(DASDING_ENDPOINT, { cache: 'no-store' })
  if (!response.ok) return null

  const data = (await response.json()) as DasdingResponse
  const tracks = data.playlist?.data ?? []
  const current = tracks.find((entry) => entry.playingMode === 1) ?? tracks[0]
  const artist = current?.artist?.trim()
  const title = current?.title?.trim()
  if (!artist || !title) return null

  return { raw: `${artist} — ${title}`, artist, title }
}

async function fetchWdr(url: string): Promise<TrackMetadata | null> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) return null

  // WDR liefert ISO-8859-1, nicht UTF-8.
  const raw = new TextDecoder('iso-8859-1').decode(await response.arrayBuffer()).trim()
  if (!raw || raw.length > 240) return null

  const separator = raw.indexOf(' - ')
  if (separator > 0) {
    const artist = raw.slice(0, separator).trim()
    const title = raw.slice(separator + 3).trim()
    if (artist && title) return { raw, artist, title }
  }

  // Bei Sendungen statt Songs steht dort der Programmname.
  return { raw, artist: '', title: raw }
}

export async function fetchWebTrack(station: Station): Promise<TrackMetadata | null> {
  try {
    if (station.id === 'curated-harmonyfm') return await fetchHarmony()
    if (station.id === 'curated-dasding') return await fetchDasding()

    const wdrUrl = WDR_ENDPOINTS[station.id]
    if (wdrUrl) return await fetchWdr(wdrUrl)

    return null
  } catch {
    return null
  }
}
