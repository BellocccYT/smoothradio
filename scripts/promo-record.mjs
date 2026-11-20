import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const electron = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe')
const assets = path.join(root, 'promo', 'assets')
const framesRoot = path.join(root, 'promo', 'assets', 'raw')
const profile = path.join(root, 'preview', 'promo-profile')
const port = 9341

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

fs.rmSync(profile, { recursive: true, force: true })
fs.mkdirSync(assets, { recursive: true })
fs.rmSync(framesRoot, { recursive: true, force: true })
fs.mkdirSync(framesRoot, { recursive: true })

const child = spawn(electron, ['.', `--remote-debugging-port=${port}`, '--mute-audio', '--enable-logging'], {
  cwd: root,
  env: { ...process.env, SMOOTH_USER_DATA: profile, ELECTRON_ENABLE_LOGGING: '1' },
  stdio: ['ignore', 'pipe', 'pipe']
})
const logs = []
child.stdout.on('data', (chunk) => logs.push(String(chunk)))
child.stderr.on('data', (chunk) => logs.push(String(chunk)))

let ws
let screencastFrames = []
let recording = false

async function buildVideo(name, frames) {
  if (frames.length < 5) throw new Error(`not enough frames for ${name}`)
  const dir = path.join(framesRoot, name)
  fs.mkdirSync(dir, { recursive: true })
  const first = frames[0].ts
  const last = frames[frames.length - 1].ts
  frames.forEach((frame, index) => {
    fs.writeFileSync(path.join(dir, `frame-${String(index).padStart(5, '0')}.jpg`), Buffer.from(frame.data, 'base64'))
  })
  const fps = Math.min(60, Math.max(10, (frames.length - 1) / Math.max(0.001, last - first)))
  const output = path.join(assets, `${name}.mp4`)
  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-hide_banner',
      '-loglevel', 'error',
      '-framerate', fps.toFixed(3),
      '-i', path.join(dir, 'frame-%05d.jpg'),
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '17',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      output
    ],
    { stdio: 'inherit' }
  )
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${name}`)
  console.log(`${name}: ${frames.length} frames, ${fps.toFixed(2)} fps -> ${output}`)
}

try {
  let page = null
  for (let attempt = 0; attempt < 60; attempt++) {
    await sleep(500)
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())
      page = targets.find((target) => target.type === 'page')
      if (page) break
    } catch {
      // not up yet
    }
  }
  if (!page) throw new Error('renderer target not found')

  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.method === 'Page.screencastFrame') {
      if (recording) screencastFrames.push({ data: message.params.data, ts: message.params.metadata.timestamp })
      ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId: message.params.sessionId } }))
      return
    }
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

  const waitForApp = async () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      await sleep(250)
      const probe = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('input[aria-label="Sender suchen"]'))`,
        returnByValue: true
      })
      if (probe.result.value) return
    }
    throw new Error('app UI did not render')
  }

  await waitForApp()
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('smoothradio:v1', JSON.stringify({
      version: 1,
      state: { favorites: [], recents: [], customStations: [], volume: 0.68, accent: 'mint', current: null, muted: false }
    }))`
  })
  await send('Page.reload')
  await sleep(1400)
  await waitForApp()

  await send('Runtime.evaluate', {
    expression: `window.smooth.window.toggleFullscreen()`,
    awaitPromise: true
  })
  await sleep(1500)

  const screenshot = async (name) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(assets, `${name}.png`), Buffer.from(shot.data, 'base64'))
    console.log(`still: ${name}.png`)
  }

  // Warm the radio-browser cache so the recorded search feels instant.
  await send('Runtime.evaluate', {
    expression: `document.querySelector('input[aria-label="Sender suchen"]').focus()`
  })
  for (const char of 'SomaFM') {
    await send('Input.insertText', { text: char })
    await sleep(60)
  }
  await sleep(3200)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[aria-label="Sender suchen"]')
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      ;[...document.querySelectorAll('nav button')].find((button) => button.innerText.includes('Entdecken'))?.click()
    })()`
  })
  await sleep(1200)
  await screenshot('home')

  await send('Runtime.evaluate', {
    expression: `document.querySelector('input[aria-label="Sender suchen"]').focus()`
  })
  await send('Page.startScreencast', {
    format: 'jpeg',
    quality: 88,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 2
  })

  screencastFrames = []
  recording = true
  await sleep(400)
  for (const char of 'SomaFM') {
    await send('Input.insertText', { text: char })
    await sleep(110)
  }
  await sleep(1300)

  const clicked = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = [...document.querySelectorAll('[role="button"]')]
      const card = cards.find((element) => element.innerText.includes('SomaFM Groove Salad'))
      card?.click()
      return Boolean(card)
    })()`,
    returnByValue: true
  })
  console.log('clicked station:', clicked.result.value)
  await sleep(4500)

  recording = false
  await send('Page.stopScreencast')
  await buildVideo('search', screencastFrames)

  await send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }))`
  })
  await sleep(2800)
  await screenshot('fullscreen')

  screencastFrames = []
  recording = true
  await send('Page.startScreencast', {
    format: 'jpeg',
    quality: 88,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 2
  })
  await sleep(7500)
  recording = false
  await send('Page.stopScreencast')
  await buildVideo('fullscreen', screencastFrames)

  await send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`
  })
  await sleep(700)
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[aria-label="Einstellungen öffnen"]')?.click()`
  })
  await sleep(900)
  await screenshot('settings')

  await send('Runtime.evaluate', { expression: `window.smooth.window.toggleFullscreen()`, awaitPromise: true })
  await sleep(500)
  console.log('promo capture done')
} catch (error) {
  console.error('PROMO CAPTURE FAILED:', error)
  console.error(logs.join('').slice(-3000))
  process.exitCode = 1
} finally {
  try {
    ws?.close()
  } catch {
    // ignore
  }
  spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
}
