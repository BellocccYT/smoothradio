import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, DiscordStatus, TrackMetadata } from '@shared/types'
import { audioEngine } from '../lib/audio'
import { curatedStations, featuredStation } from '../lib/stations'
import { isPlayableUrl } from '../lib/utils'
import type { Station, Toast, ToastTone, View } from '../lib/types'
import { bridge } from '../lib/bridge'

interface PlayerState {
  current: Station | null
  queue: Station[]
  isPlaying: boolean
  isLoading: boolean
  volume: number
  muted: boolean
  nowPlaying: TrackMetadata | null
  error: string | null
  favorites: Station[]
  recents: Station[]
  customStations: Station[]
  view: View
  genre: string | null
  query: string
  accent: string
  fullscreen: boolean
  sleepEndsAt: number | null
  toast: Toast | null
  discord: DiscordStatus
  settings: AppSettings | null
  sessionStartedAt: number | null

  playStation: (station: Station, queue?: Station[]) => Promise<void>
  togglePlay: () => Promise<void>
  stop: () => void
  next: () => Promise<void>
  previous: () => Promise<void>
  setVolume: (value: number) => void
  toggleMute: () => void
  toggleFavorite: (station: Station) => void
  addCustomStation: (station: Station) => Promise<void>
  removeCustomStation: (id: string) => void
  setView: (view: View, genre?: string | null) => void
  setQuery: (query: string) => void
  setNowPlaying: (track: TrackMetadata | null) => void
  setSleep: (minutes: number | null) => void
  setFullscreen: (value: boolean) => void
  setAccent: (accent: string) => void
  setDiscord: (status: DiscordStatus) => void
  setSettings: (settings: AppSettings) => void
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  pushToast: (message: string, tone?: ToastTone) => void
  dismissToast: () => void
  clearHistory: () => void
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      current: null,
      queue: [],
      isPlaying: false,
      isLoading: false,
      volume: 0.8,
      muted: false,
      nowPlaying: null,
      error: null,
      favorites: [],
      recents: [],
      customStations: [],
      view: 'home',
      genre: null,
      query: '',
      accent: 'mint',
      fullscreen: false,
      sleepEndsAt: null,
      toast: null,
      discord: { state: 'off' },
      settings: null,
      sessionStartedAt: null,

      playStation: async (station, queue) => {
        if (!isPlayableUrl(station.url)) {
          get().pushToast(
            'Dieser Sender läuft nur über http und wird von Browsern auf https-Seiten blockiert. Bitte einen https-Stream wählen.',
            'error'
          )
          return
        }
        set((state) => {
          const baseQueue = queue?.length ? queue : state.queue.length ? state.queue : [station]
          const nextQueue = baseQueue.some((item) => item.id === station.id) ? baseQueue : [station, ...baseQueue]
          return {
            current: station,
            queue: nextQueue,
            isPlaying: true,
            isLoading: true,
            error: null,
            // Starting the same station again (e.g. after a restart) must not
            // throw away a title that the metadata service already resolved.
            nowPlaying: state.current?.id === station.id ? state.nowPlaying : null,
            sessionStartedAt: Date.now(),
            recents: [station, ...state.recents.filter((item) => item.id !== station.id)].slice(0, 30)
          }
        })
        await audioEngine.play(station)
      },

      togglePlay: async () => {
        const { current, isPlaying } = get()
        if (!current) {
          await get().playStation(featuredStation, curatedStations)
          return
        }
        if (isPlaying) {
          audioEngine.pause()
          set({ isPlaying: false, isLoading: false })
        } else if (!audioEngine.hasSource) {
          await get().playStation(current, get().queue.length ? get().queue : curatedStations)
        } else {
          set({ isPlaying: true, isLoading: true })
          await audioEngine.resume()
        }
      },

      stop: () => {
        audioEngine.stop()
        set({ isPlaying: false, isLoading: false, nowPlaying: null })
      },

      next: async () => {
        const { current, queue } = get()
        const list = queue.length ? queue : curatedStations
        if (!current) {
          await get().playStation(list[0] ?? featuredStation, list)
          return
        }
        const index = list.findIndex((item) => item.id === current.id)
        const nextStation = list[(index + 1 + list.length) % list.length] ?? list[0]
        await get().playStation(nextStation, list)
      },

      previous: async () => {
        const { current, queue } = get()
        const list = queue.length ? queue : curatedStations
        if (!current) {
          await get().playStation(list[0] ?? featuredStation, list)
          return
        }
        const index = list.findIndex((item) => item.id === current.id)
        const previousIndex = index <= 0 ? list.length - 1 : index - 1
        await get().playStation(list[previousIndex] ?? list[0], list)
      },

      setVolume: (value) => {
        const volume = Math.min(1, Math.max(0, value))
        audioEngine.setVolume(volume)
        set({ volume, muted: false })
      },

      toggleMute: () => {
        const { muted, volume } = get()
        const nextMuted = !muted
        audioEngine.setVolume(nextMuted ? 0 : volume)
        set({ muted: nextMuted })
      },

      toggleFavorite: (station) => {
        const exists = get().favorites.some((item) => item.id === station.id)
        set((state) => ({
          favorites: exists
            ? state.favorites.filter((item) => item.id !== station.id)
            : [station, ...state.favorites]
        }))
        get().pushToast(
          exists ? `${station.name} aus Favoriten entfernt` : `${station.name} zu Favoriten hinzugefügt`,
          exists ? 'info' : 'success'
        )
      },

      addCustomStation: async (station) => {
        set((state) => ({
          customStations: [station, ...state.customStations.filter((item) => item.id !== station.id)]
        }))
        get().pushToast('Eigener Stream hinzugefügt', 'success')
        await get().playStation(station)
      },

      removeCustomStation: (id) => {
        set((state) => ({ customStations: state.customStations.filter((item) => item.id !== id) }))
        if (get().current?.id === id) get().stop()
        get().pushToast('Stream entfernt')
      },

      setView: (view, genre = null) => set({ view, genre }),

      setQuery: (query) => set({ query, view: 'search' }),

      setNowPlaying: (track) => set({ nowPlaying: track }),

      setSleep: (minutes) => {
        if (!minutes) {
          set({ sleepEndsAt: null })
          get().pushToast('Sleep-Timer ausgeschaltet')
          return
        }
        set({ sleepEndsAt: Date.now() + minutes * 60_000 })
        get().pushToast(`Sleep-Timer: Radio schläft in ${minutes} Minuten`, 'info')
      },

      setFullscreen: (value) => set({ fullscreen: value }),

      setAccent: (accent) => set({ accent }),

      setDiscord: (status) => set({ discord: status }),

      setSettings: (settings) => set({ settings }),

      updateSettings: async (patch) => {
        const next = await bridge.settings.set(patch)
        set({ settings: next })
      },

      pushToast: (message, tone = 'info') => {
        const id = Date.now() + Math.random()
        set({ toast: { id, message, tone } })
        window.setTimeout(() => {
          if (get().toast?.id === id) set({ toast: null })
        }, 4200)
      },

      dismissToast: () => set({ toast: null }),

      clearHistory: () => {
        set({ recents: [] })
        get().pushToast('Verlauf geleert')
      }
    }),
    {
      // Bewusst der alte Key, damit Favoriten und Verlauf beim Umstieg erhalten bleiben.
      name: 'smoothradio:v1',
      version: 1,
      partialize: (state) => ({
        favorites: state.favorites,
        recents: state.recents,
        customStations: state.customStations,
        volume: state.volume,
        accent: state.accent,
        current: state.current,
        muted: state.muted
      })
    }
  )
)

audioEngine.setHandlers({
  onPlaying: () => usePlayer.setState({ isPlaying: true, isLoading: false, error: null }),
  onWaiting: () => usePlayer.setState({ isLoading: true }),
  onPause: () => usePlayer.setState({ isPlaying: false, isLoading: false }),
  onError: (message) => {
    usePlayer.setState({ isPlaying: false, isLoading: false, error: message })
    usePlayer.getState().pushToast(message, 'error')
  }
})
