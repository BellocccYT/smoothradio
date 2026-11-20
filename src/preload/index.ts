import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  AppSettings,
  DiscordStatus,
  PlayerCommand,
  PresencePayload,
  SmoothApi,
  TrackMetadata,
  TrayState,
  WindowState
} from '@shared/types'

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: SmoothApi = {
  settings: {
    get: () => ipcRenderer.invoke('settings:get') as Promise<AppSettings>,
    set: (patch) => ipcRenderer.invoke('settings:set', patch) as Promise<AppSettings>
  },
  discord: {
    update: (presence: PresencePayload | null) => ipcRenderer.invoke('discord:update', presence),
    reconnect: () => ipcRenderer.invoke('discord:reconnect') as Promise<DiscordStatus>,
    status: () => ipcRenderer.invoke('discord:status') as Promise<DiscordStatus>,
    onStatus: (callback) => subscribe<DiscordStatus>('discord:status', callback)
  },
  metadata: {
    subscribe: (streamUrl: string) => ipcRenderer.invoke('metadata:subscribe', streamUrl),
    unsubscribe: () => ipcRenderer.invoke('metadata:unsubscribe'),
    onTrack: (callback) => subscribe<TrackMetadata>('metadata:track', callback)
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
    close: () => ipcRenderer.invoke('window:close'),
    onState: (callback) => subscribe<WindowState>('window:state', callback)
  },
  player: {
    onCommand: (callback) => subscribe<PlayerCommand>('player:command', callback)
  },
  tray: {
    update: (state: TrayState | null) => ipcRenderer.invoke('tray:update', state)
  },
  app: {
    version: () => ipcRenderer.invoke('app:version') as Promise<string>,
    openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),
    setBadge: (text: string | null) => ipcRenderer.invoke('app:set-badge', text)
  }
}

contextBridge.exposeInMainWorld('smooth', api)
