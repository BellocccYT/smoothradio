export interface AppSettings {
  discordEnabled: boolean
  discordClientId: string
  discordShowButtons: boolean
  discordLargeImageKey: string
  closeToTray: boolean
  launchAtLogin: boolean
  startHidden: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  discordEnabled: false,
  discordClientId: '',
  discordShowButtons: true,
  discordLargeImageKey: 'logo',
  closeToTray: true,
  launchAtLogin: false,
  startHidden: false
}

export type DiscordConnectionState = 'off' | 'connecting' | 'ready' | 'error'

export interface DiscordStatus {
  state: DiscordConnectionState
  message?: string
  username?: string
}

export interface PresencePayload {
  stationName: string
  nowPlaying?: string
  stationUrl?: string
  playing: boolean
  startedAt?: number
}

export interface TrackMetadata {
  /** Raw ICY StreamTitle, e.g. "Bonobo - Kerala" */
  raw: string
  artist?: string
  title?: string
}

export interface WindowState {
  maximized: boolean
  focused: boolean
  fullscreen: boolean
}

export type PlayerCommand = 'toggle' | 'next' | 'previous' | 'stop'

export interface TrayState {
  stationName?: string
  playing: boolean
}

export interface SmoothApi {
  settings: {
    get: () => Promise<AppSettings>
    set: (patch: Partial<AppSettings>) => Promise<AppSettings>
  }
  discord: {
    update: (presence: PresencePayload | null) => Promise<void>
    reconnect: () => Promise<DiscordStatus>
    status: () => Promise<DiscordStatus>
    onStatus: (callback: (status: DiscordStatus) => void) => () => void
  }
  metadata: {
    subscribe: (streamUrl: string) => Promise<void>
    unsubscribe: () => Promise<void>
    onTrack: (callback: (track: TrackMetadata) => void) => () => void
  }
  window: {
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<void>
    toggleFullscreen: () => Promise<void>
    close: () => Promise<void>
    onState: (callback: (state: WindowState) => void) => () => void
  }
  player: {
    onCommand: (callback: (command: PlayerCommand) => void) => () => void
  }
  tray: {
    update: (state: TrayState | null) => Promise<void>
  }
  app: {
    version: () => Promise<string>
    openExternal: (url: string) => Promise<void>
    setBadge: (text: string | null) => Promise<void>
  }
}
