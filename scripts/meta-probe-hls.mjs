import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const electron = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe')
const profile = path.join(root, 'preview', 'hls-probe')
const port = 9346
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const station = {
  id: 'wdr2-owl-hls',
  name: 'WDR 2 Ostwestfalen-Lippe',
  url: 'https://wdrhf.akamaized.net/hls/live/2027967/wdr2ostwestfalenlippe/192/seglist.m3u8',
  tags: ['music', 'news'],
  country: 'Germany',
  codec: 'UNKNOWN',
  bitrate: 0,
  hls: true
}

const packagedExe = process.env.PROBE_EXE
const child = packagedExe
  ? spawn(packagedExe, [`--remote-debugging-port=${port}`, '--mute-audio'], {
      env: { ...process.env, SMOOTH_USER_DATA: profile },
      stdio: ['ignore', 'pipe', 'pipe']
    })
  : spawn(electron, ['.', `--remote-debugging-port=${port}`, '--mute-audio', '--enable-logging'], {
      cwd: root,
      env: { ...process.env, SMOOTH_USER_DATA: profile, ELECTRON_ENABLE_LOGGING: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    })

child.stdout.on('data', (chunk) => {
  const text = String(chunk)
  if (text.includes('[meta-main]')) console.log('MAIN', text.trim().slice(0, 400))
})
child.stderr.on('data', (chunk) => {
  const text = String(chunk)
  if (text.includes('[meta-main]')) console.log('MAIN', text.trim().slice(0, 400))
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
  await send('Network.enable')
  await send('Log.enable')
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE', message.params.args.map((arg) => arg.value ?? arg.description).join(' '))
    }
    if (message.method === 'Log.entryAdded') {
      console.log('LOG', message.params.entry.text)
    }
    if (message.method === 'Network.responseReceived' && /wdr|radio-browser/i.test(message.params.response.url)) {
      console.log('NET', message.params.response.status, message.params.response.url.slice(0, 140))
    }
    if (message.method === 'Network.loadingFailed') {
      console.log('NETFAIL', message.params.errorText)
    }
  })
  await sleep(1500)
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('smoothradio:v1', JSON.stringify({ version: 1, state: {
      favorites: [], recents: [], customStations: [], volume: 0.5, accent: 'mint',
      current: ${JSON.stringify(station)}, muted: false
    } }))`
  })
  await send('Page.reload')
  await sleep(2200)
  await send('Runtime.evaluate', {
    expression: `document.querySelector('footer button[aria-label="Abspielen"]')?.click()`
  })
  for (let second = 2; second <= 26; second += 2) {
    await sleep(2000)
    const probe = await send('Runtime.evaluate', {
      expression: `({
        hero: document.querySelector('h2')?.innerText,
        nowLine: [...document.querySelectorAll('p')].map((p) => p.innerText).find((t) => t.includes(' — ')) ?? null,
        body: document.body.innerText.slice(0, 520).replace(/\\n+/g, ' | '),
        hls: document.body.innerText.includes('HLS')
      })`,
      returnByValue: true
    })
    console.log(`T+${second}s`, JSON.stringify(probe.result.value))
  }

  const shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(root, 'preview', 'wdr-metadata.png'), Buffer.from(shot.data, 'base64'))
  console.log('Saved preview/wdr-metadata.png')
} catch (error) {
  console.error('FAILED', error)
} finally {
  try { ws?.close() } catch {}
  spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
}
