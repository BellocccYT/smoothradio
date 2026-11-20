import http from 'node:http'
import https from 'node:https'
import { EventEmitter } from 'node:events'
import type { TrackMetadata } from '@shared/types'

const USER_AGENT = 'SmoothRadio/1.0 (Windows; desktop radio client)'
const MAX_BYTES = 160_000
const POLL_INTERVAL = 20_000

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
}

function cleanTitle(value: string): string {
  return decodeEntities(value)
    .replace(/\0/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

function parseTrack(raw: string): TrackMetadata {
  const cleaned = cleanTitle(raw)
  const separators = [' - ', ' – ', ' — ', ' | ']
  for (const separator of separators) {
    const index = cleaned.indexOf(separator)
    if (index > 0 && index < cleaned.length - separator.length) {
      return {
        raw: cleaned,
        artist: cleaned.slice(0, index).trim(),
        title: cleaned.slice(index + separator.length).trim()
      }
    }
  }
  return { raw: cleaned }
}

function readStreamTitle(url: string, redirects = 0): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (value: string | null): void => {
      if (settled) return
      settled = true
      resolve(value)
    }

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      finish(null)
      return
    }

    const transport = parsed.protocol === 'https:' ? https : http
    let request: http.ClientRequest
    try {
      request = transport.get(
        parsed,
        {
          headers: {
            'Icy-MetaData': '1',
            'User-Agent': USER_AGENT,
            Accept: '*/*',
            Connection: 'close'
          },
          timeout: 9000
        },
        (response) => {
          const status = response.statusCode ?? 0
          if (status >= 300 && status < 400 && response.headers.location && redirects < 5) {
            response.resume()
            response.destroy()
            readStreamTitle(new URL(response.headers.location, parsed).toString(), redirects + 1).then(finish)
            return
          }
          if (status >= 400) {
            response.resume()
            response.destroy()
            finish(null)
            return
          }

          const metaInt = Number(response.headers['icy-metaint'])
          if (!metaInt || Number.isNaN(metaInt) || metaInt <= 0) {
            response.resume()
            response.destroy()
            finish(null)
            return
          }

          let buffer = Buffer.alloc(0)

          response.on('data', (chunk: Buffer) => {
            buffer = Buffer.concat([buffer, chunk])

            let offset = metaInt
            while (buffer.length >= offset + 1) {
              const length = buffer[offset] * 16
              if (buffer.length < offset + 1 + length) break

              if (length > 0) {
                const block = buffer.subarray(offset + 1, offset + 1 + length).toString('utf8')
                const match = /StreamTitle=(['"])([\s\S]*?)\1\s*;/.exec(block)
                if (match?.[2]?.trim()) {
                  response.destroy()
                  finish(match[2].trim())
                  return
                }
              }

              offset += 1 + length + metaInt
            }

            if (buffer.length > MAX_BYTES) {
              response.destroy()
              finish(null)
            }
          })

          response.on('end', () => finish(null))
          response.on('error', () => finish(null))
        }
      )
    } catch {
      finish(null)
      return
    }

    request.on('timeout', () => {
      request.destroy()
      finish(null)
    })
    request.on('error', () => finish(null))
  })
}

class MetadataService extends EventEmitter {
  private url: string | null = null
  private timer: NodeJS.Timeout | null = null
  private retryTimer: NodeJS.Timeout | null = null
  private retries = 0
  private lastRaw = ''
  private inFlight = false

  subscribe(url: string): void {
    this.stopPolling()
    this.url = url
    this.lastRaw = ''
    this.retries = 0
    if (!url) return

    const poll = async (): Promise<void> => {
      if (!this.url) return
      if (this.inFlight) return
      this.inFlight = true
      const current = this.url
      try {
        const title = await readStreamTitle(current)
        if (this.url !== current) return
        if (!title) {
          // The first connection often races with the audio stream on busy
          // icecast servers. Retry quickly instead of waiting a full interval.
          if (this.retries < 6) {
            this.retries += 1
            this.clearRetry()
            this.retryTimer = setTimeout(() => void poll(), 2500)
          }
          return
        }
        this.retries = 0
        this.clearRetry()
        if (title === this.lastRaw) return
        this.lastRaw = title
        this.emit('track', parseTrack(title))
      } catch {
        // metadata is best-effort
      } finally {
        this.inFlight = false
      }
    }

    void poll()
    this.timer = setInterval(poll, POLL_INTERVAL)
  }

  unsubscribe(): void {
    this.url = null
    this.lastRaw = ''
    this.retries = 0
    this.stopPolling()
  }

  private clearRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  private stopPolling(): void {
    this.clearRetry()
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}

export const metadataService = new MetadataService()
