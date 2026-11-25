import { Client as DiscordClient, type SetActivity } from '@xhayper/discord-rpc'
import type { AppSettings, DiscordStatus, PresencePayload } from '@shared/types'

type StatusListener = (status: DiscordStatus) => void

const MAX_TEXT = 128

function cut(value: string, max = MAX_TEXT): string {
  const trimmed = value.replace(/\s+/g, ' ').trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

export class DiscordService {
  private client: DiscordClient | null = null
  private settings: AppSettings
  private presence: PresencePayload | null = null
  private status: DiscordStatus = { state: 'off' }
  private listener: StatusListener
  private connectionAttempt = 0
  private retryTimer: NodeJS.Timeout | null = null
  private disposed = false

  constructor(settings: AppSettings, listener: StatusListener) {
    this.settings = settings
    this.listener = listener
  }

  getStatus(): DiscordStatus {
    return this.status
  }

  applySettings(settings: AppSettings): void {
    const previous = this.settings
    this.settings = settings
    const idChanged = previous.discordClientId !== settings.discordClientId
    const toggleChanged = previous.discordEnabled !== settings.discordEnabled

    if (!settings.discordEnabled) {
      void this.disconnect()
      this.setStatus({ state: 'off', message: 'Rich Presence ist deaktiviert.' })
      return
    }

    if (!settings.discordClientId.trim()) {
      void this.disconnect()
      this.setStatus({ state: 'error', message: 'Keine Discord Application-ID hinterlegt.' })
      return
    }

    if (idChanged || toggleChanged || !this.client) {
      void this.connect()
    } else {
      void this.pushPresence()
    }
  }

  async setPresence(presence: PresencePayload | null): Promise<void> {
    this.presence = presence
    await this.pushPresence()
  }

  async reconnect(): Promise<DiscordStatus> {
    await this.disconnect()
    await this.connect()
    return this.status
  }

  async connect(): Promise<void> {
    if (this.disposed || !this.settings.discordEnabled || !this.settings.discordClientId.trim()) return
    if (this.client?.isConnected) {
      await this.pushPresence()
      return
    }

    await this.disconnect()
    const attempt = ++this.connectionAttempt
    this.setStatus({ state: 'connecting', message: 'Verbinde mit Discord …' })

    const client = new DiscordClient({
      clientId: this.settings.discordClientId.trim(),
      transport: { type: 'ipc' }
    })
    this.client = client

    client.on('ready', () => {
      if (attempt !== this.connectionAttempt) return
      this.setStatus({
        state: 'ready',
        message: 'Rich Presence aktiv',
        username: client.user?.username
      })
      void this.pushPresence()
    })

    client.on('disconnected', () => {
      if (attempt !== this.connectionAttempt) return
      this.client = null
      if (!this.settings.discordEnabled) return
      this.setStatus({ state: 'error', message: 'Verbindung zu Discord verloren. Neuer Versuch …' })
      this.scheduleRetry()
    })

    try {
      await client.login()
    } catch (error) {
      if (attempt !== this.connectionAttempt) return
      this.client = null
      this.setStatus({
        state: 'error',
        message: this.friendlyError(error)
      })
      this.scheduleRetry()
    }
  }

  async disconnect(): Promise<void> {
    this.connectionAttempt++
    this.clearRetry()
    const client = this.client
    this.client = null
    if (!client) return
    try {
      await client.user?.clearActivity()
    } catch {
      // Discord may already be gone
    }
    try {
      await client.destroy()
    } catch {
      // ignore
    }
  }

  dispose(): void {
    this.disposed = true
    void this.disconnect()
  }

  private scheduleRetry(): void {
    this.clearRetry()
    this.retryTimer = setTimeout(() => {
      if (!this.disposed && this.settings.discordEnabled) void this.connect()
    }, 20_000)
  }

  private clearRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  private setStatus(status: DiscordStatus): void {
    this.status = status
    this.listener(status)
  }

  private buildActivity(): SetActivity | null {
    const presence = this.presence
    if (!presence) return null

    const station = cut(presence.stationName)
    const nowPlaying = presence.nowPlaying?.trim()

    const activity: SetActivity = {
      type: 2,
      details: cut(presence.playing && nowPlaying ? nowPlaying : presence.playing ? station : `Pausiert · ${station}`),
      state: cut(presence.playing ? `auf ${station}` : 'Funkkunst'),
      instance: false,
      largeImageKey: this.settings.discordLargeImageKey.trim() || 'logo',
      largeImageText: cut(nowPlaying ? `${nowPlaying} · ${station}` : station)
    }

    if (presence.playing) {
      activity.startTimestamp = presence.startedAt ?? Date.now()
    }

    if (this.settings.discordShowButtons && presence.stationUrl) {
      const url = presence.stationUrl.trim()
      if (/^https?:\/\//i.test(url)) {
        activity.buttons = [{ label: 'Sender öffnen', url }]
      }
    }

    return activity
  }

  private async pushPresence(): Promise<void> {
    const client = this.client
    if (!client?.isConnected) return
    const activity = this.buildActivity()
    if (!activity) {
      try {
        await client.user?.clearActivity()
      } catch {
        // ignore
      }
      return
    }

    // Some Discord clients reject individual fields (e.g. missing assets or buttons).
    // Fall back step by step so the presence still appears.
    const variants: SetActivity[] = [activity]
    if (activity.buttons) variants.push({ ...activity, buttons: undefined })
    if (activity.largeImageKey) variants.push({ ...activity, buttons: undefined, largeImageKey: undefined })

    for (const variant of variants) {
      try {
        await client.user?.setActivity(variant)
        return
      } catch (error) {
        console.warn('[discord] activity variant rejected', error)
      }
    }
  }

  private friendlyError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error)
    if (/ENOENT|Could not connect|pipe/i.test(message)) {
      return 'Discord läuft nicht oder RPC ist nicht erreichbar. Bitte Discord öffnen.'
    }
    if (/invalid client|client id/i.test(message)) {
      return 'Die Application-ID wurde von Discord abgelehnt.'
    }
    return `Discord-Fehler: ${message.slice(0, 140)}`
  }
}
