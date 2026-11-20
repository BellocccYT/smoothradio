import { DEFAULT_SETTINGS, type AppSettings, type SmoothApi, type TrackMetadata } from '@shared/types'

const demoTracks: TrackMetadata[] = [
  { raw: 'Bonobo — Kerala', artist: 'Bonobo', title: 'Kerala' },
  { raw: 'Tycho — Awake', artist: 'Tycho', title: 'Awake' },
  { raw: 'Little Dragon — Ritual Union', artist: 'Little Dragon', title: 'Ritual Union' },
  { raw: 'Four Tet — Baby', artist: 'Four Tet', title: 'Baby' },
  { raw: 'Air — La Femme d’Argent', artist: 'Air', title: 'La Femme d’Argent' }
]

function createMockApi(): SmoothApi {
  const storageKey = 'smooth:mock-settings'
  let settings: AppSettings = { ...DEFAULT_SETTINGS }
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) settings = { ...settings, ...(JSON.parse(stored) as Partial<AppSettings>) }
  } catch {
    // ignore
  }

  const trackListeners = new Set<(track: TrackMetadata) => void>()
  let demoTimer: number | null = null
  let demoInterval: number | null = null

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
      subscribe: async () => {
        if (demoInterval !== null) return
        let index = 0
        const emit = (): void => {
          const track = demoTracks[index % demoTracks.length]
          index += 1
          trackListeners.forEach((listener) => listener(track))
        }
        demoTimer = window.setTimeout(emit, 1400)
        demoInterval = window.setInterval(emit, 24_000)
      },
      unsubscribe: async () => {
        if (demoTimer !== null) window.clearTimeout(demoTimer)
        if (demoInterval !== null) window.clearInterval(demoInterval)
        demoTimer = null
        demoInterval = null
      },
      onTrack: (callback) => {
        trackListeners.add(callback)
        return () => trackListeners.delete(callback)
      }
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
      version: async () => '1.0.0 (Web-Preview)',
      openExternal: async (url) => {
        window.open(url, '_blank', 'noopener,noreferrer')
      },
      setBadge: async () => {}
    }
  }
}

export const isDesktop = typeof window !== 'undefined' && Boolean(window.smooth)

export const bridge: SmoothApi = (typeof window !== 'undefined' && window.smooth) || createMockApi()
