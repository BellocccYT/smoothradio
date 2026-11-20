import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { AppSettings, DEFAULT_SETTINGS } from '@shared/types'

let cache: AppSettings | null = null

function settingsFile(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function getSettings(): AppSettings {
  if (cache) return cache
  try {
    const raw = fs.readFileSync(settingsFile(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    cache = { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    cache = { ...DEFAULT_SETTINGS }
  }
  return cache
}

export function setSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch }
  cache = next
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true })
    const tmp = `${settingsFile()}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8')
    fs.renameSync(tmp, settingsFile())
  } catch (error) {
    console.error('[settings] could not persist', error)
  }
  return next
}
