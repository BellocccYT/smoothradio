import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const electron = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe')
const assets = path.join(root, 'promo', 'assets')
const framesRoot = path.join(root, 'promo', 'assets', 'raw')
const profile = path.join(root, 'preview', 'promo-profile-2')
const port = 9342
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

fs.rmSync(profile, { recursive: true, force: true })
fs.mkdirSync(assets, { recursive: true })
fs.rmSync(path.join(framesRoot, 'fullscreen-hero'), { recursive: true, force: true })
fs.mkdirSync(path.join(framesRoot, 'fullscreen-hero'), { recursive: true })

const child = spawn(electron, ['.', `--remote-debugging-port=${port}`, '--mute-audio'], {
  cwd: root,
  env: { ...process.env, SMOOTH_USER_DATA: profile },
  stdio: ['ignore', 'pipe', 'pipe']
})
const logs = []
child.stdout.on('data', (chunk) => logs.push(String(chunk)))
child.stderr.on('data', (chunk) => logs.push(String(chunk)))

let ws
let frames = []
let recording = false

async function buildVideo(name, list) {
  if (list.length < 5) throw new Error('not enough frames')
  const dir = path.join(framesRoot, name)
  fs.mkdirSync(dir, { recursive: true })
  const first = list[0].ts
  const last = list[list.length - 1].ts
  list.forEach((frame, index) => {
    fs.writeFileSync(path.join(dir, `frame-${String(index).padStart(5, '0')}.jpg`), Buffer.from(frame.data, 'base64'))
  })
  const fps = Math.min(60, Math.max(10, (list.length - 1) / Math.max(0.001, last - first)))
  const output = path.join(assets, `${name}.mp4`)
  const result = spawnSync(
    'ffmpeg',
    [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-framerate', fps.toFixed(3),
      '-i', path.join(dir, 'frame-%05d.jpg'),
      '-r', '30',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      output
    ],
    { stdio: 'inherit' }
  )
  if (result.status !== 0) throw new Error('ffmpeg failed')
  console.log(`${name}: ${list.length} frames at ${fps.toFixed(2)} fps -> ${output}`)
}

try {
  let page = null
  for (let attempt = 0; attempt < 60; attempt++) {
    await sleep(500)
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())
      page = targets.find((target) => target.type === 'page')
      if (page) break
    } catch {}
  }
  if (!page) throw new Error('no renderer target')

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
      if (recording) frames.push({ data: message.params.data, ts: message.params.metadata.timestamp })
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
    throw new Error('app UI missing')
  }

  await waitForApp()
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('smoothradio:v1', JSON.stringify({
      version: 1,
      state: { favorites: [], recents: [], customStations: [], volume: 0.68, accent: 'mint', current: null, muted: false }
    }))`
  })
  await send('Page.reload')
  await sleep(1500)
  await waitForApp()
  await send('Runtime.evaluate', { expression: `window.smooth.window.toggleFullscreen()`, awaitPromise: true })
  await sleep(1400)

  await send('Runtime.evaluate', {
    expression: `[...document.querySelectorAll('button')].find((button) => button.innerText.includes('Jetzt reinhören'))?.click()`
  })
  await sleep(4200)
  await send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }))`
  })
  await sleep(2800)

  const still = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(assets, 'fullscreen.png'), Buffer.from(still.data, 'base64'))
  console.log('still: fullscreen.png')

  frames = []
  recording = true
  await send('Page.startScreencast', {
    format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 2
  })
  await sleep(7500)
  recording = false
  await send('Page.stopScreencast')
  await buildVideo('fullscreen-hero', frames)

  await send('Runtime.evaluate', { expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))` })
  await sleep(500)
  await send('Runtime.evaluate', { expression: `window.smooth.window.toggleFullscreen()`, awaitPromise: true })
  await sleep(400)
  console.log('done')
} catch (error) {
  console.error('FAILED:', error)
  console.error(logs.join('').slice(-2000))
  process.exitCode = 1
} finally {
  try { ws?.close() } catch {}
  spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
}
