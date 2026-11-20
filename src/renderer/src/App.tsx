import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePlayer } from './store/player'
import { bridge } from './lib/bridge'
import { getAccent } from './lib/accents'
import { isHlsUrl } from './lib/utils'
import { audioEngine } from './lib/audio'
import { TitleBar } from './components/TitleBar'
import { Sidebar, focusSearch } from './components/Sidebar'
import { Header } from './components/Header'
import { PlayerBar } from './components/PlayerBar'
import { Toast } from './components/Toast'
import { SettingsDialog } from './components/SettingsDialog'
import { AddStreamDialog } from './components/AddStreamDialog'
import { FullscreenPlayer } from './components/FullscreenPlayer'
import { HomeView } from './views/HomeView'
import { SearchView } from './views/SearchView'
import { FavoritesView } from './views/FavoritesView'
import { HistoryView } from './views/HistoryView'
import { GenreView } from './views/GenreView'

function AmbientBackground(): React.JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-15%,rgba(56,189,248,0.055),transparent_58%)]" />
      <div
        className="aurora-blob left-[-10%] top-[24%] size-[440px] opacity-[0.07]"
        style={{ background: 'var(--accent)', animation: 'drift-a 28s ease-in-out infinite alternate' }}
      />
      <div
        className="aurora-blob right-[-8%] top-[-6%] size-[380px] opacity-[0.055]"
        style={{ background: 'var(--accent-2)', animation: 'drift-b 34s ease-in-out infinite alternate' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_110%,rgba(0,0,0,0.65),transparent_70%)]" />
    </div>
  )
}

export function App(): React.JSX.Element {
  const view = usePlayer((state) => state.view)
  const genre = usePlayer((state) => state.genre)
  const settings = usePlayer((state) => state.settings)
  const accent = usePlayer((state) => state.accent)
  const current = usePlayer((state) => state.current)
  const nowPlaying = usePlayer((state) => state.nowPlaying)
  const isPlaying = usePlayer((state) => state.isPlaying)
  const volume = usePlayer((state) => state.volume)
  const muted = usePlayer((state) => state.muted)
  const sleepEndsAt = usePlayer((state) => state.sleepEndsAt)
  const sessionStartedAt = usePlayer((state) => state.sessionStartedAt)
  const fullscreen = usePlayer((state) => state.fullscreen)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addStreamOpen, setAddStreamOpen] = useState(false)

  useEffect(() => {
    bridge.settings
      .get()
      .then((loaded) => usePlayer.getState().setSettings(loaded))
      .catch(() => undefined)
    bridge.discord
      .status()
      .then((status) => usePlayer.getState().setDiscord(status))
      .catch(() => undefined)
    return bridge.discord.onStatus((status) => usePlayer.getState().setDiscord(status))
  }, [])

  useEffect(() => {
    const chosen = getAccent(accent)
    const root = document.documentElement
    root.style.setProperty('--accent', chosen.from)
    root.style.setProperty('--accent-2', chosen.to)
    root.style.setProperty('--accent-soft', `${chosen.from}24`)
  }, [accent])

  useEffect(() => {
    audioEngine.setVolume(muted ? 0 : volume)
  }, [volume, muted])

  useEffect(() => bridge.metadata.onTrack((track) => usePlayer.getState().setNowPlaying(track)), [])

  useEffect(() => {
    if (!current) return
    usePlayer.getState().setNowPlaying(null)
    if (current.hls || isHlsUrl(current.url)) return
    // Let the audio connection settle first — keeps picky icecast servers happy.
    const timer = setTimeout(() => {
      void bridge.metadata.subscribe(current.url)
    }, 1600)
    return () => {
      clearTimeout(timer)
      void bridge.metadata.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  useEffect(() => {
    void bridge.tray.update(current ? { stationName: current.name, playing: isPlaying } : null)
  }, [current?.id, isPlaying])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    if (!current) {
      navigator.mediaSession.metadata = null
      return
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying?.title ?? current.name,
      artist: nowPlaying?.artist ?? (nowPlaying ? current.name : 'SmoothRadio'),
      album: current.name,
      artwork: current.favicon ? [{ src: current.favicon, sizes: '512x512' }] : []
    })
  }, [current, nowPlaying])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [isPlaying])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const actions: Array<[MediaSessionAction, () => void]> = [
      [
        'play',
        () => {
          const state = usePlayer.getState()
          if (!state.isPlaying) void state.togglePlay()
        }
      ],
      [
        'pause',
        () => {
          const state = usePlayer.getState()
          if (state.isPlaying) void state.togglePlay()
        }
      ],
      ['nexttrack', () => void usePlayer.getState().next()],
      ['previoustrack', () => void usePlayer.getState().previous()],
      ['stop', () => usePlayer.getState().stop()]
    ]
    for (const [action, handler] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // action not supported
      }
    }
    return () => {
      for (const [action] of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, null)
        } catch {
          // ignore
        }
      }
    }
  }, [])

  useEffect(() => {
    return bridge.player.onCommand((command) => {
      const store = usePlayer.getState()
      if (command === 'toggle') void store.togglePlay()
      else if (command === 'next') void store.next()
      else if (command === 'previous') void store.previous()
      else if (command === 'stop') store.stop()
    })
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable === true ||
        Boolean(target?.closest('button, [role="button"]'))

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        focusSearch()
        return
      }
      if (event.key === 'Escape' && usePlayer.getState().fullscreen) {
        event.preventDefault()
        usePlayer.getState().setFullscreen(false)
        return
      }
      if (event.key === 'F11') {
        event.preventDefault()
        void bridge.window.toggleFullscreen()
        return
      }
      if (typing) return
      if (event.code === 'Space') {
        event.preventDefault()
        void usePlayer.getState().togglePlay()
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        usePlayer.getState().setFullscreen(!usePlayer.getState().fullscreen)
      } else if (event.key === '/') {
        event.preventDefault()
        focusSearch()
      } else if (event.key === 'm') {
        usePlayer.getState().toggleMute()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!sleepEndsAt) return
    const remaining = sleepEndsAt - Date.now()
    if (remaining <= 0) {
      usePlayer.setState({ sleepEndsAt: null })
      return
    }
    const timeout = setTimeout(() => {
      const store = usePlayer.getState()
      audioEngine.pause()
      usePlayer.setState({ isPlaying: false, sleepEndsAt: null })
      store.pushToast('Sleep-Timer: Gute Nacht. 🌙', 'info')
    }, remaining)
    return () => clearTimeout(timeout)
  }, [sleepEndsAt])

  useEffect(() => {
    if (!settings?.discordEnabled) {
      void bridge.discord.update(null)
      return
    }
    const timeout = setTimeout(() => {
      if (!current) {
        void bridge.discord.update(null)
        return
      }
      void bridge.discord.update({
        stationName: current.name,
        nowPlaying: nowPlaying?.raw,
        stationUrl: current.homepage ?? current.url,
        playing: isPlaying,
        startedAt: sessionStartedAt ?? Date.now()
      })
    }, 900)
    return () => clearTimeout(timeout)
  }, [settings?.discordEnabled, current, nowPlaying?.raw, isPlaying, sessionStartedAt])

  const renderView = (): React.JSX.Element => {
    switch (view) {
      case 'search':
        return <SearchView />
      case 'favorites':
        return <FavoritesView onOpenAddStream={() => setAddStreamOpen(true)} />
      case 'history':
        return <HistoryView />
      case 'genre':
        return <GenreView />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#06060a] text-white">
      <AmbientBackground />
      <TitleBar />

      <div className="relative z-10 flex min-h-0 flex-1">
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} onOpenAddStream={() => setAddStreamOpen(true)} />
        <main className="scroll-area relative min-w-0 flex-1 overflow-y-auto">
          <Header onOpenSettings={() => setSettingsOpen(true)} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${view}-${view === 'genre' ? genre : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <PlayerBar onOpenSettings={() => setSettingsOpen(true)} />
      <AnimatePresence>{fullscreen && <FullscreenPlayer key="fullscreen-player" />}</AnimatePresence>
      <Toast />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AddStreamDialog open={addStreamOpen} onClose={() => setAddStreamOpen(false)} />
    </div>
  )
}
