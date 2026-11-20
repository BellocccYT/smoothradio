const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('force-device-scale-factor', '1')
app.commandLine.appendSwitch('mute-audio')

const scenario = process.argv[2] || 'home'
const output = process.argv[3] || path.join('preview', `${scenario}.png`)
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5199/'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const station = {
  id: 'curated-groove-salad',
  name: 'SomaFM Groove Salad',
  url: 'https://ice1.somafm.com/groovesalad-128-mp3',
  homepage: 'https://somafm.com/groovesalad/',
  tags: ['Chill', 'Downtempo', 'Ambient'],
  country: 'USA',
  codec: 'MP3',
  bitrate: 128,
  curated: true,
  description: 'Ein angenehm entspannter Mix aus Downtempo, Ambient und Trip-Hop.'
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: '#06060a',
    webPreferences: { offscreen: false }
  })

  const logs = []
  win.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) logs.push(`[${level}] ${message}`)
  })

  await win.loadURL(url)

  if (scenario === 'station' || scenario === 'playing' || scenario === 'fullscreen') {
    const volume = scenario === 'fullscreen' ? 0.72 : 0.8
    await win.webContents.executeJavaScript(`
      localStorage.setItem('smoothradio:v1', JSON.stringify({
        version: 1,
        state: {
          favorites: [${JSON.stringify(station)}],
          recents: [${JSON.stringify(station)}],
          customStations: [],
          volume: ${volume},
          accent: 'mint',
          current: ${JSON.stringify(station)},
          muted: false
        }
      }))
    `)
    await win.reload()
    await sleep(1200)
  }

  if (scenario === 'fullscreen' || scenario === 'playing-live') {
    console.log('starting playback (muted)')
    await win.webContents.executeJavaScript(`
      [...document.querySelectorAll('button')].find((button) => /Weiterh|Jetzt reinh/.test(button.innerText))?.click()
    `)
    await sleep(2600)
  }

  if (scenario === 'fullscreen') {
    console.log('opening fullscreen player')
    await win.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }))`)
    await sleep(3200)
  }

  if (scenario === 'playing') {
    await win.webContents.executeJavaScript(`
      const button = document.querySelector('button[aria-label="Abspielen"]')
      button?.click()
    `)
    await sleep(3500)
  }

  if (scenario === 'search') {
    await sleep(600)
    await win.webContents.executeJavaScript(`
      const input = document.querySelector('input[aria-label="Sender suchen"]')
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(input, 'jazz')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    `)
    await sleep(3200)
  }

  if (scenario === 'settings') {
    await win.webContents.executeJavaScript(`
      document.querySelector('button[aria-label="Einstellungen öffnen"]')?.click()
    `)
    await sleep(900)
  }

  await sleep(700)
  await win.webContents.executeJavaScript('document.fonts.ready.then(() => true)')
  await sleep(400)

  win.showInactive()
  await sleep(500)

  console.log('capturing')
  const image = await win.webContents.capturePage()
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, image.toPNG())
  console.log(`captured ${scenario} -> ${output} (${image.getSize().width}x${image.getSize().height})`)
  if (logs.length) console.log('console warnings/errors:', logs.join('\n'))
  app.exit(0)
})

setTimeout(() => {
  console.error('capture hard timeout')
  app.exit(1)
}, 45_000)
