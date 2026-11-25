import type { Station } from './types'
import { findIcyMirror } from './radioBrowser'
import { bridge } from './bridge'
import { isHlsUrl } from './utils'
import { isWebApp } from './env'
import { fetchWebTrack } from './nowPlaying'
import { usePlayer } from '../store/player'

let activeId: string | null = null
let timer: number | null = null
let webTimer: number | null = null
let token = 0

/**
 * One metadata subscription per station, outside the React effect lifecycle.
 * React re-runs effects during hydration and Strict Mode; doing this in a
 * plain effect used to abort a healthy ICY connection mid-flight.
 */
export function syncMetadata(station: Station | null): void {
  const id = station?.id ?? null
  if (id === activeId) return
  activeId = id

  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
  if (webTimer !== null) {
    window.clearInterval(webTimer)
    webTimer = null
  }
  const currentToken = ++token

  if (!station) {
    void bridge.metadata.unsubscribe()
    return
  }

  // Im Browser gibt es keinen ICY-Zugriff. Sender mit öffentlicher JSON-API
  // werden direkt abgefragt; alle anderen bleiben ohne Live-Titel.
  if (isWebApp) {
    const load = async (): Promise<void> => {
      const track = await fetchWebTrack(station)
      if (currentToken !== token) return
      usePlayer.getState().setNowPlaying(track)
    }
    void load()
    webTimer = window.setInterval(() => void load(), 20_000)
    return
  }

  timer = window.setTimeout(async () => {
    timer = null
    const url =
      station.hls || isHlsUrl(station.url) ? await findIcyMirror(station) : station.url
    if (currentToken !== token || !url) return
    void bridge.metadata.subscribe(url)
  }, 1600)
}
