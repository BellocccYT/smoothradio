import { DEFAULT_SETTINGS, type AppSettings, type SmoothApi } from '@shared/types'
import { isDesktopApp } from './env'

/**
 * Fallback für den Browser-Build. Im Web gibt es kein IPC, kein Discord-RPC
 * und keine serverseitigen ICY-Metadaten – deshalb bleiben diese APIs stumm,
 * statt Demodaten vorzutäuschen.
 */
function createMockApi(): SmoothApi {
  const storageKey = 'funkkunst:web-settings'
  let settings: AppSettings = { ...DEFAULT_SETTINGS }
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) settings = { ...settings, ...(JSON.parse(stored) as Partial<AppSettings>) }
  } catch {
    // Storage kann im Privatmodus blockiert sein.
  }

  return {
    settings: {
      get: async () => settings,
      set: async (patch) => {
        settings = { ...settings, ...patch }
        try {
          localStorage.setItem(storageKey, JSON.stringify(settings))
        } catch {
          // ignore
        }
        return settings
      }
    },
    discord: {
      update: async () => {},
      reconnect: async () => ({ state: 'off', message: 'Nur in der Desktop-App verfügbar.' }),
      status: async () => ({ state: 'off', message: 'Nur in der Desktop-App verfügbar.' }),
      onStatus: () => () => {}
    },
    metadata: {
      subscribe: async () => {},
      unsubscribe: async () => {},
      onTrack: () => () => {}
    },
    window: {
      minimize: async () => {},
      toggleMaximize: async () => {},
      toggleFullscreen: async () => {},
      close: async () => {},
      onState: () => () => {}
    },
    player: {
      onCommand: () => () => {}
    },
    tray: {
      update: async () => {}
    },
    app: {
      version: async () => '1.0.1 Web',
      openExternal: async (url) => {
        window.open(url, '_blank', 'noopener,noreferrer')
      },
      setBadge: async () => {}
    }
  }
}

export const isDesktop = isDesktopApp

export const bridge: SmoothApi = (typeof window !== 'undefined' && window.smooth) || createMockApi()
