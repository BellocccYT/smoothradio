import type { Station } from './types'
import { findIcyMirror } from './radioBrowser'
import { bridge } from './bridge'
import { isHlsUrl } from './utils'

let activeId: string | null = null
let timer: number | null = null
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
  const currentToken = ++token

  if (!station) {
    void bridge.metadata.unsubscribe()
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
