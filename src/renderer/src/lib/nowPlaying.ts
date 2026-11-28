import type { TrackMetadata } from '@shared/types'
import type { Station } from './types'

/**
 * Die Startseiten-Sender stellen ihre aktuellen Titel öffentlich bereit
 * (alle mit Access-Control-Allow-Origin: *). Andere Sender liefern nur
 * ICY-Metadaten im Stream, die ein Browser nicht auslesen kann.
 *
 * Für Sender ohne eigene API nutzen wir zusätzlich die öffentliche
 * Radioplayer-API. Sie funktioniert für viele deutsche Stationen und
 * liefert die Titel als JSON mit CORS.
 */
const HARMONY_ENDPOINT =
  'https://www.harmonyfm.de/update-onair-info' +
  '?tx_ffhonair_pi2%5Baction%5D=getallsonginfo' +
  '&tx_ffhonair_pi2%5Bcontroller%5D=Webradio&type=210'

const DASDING_ENDPOINT =
  'https://www.dasding.de/~webradio/administration/dasding-playerbar-100~playerbarContainer.json'

const JAMFM_ENDPOINT = 'https://www.jam.fm/services/program-info/live/jam'

const WDR_ENDPOINTS: Record<string, string> = {
  'curated-wdr2': 'https://www.wdr.de/radio/radiotext/streamtitle_wdr2.txt',
  'curated-einslive': 'https://www.wdr.de/radio/radiotext/streamtitle_1live.txt'
}

/** Radioplayer rpIds (Sender-IDs) der Stationen mit öffentlicher JSON-API. */
const RADIOPLAYER_STATIONS: Record<string, string> = {
  'curated-deutschlandfunk': '386'
}

const RADIOPLAYER_ENDPOINT = 'https://core-search.radioplayer.cloud/276/qp/v4/events/'

/** Wie lange ein Radioplayer-Titel nach seinem Ende noch als aktuell gilt. */
const RADIOPLAYER_GRACE_MS = 6 * 60_000

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

interface JamFmTrack {
  artist?: string
  title?: string
  type?: string
}

interface JamFmChannel {
  name?: string
  channelKey?: string
  playHistories?: Array<{ track?: JamFmTrack; start?: number }>
}

interface RadioplayerItem {
  name?: string
  artistName?: string
  song?: boolean
  stopTime?: string
}

interface RadioplayerResponse {
  results?: {
    now?: RadioplayerItem
    previous?: RadioplayerItem[]
  }
}

interface SomaFmSong {
  title?: string
  artist?: string
  date?: string
}

interface SomaFmResponse {
  songs?: SomaFmSong[]
}

interface KexpPlay {
  artist?: string
  song?: string
  airdate?: string
}

interface KexpResponse {
  results?: KexpPlay[]
}

function toTrack(artist: string | undefined, title: string | undefined): TrackMetadata | null {
  const cleanArtist = artist?.trim() ?? ''
  const cleanTitle = title?.trim() ?? ''
  if (!cleanTitle) return null
  return {
    raw: cleanArtist ? `${cleanArtist} — ${cleanTitle}` : cleanTitle,
    artist: cleanArtist,
    title: cleanTitle
  }
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

async function fetchJamFm(): Promise<TrackMetadata | null> {
  const response = await fetch(JAMFM_ENDPOINT, { cache: 'no-store' })
  if (!response.ok) return null

  const channels = (await response.json()) as JamFmChannel[]
  const channel =
    channels.find((entry) => entry.channelKey === 'jamfm-live') ??
    channels.find((entry) => entry.name === 'air')
  const track = channel?.playHistories?.[0]?.track
  if (!track) return null

  return toTrack(track.artist, track.title)
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

function radioplayerTrack(item: RadioplayerItem | undefined): TrackMetadata | null {
  if (!item || !item.name?.trim()) return null
  return toTrack(item.artistName, item.name)
}

async function fetchRadioplayer(rpId: string): Promise<TrackMetadata | null> {
  const response = await fetch(`${RADIOPLAYER_ENDPOINT}?rpId=${encodeURIComponent(rpId)}`, {
    cache: 'no-store'
  })
  if (!response.ok) return null

  const data = (await response.json()) as RadioplayerResponse
  const current = radioplayerTrack(data.results?.now)
  if (current) return current

  // Während Werbung oder Programmstrecken liefert `now` nur Senderinfos.
  // Der letzte Song aus `previous` ist dann der beste verfügbare Titel –
  // aber nur, solange er nicht schon vor Minuten zu Ende war.
  const previous = [...(data.results?.previous ?? [])].reverse()
  const lastSong = previous.find((item) => item.song && item.name?.trim() && item.artistName?.trim())
  if (!lastSong) return null

  const stopTime = Number(lastSong.stopTime)
  if (Number.isFinite(stopTime) && Date.now() - stopTime * 1000 > RADIOPLAYER_GRACE_MS) return null

  return radioplayerTrack(lastSong)
}

async function fetchSomaFm(station: Station): Promise<TrackMetadata | null> {
  const channel = /somafm\.com\/([a-z0-9]+)-\d/i.exec(station.url)?.[1]
  if (!channel) return null

  const response = await fetch(`https://somafm.com/songs/${channel}.json`, { cache: 'no-store' })
  if (!response.ok) return null

  const data = (await response.json()) as SomaFmResponse
  const song = data.songs?.[0]
  if (!song) return null

  // SomaFM aktualisiert die JSON-Datei im Songtakt; sehr alte Einträge
  // werden ignoriert, damit nach einem Abbruch kein veralteter Titel bleibt.
  const timestamp = Number(song.date)
  if (Number.isFinite(timestamp) && Date.now() - timestamp * 1000 > 15 * 60_000) return null

  return toTrack(song.artist, song.title)
}

async function fetchKexp(): Promise<TrackMetadata | null> {
  const response = await fetch('https://api.kexp.org/v2/plays/?limit=1&format=json', {
    cache: 'no-store'
  })
  if (!response.ok) return null

  const data = (await response.json()) as KexpResponse
  const play = data.results?.[0]
  if (!play) return null

  const airdate = play.airdate ? Date.parse(play.airdate) : NaN
  if (Number.isFinite(airdate) && Date.now() - airdate > 15 * 60_000) return null

  return toTrack(play.artist, play.song)
}

export async function fetchWebTrack(station: Station): Promise<TrackMetadata | null> {
  try {
    if (station.id === 'curated-harmonyfm') return await fetchHarmony()
    if (station.id === 'curated-dasding') return await fetchDasding()
    if (station.id === 'curated-jamfm') return await fetchJamFm()

    const wdrUrl = WDR_ENDPOINTS[station.id]
    if (wdrUrl) return await fetchWdr(wdrUrl)

    const radioplayerId = RADIOPLAYER_STATIONS[station.id]
    if (radioplayerId) return await fetchRadioplayer(radioplayerId)

    if (/somafm\.com\//i.test(station.url)) return await fetchSomaFm(station)
    if (station.id === 'curated-kexp') return await fetchKexp()

    return null
  } catch {
    return null
  }
}
