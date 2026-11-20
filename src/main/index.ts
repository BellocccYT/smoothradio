import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  globalShortcut,
  ipcMain,
  nativeImage,
  nativeTheme,
  session,
  shell
} from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { getSettings, setSettings } from './store'
import { DiscordService } from './discord'
import { metadataService } from './metadata'
import type { AppSettings, DiscordStatus, PlayerCommand, PresencePayload } from '@shared/types'

const APP_ID = 'com.smoothradio.app'
const isDev = !app.isPackaged
const startHidden = process.argv.includes('--hidden')

// Keeps automated tests and recordings away from the real player profile.
if (process.env.SMOOTH_USER_DATA) {
  app.setPath('userData', path.resolve(process.env.SMOOTH_USER_DATA))
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let discord: DiscordService

function resourcesDir(): string {
  return app.isPackaged ? process.resourcesPath : path.join(__dirname, '../../resources')
}

function iconPath(): string {
  return path.join(resourcesDir(), 'icon.png')
}

function trayIconPath(): string {
  const trayPath = path.join(resourcesDir(), 'tray.png')
  return fs.existsSync(trayPath) ? trayPath : iconPath()
}

function windowStateFile(): string {
  return path.join(app.getPath('userData'), 'window-state.json')
}

interface StoredWindowState {
  width: number
  height: number
  x?: number
  y?: number
  maximized: boolean
}

function loadWindowState(): StoredWindowState {
  const fallback: StoredWindowState = { width: 1400, height: 900, maximized: false }
  try {
    const raw = JSON.parse(fs.readFileSync(windowStateFile(), 'utf8')) as Partial<StoredWindowState>
    return {
      width: Math.max(1080, Number(raw.width) || fallback.width),
      height: Math.max(720, Number(raw.height) || fallback.height),
      x: typeof raw.x === 'number' ? raw.x : undefined,
      y: typeof raw.y === 'number' ? raw.y : undefined,
      maximized: Boolean(raw.maximized)
    }
  } catch {
    return fallback
  }
}

function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const maximized = mainWindow.isMaximized()
  const bounds = maximized ? mainWindow.getNormalBounds() : mainWindow.getBounds()
  try {
    fs.writeFileSync(
      windowStateFile(),
      JSON.stringify({ ...bounds, maximized }, null, 2),
      'utf8'
    )
  } catch {
    // non critical
  }
}

let windowStateTimer: NodeJS.Timeout | null = null

function scheduleWindowStateSave(): void {
  if (windowStateTimer) clearTimeout(windowStateTimer)
  windowStateTimer = setTimeout(() => {
    windowStateTimer = null
    saveWindowState()
  }, 700)
}

function sendWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('window:state', {
    maximized: mainWindow.isMaximized(),
    focused: mainWindow.isFocused(),
    fullscreen: mainWindow.isFullScreen()
  })
}

function broadcastStatus(status: DiscordStatus): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send('discord:status', status)
  }
}

function sendPlayerCommand(command: PlayerCommand): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('player:command', command)
  }
}

function showWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function toggleWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide()
  } else {
    showWindow()
  }
}

function applyLoginItem(settings: AppSettings): void {
  if (!app.isPackaged) return
  try {
    app.setLoginItemSettings({
      openAtLogin: settings.launchAtLogin,
      args: settings.startHidden ? ['--hidden'] : [],
      path: process.execPath
    })
  } catch (error) {
    console.warn('[app] login item update failed', error)
  }
}

function createTray(): void {
  const image = nativeImage.createFromPath(trayIconPath())
  tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image)
  tray.setToolTip('SmoothRadio')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'SmoothRadio', enabled: false },
      { type: 'separator' },
      { label: 'Wiedergabe / Pause', click: () => sendPlayerCommand('toggle') },
      { label: 'Nächster Sender', click: () => sendPlayerCommand('next') },
      { label: 'Vorheriger Sender', click: () => sendPlayerCommand('previous') },
      { type: 'separator' },
      { label: 'Fenster öffnen', click: showWindow },
      {
        label: 'Beenden',
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])
  )
  tray.on('click', toggleWindow)
  tray.on('double-click', showWindow)
}

function registerShortcuts(): void {
  const bindings: Array<[string, PlayerCommand]> = [
    ['MediaPlayPause', 'toggle'],
    ['MediaNextTrack', 'next'],
    ['MediaPreviousTrack', 'previous'],
    ['MediaStop', 'stop']
  ]
  for (const [accelerator, command] of bindings) {
    try {
      globalShortcut.register(accelerator, () => sendPlayerCommand(command))
    } catch {
      // another app might own the media key
    }
  }
}

function createWindow(): void {
  const state = loadWindowState()

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 1080,
    minHeight: 700,
    show: false,
    frame: false,
    backgroundColor: '#06060a',
    title: 'SmoothRadio',
    icon: nativeImage.createFromPath(iconPath()),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      spellcheck: false,
      backgroundThrottling: false
    }
  })

  if (state.maximized) mainWindow.maximize()

  mainWindow.on('ready-to-show', () => {
    if (startHidden) return
    mainWindow?.show()
    mainWindow?.focus()
  })

  mainWindow.on('maximize', sendWindowState)
  mainWindow.on('unmaximize', sendWindowState)
  mainWindow.on('focus', sendWindowState)
  mainWindow.on('blur', sendWindowState)
  mainWindow.on('enter-full-screen', sendWindowState)
  mainWindow.on('leave-full-screen', sendWindowState)
  mainWindow.on('resize', scheduleWindowStateSave)
  mainWindow.on('move', scheduleWindowStateSave)

  mainWindow.on('close', (event) => {
    if (!isQuitting && getSettings().closeToTray) {
      event.preventDefault()
      saveWindowState()
      mainWindow?.hide()
      return
    }
    saveWindowState()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl && url.startsWith(devUrl)) return
    event.preventDefault()
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
  })

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools()
    }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function configureSession(): void {
  const ses = session.defaultSession
  ses.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 SmoothRadio/1.0'
  )
  ses.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', showWindow)

  app.whenReady().then(() => {
    app.setAppUserModelId(APP_ID)
    nativeTheme.themeSource = 'dark'
    Menu.setApplicationMenu(null)
    configureSession()

    const settings = getSettings()
    discord = new DiscordService(settings, broadcastStatus)
    applyLoginItem(settings)

    metadataService.on('track', (track) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('metadata:track', track)
      }
    })

    registerIpc()
    createWindow()
    createTray()
    registerShortcuts()

    if (settings.discordEnabled) {
      setTimeout(() => void discord.applySettings(settings), 1200)
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
      else showWindow()
    })
  })
}

function registerIpc(): void {
  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:set', (_event, patch: Partial<AppSettings>) => {
    const next = setSettings(patch)
    applyLoginItem(next)
    discord.applySettings(next)
    return next
  })

  ipcMain.handle('discord:update', async (_event, presence: PresencePayload | null) => {
    await discord.setPresence(presence)
  })

  ipcMain.handle('discord:reconnect', () => discord.reconnect())
  ipcMain.handle('discord:status', () => discord.getStatus())

  ipcMain.handle('metadata:subscribe', (_event, url: string) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      metadataService.unsubscribe()
      return
    }
    metadataService.subscribe(url)
  })

  ipcMain.handle('metadata:unsubscribe', () => {
    metadataService.unsubscribe()
  })

  ipcMain.handle('tray:update', (_event, state: { stationName?: string; playing: boolean } | null) => {
    if (!tray) return
    if (state?.stationName) {
      tray.setToolTip(`SmoothRadio — ${state.stationName}${state.playing ? ' · spielt' : ' · pausiert'}`)
    } else {
      tray.setToolTip('SmoothRadio')
    }
  })

  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:toggle-maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.handle('window:toggle-fullscreen', () => {
    if (!mainWindow) return
    mainWindow.setFullScreen(!mainWindow.isFullScreen())
  })
  ipcMain.handle('window:close', () => mainWindow?.close())

  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:open-external', (_event, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) return shell.openExternal(url)
    return Promise.resolve()
  })
  ipcMain.handle('app:set-badge', () => {
    // Windows badge support is not used by the player.
  })
}

app.on('before-quit', () => {
  isQuitting = true
  metadataService.unsubscribe()
  discord?.dispose()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (!getSettings().closeToTray) app.quit()
})
