import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const electron = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe')
const profile = path.join(root, 'preview', 'meta-probe')
const port = 9343
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const station = {
  id: 'curated-paradise',
  name: 'Radio Paradise',
  url: 'https://stream.radioparadise.com/mp3-192',
  homepage: 'https://radioparadise.com/',
  tags: ['Eclectic', 'Rock', 'Curated'],
  country: 'USA',
  codec: 'MP3',
  bitrate: 192,
  curated: true,
  description: 'Handkuratierter Mix aus Rock, Folk, Electronic und Weltmusik.'
}

const child = spawn(electron, ['.', `--remote-debugging-port=${port}`, '--mute-audio'], {
  cwd: root,
  env: { ...process.env, SMOOTH_USER_DATA: profile },
  stdio: ['ignore', 'pipe', 'pipe']
})

let ws
try {
  let page = null
  for (let attempt = 0; attempt < 50; attempt++) {
    await sleep(500)
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())
      page = targets.find((target) => target.type === 'page')
      if (page) break
    } catch {}
  }
  if (!page) throw new Error('no target')

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
  await sleep(1500)
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('smoothradio:v1', JSON.stringify({ version: 1, state: {
      favorites: [], recents: [], customStations: [], volume: 0.68, accent: 'mint',
      current: ${JSON.stringify(station)}, muted: false
    } }))`
  })
  await send('Page.reload')
  await sleep(2000)
  await send('Runtime.evaluate', {
    expression: `document.querySelector('main button[aria-label="Abspielen"]')?.click() ?? document.querySelector('button[aria-label="Abspielen"]')?.click()`
  })

  for (let second = 2; second <= 24; second += 2) {
    await sleep(2000)
    const probe = await send('Runtime.evaluate', {
      expression: `({ hero: document.querySelector('h2')?.innerText, body: document.body.innerText.slice(0, 420).replace(/\\n+/g, ' | ') })`,
      returnByValue: true
    })
    console.log(`T+${second}s`, JSON.stringify(probe.result.value))
  }
} catch (error) {
  console.error('FAILED', error)
} finally {
  try { ws?.close() } catch {}
  spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
}
