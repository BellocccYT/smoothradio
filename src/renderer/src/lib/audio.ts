import type { Station } from './types'
import { isHlsUrl, clamp } from './utils'

interface Handlers {
  onPlaying?: () => void
  onWaiting?: () => void
  onPause?: () => void
  onError?: (message: string) => void
}

class AudioEngine {
  private readonly audio = new Audio()
  private hls: { destroy: () => void } | null = null
  private loadToken = 0
  private handlers: Handlers = {}
  private volume = 0.8
  private fadeFrame: number | null = null

  constructor() {
    this.audio.preload = 'none'
    this.audio.volume = this.volume
    this.audio.addEventListener('playing', () => {
      this.handlers.onPlaying?.()
      this.fadeTo(this.volume, 700)
    })
    this.audio.addEventListener('waiting', () => this.handlers.onWaiting?.())
    this.audio.addEventListener('stalled', () => this.handlers.onWaiting?.())
    this.audio.addEventListener('pause', () => this.handlers.onPause?.())
    this.audio.addEventListener('error', () => {
      if (!this.audio.currentSrc) return
      this.handlers.onError?.(this.describeError())
    })
  }

  setHandlers(handlers: Handlers): void {
    this.handlers = handlers
  }

  async play(station: Station): Promise<void> {
    const token = ++this.loadToken
    const wantsHls = Boolean(station.hls) || isHlsUrl(station.url)

    this.destroyHls()
    this.cancelFade()
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
    this.audio.volume = 0

    if (wantsHls) {
      try {
        const { default: Hls } = await import('hls.js')
        if (token !== this.loadToken) return
        if (Hls.isSupported()) {
          const instance = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30
          })
          this.hls = instance
          instance.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) instance.startLoad()
            else this.handlers.onError?.('Der HLS-Stream konnte nicht geladen werden.')
          })
          instance.on(Hls.Events.MANIFEST_PARSED, () => {
            void this.audio.play().catch((error) => this.handlePlayError(error, token))
          })
          instance.loadSource(station.url)
          instance.attachMedia(this.audio)
          return
        }
        this.audio.src = station.url
      } catch {
        this.audio.src = station.url
      }
    } else {
      this.audio.src = station.url
    }

    this.audio.load()
    try {
      await this.audio.play()
    } catch (error) {
      this.handlePlayError(error, token)
    }
  }

  async resume(): Promise<void> {
    if (!this.audio.currentSrc) return
    this.audio.volume = 0
    try {
      await this.audio.play()
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        this.handlers.onError?.('Wiedergabe konnte nicht gestartet werden.')
      }
    }
  }

  pause(): void {
    this.cancelFade()
    this.audio.pause()
  }

  stop(): void {
    this.loadToken++
    this.cancelFade()
    this.destroyHls()
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
  }

  setVolume(value: number): void {
    this.volume = clamp(value, 0, 1)
    if (this.fadeFrame === null) this.audio.volume = this.volume
  }

  get currentTime(): number {
    return this.audio.currentTime
  }

  get hasSource(): boolean {
    return Boolean(this.audio.currentSrc) || Boolean(this.hls)
  }

  private fadeTo(target: number, duration: number): void {
    this.cancelFade()
    const start = this.audio.volume
    const startAt = performance.now()
    const step = (now: number): void => {
      const progress = Math.min(1, (now - startAt) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      this.audio.volume = clamp(start + (target - start) * eased, 0, 1)
      if (progress < 1) this.fadeFrame = requestAnimationFrame(step)
      else this.fadeFrame = null
    }
    this.fadeFrame = requestAnimationFrame(step)
  }

  private cancelFade(): void {
    if (this.fadeFrame !== null) {
      cancelAnimationFrame(this.fadeFrame)
      this.fadeFrame = null
    }
  }

  private destroyHls(): void {
    if (this.hls) {
      try {
        this.hls.destroy()
      } catch {
        // ignore
      }
      this.hls = null
    }
  }

  private handlePlayError(error: unknown, token: number): void {
    if (token !== this.loadToken) return
    const name = (error as DOMException)?.name
    if (name === 'AbortError') return
    if (name === 'NotAllowedError') {
      this.handlers.onError?.('Wiedergabe wurde blockiert. Bitte erneut auf Play drücken.')
      return
    }
    this.handlers.onError?.(this.describeError())
  }

  private describeError(): string {
    const error = this.audio.error
    if (!error) return 'Der Stream konnte nicht geladen werden.'
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'Der Stream wurde abgebrochen.'
      case MediaError.MEDIA_ERR_NETWORK:
        return 'Netzwerkfehler: Der Stream ist gerade nicht erreichbar.'
      case MediaError.MEDIA_ERR_DECODE:
        return 'Der Stream konnte nicht dekodiert werden.'
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'Stream nicht erreichbar oder Format nicht unterstützt.'
      default:
        return 'Unbekannter Wiedergabefehler.'
    }
  }
}

export const audioEngine = new AudioEngine()
