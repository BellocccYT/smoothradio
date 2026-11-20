import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const outDir = path.resolve('promo/assets/audio')
fs.mkdirSync(outDir, { recursive: true })

const SR = 44100
const DUR = 22.7
const N = Math.floor(SR * DUR)

// A minor ambient progression: Am9 -> Fmaj9 -> Cmaj9 -> G6/9
const chords = [
  { bass: 55.0, notes: [220.0, 261.63, 329.63, 392.0, 493.88] },
  { bass: 43.65, notes: [174.61, 220.0, 261.63, 329.63, 392.0] },
  { bass: 65.41, notes: [196.0, 261.63, 329.63, 392.0, 440.0] },
  { bass: 49.0, notes: [196.0, 246.94, 293.66, 329.63, 392.0] }
]

const L = new Float64Array(N)
const R = new Float64Array(N)

const smooth = (x) => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

// --- Pad ---
const segment = 4.8
const overlap = 1.5
for (let s = 0; s * segment < DUR + segment; s++) {
  const chord = chords[s % chords.length]
  const start = s * segment - 0.4
  const end = start + segment + overlap
  const from = Math.max(0, Math.floor(start * SR))
  const to = Math.min(N, Math.floor(end * SR))
  for (let i = from; i < to; i++) {
    const t = i / SR
    const local = t - start
    const env = smooth(local / 1.6) * (1 - smooth((local - (segment + overlap - 1.6)) / 1.6))
    if (env <= 0) continue
    let value = 0
    for (let v = 0; v < chord.notes.length; v++) {
      const freq = chord.notes[v]
      const detune = 1 + (v % 2 === 0 ? 0.0012 : -0.0012)
      const vibrato = 1 + 0.0007 * Math.sin(2 * Math.PI * 0.09 * t + v)
      value +=
        Math.sin(2 * Math.PI * freq * detune * vibrato * t + v * 1.3) * 0.6 +
        Math.sin(2 * Math.PI * freq * 2 * t + v * 0.7) * 0.12
    }
    value = (value / chord.notes.length) * env * 0.5
    const pan = 0.5 + 0.18 * Math.sin(s * 1.7 + t * 0.1)
    L[i] += value * (1 - pan)
    R[i] += value * pan
  }
}

// --- Bass ---
for (let bar = 0; bar * 2.4 < DUR + 2.4; bar++) {
  const chord = chords[Math.floor((bar * 2.4) / segment) % chords.length]
  const start = bar * 2.4
  for (let i = Math.floor(start * SR); i < Math.min(N, Math.floor((start + 2.2) * SR)); i++) {
    const t = i / SR - start
    const env = Math.min(1, t / 0.04) * Math.exp(-t / 1.5)
    const value = Math.sin(2 * Math.PI * chord.bass * t) * env * 0.22
    L[i] += value
    R[i] += value
  }
}

// --- Pluck arpeggio with ping-pong delay ---
const pattern = [0, 2, 1, 3, 2, 1, 0, 4]
let pluckIndex = 0
for (let step = 0; step * 0.3 < DUR - 0.4; step++) {
  const time = step * 0.3 + 0.3
  const chord = chords[Math.floor(time / segment) % chords.length]
  const note = chord.notes[pattern[pluckIndex % pattern.length]] * 2
  pluckIndex++
  const start = Math.floor(time * SR)
  for (let i = start; i < Math.min(N, start + Math.floor(0.45 * SR)); i++) {
    const t = i / SR - time
    const env = Math.min(1, t / 0.006) * Math.exp(-t / 0.13)
    const value =
      (Math.sin(2 * Math.PI * note * t) + 0.25 * Math.sin(2 * Math.PI * note * 2 * t)) * env * 0.07
    const pan = step % 2 === 0 ? 0.32 : 0.68
    L[i] += value * (1 - pan)
    R[i] += value * pan
    // delay
    for (const [offset, gain] of [[0.36, 0.3], [0.72, 0.15]]) {
      const d = i + Math.floor(offset * SR)
      if (d < N) {
        L[d] += value * (1 - pan) * gain
        R[d] += value * pan * gain
      }
    }
  }
}

// --- Soft kick on 1 and 3 ---
for (let time = 0.0; time < DUR; time += 1.2) {
  for (let i = Math.floor(time * SR); i < Math.min(N, Math.floor((time + 0.4) * SR)); i++) {
    const t = i / SR - time
    const env = Math.exp(-t / 0.075)
    const freq = 58 - 18 * Math.min(1, t / 0.08)
    const value = Math.sin(2 * Math.PI * freq * t) * env * 0.2
    L[i] += value
    R[i] += value
  }
}

// --- Brushed hats on offbeats ---
let noiseState = 22222
const noise = () => {
  noiseState = (noiseState * 1664525 + 1013904223) % 4294967296
  return (noiseState / 2147483648 - 1) * 1
}
for (let time = 0.3; time < DUR; time += 0.6) {
  let previous = 0
  for (let i = Math.floor(time * SR); i < Math.min(N, Math.floor((time + 0.09) * SR)); i++) {
    const t = i / SR - time
    const raw = noise()
    const high = raw - previous
    previous = raw
    const value = high * Math.exp(-t / 0.022) * 0.022
    L[i] += value * 0.9
    R[i] += value * 1.1
  }
}

// --- Master ---
let peak = 0
for (let i = 0; i < N; i++) {
  const fadeIn = Math.min(1, i / (SR * 1.2))
  const fadeOut = Math.min(1, (N - i) / (SR * 2.8))
  const gain = smooth(fadeIn) * smooth(fadeOut)
  const drive = 1.15
  L[i] = Math.tanh(L[i] * drive * gain) / Math.tanh(drive)
  R[i] = Math.tanh(R[i] * drive * gain) / Math.tanh(drive)
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
}

const norm = peak > 0 ? 0.89 / peak : 1
const buffer = Buffer.alloc(44 + N * 4)
buffer.write('RIFF', 0)
buffer.writeUInt32LE(36 + N * 4, 4)
buffer.write('WAVE', 8)
buffer.write('fmt ', 12)
buffer.writeUInt32LE(16, 16)
buffer.writeUInt16LE(1, 20)
buffer.writeUInt16LE(2, 22)
buffer.writeUInt32LE(SR, 24)
buffer.writeUInt32LE(SR * 4, 28)
buffer.writeUInt16LE(4, 32)
buffer.writeUInt16LE(16, 34)
buffer.write('data', 36)
buffer.writeUInt32LE(N * 4, 40)

for (let i = 0; i < N; i++) {
  buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4)
  buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4)
}

const rawPath = path.join(outDir, 'bed-raw.wav')
fs.writeFileSync(rawPath, buffer)

const normalized = path.join(outDir, 'bed.wav')
const result = spawnSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-i', rawPath,
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7',
  '-ar', '44100', '-ac', '2',
  normalized
], { stdio: 'inherit' })
if (result.status !== 0) throw new Error('loudnorm failed')
fs.rmSync(rawPath)

// --- Whoosh for the fullscreen cut ---
const whooshDur = 0.8
const whooshN = Math.floor(whooshDur * SR)
const wb = Buffer.alloc(44 + whooshN * 4)
wb.write('RIFF', 0)
wb.writeUInt32LE(36 + whooshN * 4, 4)
wb.write('WAVE', 8)
wb.write('fmt ', 12)
wb.writeUInt32LE(16, 16)
wb.writeUInt16LE(1, 20)
wb.writeUInt16LE(2, 22)
wb.writeUInt32LE(SR, 24)
wb.writeUInt32LE(SR * 4, 28)
wb.writeUInt16LE(4, 32)
wb.writeUInt16LE(16, 34)
wb.write('data', 36)
wb.writeUInt32LE(whooshN * 4, 40)

let whooshPeak = 0
const whoosh = new Float64Array(whooshN)
let previous = 0
let state = 99173
for (let i = 0; i < whooshN; i++) {
  const t = i / SR
  state = (state * 1664525 + 1013904223) % 4294967296
  const raw = state / 2147483648 - 1
  const high = raw - previous
  previous = raw
  const env = Math.pow(t / whooshDur, 1.4) * Math.exp(-t * 3.2)
  whoosh[i] = high * env
  whooshPeak = Math.max(whooshPeak, Math.abs(whoosh[i]))
}
whooshPeak = whooshPeak > 0 ? 0.8 / whooshPeak : 1
for (let i = 0; i < whooshN; i++) {
  const value = whoosh[i] * whooshPeak * (0.6 + 0.4 * Math.sin(i / 200))
  wb.writeInt16LE(Math.round(value * 32767), 44 + i * 4)
  wb.writeInt16LE(Math.round(value * 32767), 46 + i * 4)
}
fs.writeFileSync(path.join(outDir, 'whoosh.wav'), wb)

console.log('music bed:', normalized)
console.log('whoosh:', path.join(outDir, 'whoosh.wav'))
