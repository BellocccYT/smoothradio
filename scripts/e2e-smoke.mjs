import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const electron = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe')
const packagedExe = process.env.SMOKE_EXE
const port = Number(process.env.SMOKE_PORT || 9333)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const hiddenArgs = process.env.SMOKE_VISIBLE ? [] : ['--hidden']
const testProfile = path.join(root, 'preview', 'test-profile')
if (!process.env.SMOKE_KEEP_PROFILE) fs.rmSync(testProfile, { recursive: true, force: true })
const testEnv = { ...process.env, SMOOTH_USER_DATA: testProfile, ELECTRON_ENABLE_LOGGING: '1' }

const child = packagedExe
  ? spawn(packagedExe, [...hiddenArgs, `--remote-debugging-port=${port}`, '--mute-audio'], {
      env: testEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    })
  : spawn(electron, ['.', ...hiddenArgs, `--remote-debugging-port=${port}`, '--enable-logging', '--mute-audio'], {
      cwd: root,
      env: testEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    })

const output = []
child.stdout.on('data', (chunk) => output.push(String(chunk)))
child.stderr.on('data', (chunk) => output.push(String(chunk)))

let ws
try {
  let page = null
  for (let attempt = 0; attempt < 40; attempt++) {
    await sleep(500)
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())
      page = targets.find((target) => target.type === 'page' && target.url.includes('index.html'))
      if (page) break
    } catch {
      // not up yet
    }
  }
  if (!page) throw new Error('Renderer target not found')

  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (!message.id) return
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id)
    if (message.error) entry.reject(new Error(message.error.message))
    else entry.resolve(message.result)
  })

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const requestId = ++id
      pending.set(requestId, { resolve, reject })
      ws.send(JSON.stringify({ id: requestId, method, params }))
    })

  await send('Runtime.enable')
  await send('Page.enable')

  const exceptions = []
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text)
    }
  })

  const evaluated = await send('Runtime.evaluate', {
    expression: `(async () => {
      const settings = await window.smooth?.settings.get()
      return {
        title: document.title,
        hasBridge: typeof window.smooth === 'object',
        version: await window.smooth?.app.version(),
        settings,
        view: document.body.innerText.includes('Entdecken'),
        discord: await window.smooth?.discord.status(),
        tray: typeof window.smooth?.tray?.update
      }
    })()`,
    awaitPromise: true,
    returnByValue: true
  })

  console.log('SMOKE:', JSON.stringify(evaluated.result.value, null, 2))

  // Reset player state, keep the app silent, then start the featured station.
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('smoothradio:v1', JSON.stringify({
      version: 1,
      state: { favorites: [], recents: [], customStations: [], volume: 0.72, accent: 'mint', current: null, muted: false }
    }))`
  })
  await send('Page.reload')
  await sleep(2600)

  await send('Runtime.evaluate', {
    expression: `[...document.querySelectorAll('button')].find((button) => button.innerText.includes('Jetzt reinhören'))?.click()`
  })

  let playing = false
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(800)
    const probe = await send('Runtime.evaluate', {
      expression: `({
        onAir: Boolean(document.querySelector('button[aria-label="Pause"]')),
        media: navigator.mediaSession?.playbackState,
        title: navigator.mediaSession?.metadata?.title,
        artist: navigator.mediaSession?.metadata?.artist,
        error: /Stream nicht erreichbar|Netzwerkfehler|Wiedergabe wurde/.test(document.body.innerText)
      })`,
      returnByValue: true
    })
    if (probe.result.value?.onAir) {
      playing = true
      console.log('PLAYBACK:', JSON.stringify(probe.result.value))
      break
    }
    if (probe.result.value?.error) {
      console.log('PLAYBACK ERROR:', JSON.stringify(probe.result.value))
      break
    }
  }
  console.log('PLAYBACK STARTED:', playing)

  const discordTest = await send('Runtime.evaluate', {
    expression: `(async () => {
      const previous = await window.smooth.settings.get()
      await window.smooth.settings.set({ discordEnabled: true, discordClientId: '' })
      await new Promise((resolve) => setTimeout(resolve, 700))
      const withoutId = await window.smooth.discord.status()
      await window.smooth.settings.set(previous)
      return withoutId
    })()`,
    awaitPromise: true,
    returnByValue: true
  })
  console.log('DISCORD (no id):', JSON.stringify(discordTest.result.value))

  if (exceptions.length) console.log('RENDERER EXCEPTIONS:', exceptions.slice(0, 5))

  await sleep(1200)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.mkdirSync(path.join(root, 'preview'), { recursive: true })
  fs.writeFileSync(path.join(root, 'preview', 'app-playing.png'), Buffer.from(shot.data, 'base64'))
  console.log('Saved preview/app-playing.png')

  await send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }))`
  })
  await sleep(2400)
  const fullscreenShot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(root, 'preview', 'app-fullscreen.png'), Buffer.from(fullscreenShot.data, 'base64'))
  console.log('Saved preview/app-fullscreen.png')

  if (output.length) {
    const errors = output.join('').split('\n').filter((line) => /error|exception|failed/i.test(line))
    if (errors.length) console.log('LOG WARNINGS:\n' + errors.slice(0, 20).join('\n'))
  }
} catch (error) {
  console.error('SMOKE FAILED:', error)
  console.error(output.join('').slice(-4000))
  process.exitCode = 1
} finally {
  try {
    ws?.close()
  } catch {
    // ignore
  }
  spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
}
