import { useEffect, useState } from 'react'
import { ChevronRight, ExternalLink, RefreshCw, X } from 'lucide-react'
import { usePlayer } from '../store/player'
import { bridge } from '../lib/bridge'
import { accents } from '../lib/accents'
import { cn } from '../lib/utils'
import { Modal, SettingsRow, Toggle } from './Modal'
import { DiscordIcon } from './DiscordIcon'
import { Logo } from './Logo'

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element {
  const settings = usePlayer((state) => state.settings)
  const discord = usePlayer((state) => state.discord)
  const accent = usePlayer((state) => state.accent)
  const updateSettings = usePlayer((state) => state.updateSettings)
  const setAccent = usePlayer((state) => state.setAccent)
  const setDiscord = usePlayer((state) => state.setDiscord)
  const pushToast = usePlayer((state) => state.pushToast)

  const [clientId, setClientId] = useState('')
  const [imageKey, setImageKey] = useState('logo')
  const [version, setVersion] = useState('1.0.0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!settings) return
    setClientId(settings.discordClientId)
    setImageKey(settings.discordLargeImageKey || 'logo')
  }, [settings, open])

  useEffect(() => {
    bridge.app.version().then(setVersion).catch(() => undefined)
  }, [])

  const saveDiscord = async (): Promise<void> => {
    setSaving(true)
    try {
      await updateSettings({
        discordClientId: clientId.trim(),
        discordLargeImageKey: imageKey.trim() || 'logo'
      })
      pushToast('Discord-Einstellungen gespeichert', 'success')
    } finally {
      setSaving(false)
    }
  }

  const statusTone =
    discord.state === 'ready'
      ? 'bg-emerald-400'
      : discord.state === 'connecting'
        ? 'bg-amber-400'
        : discord.state === 'error'
          ? 'bg-red-400'
          : 'bg-white/25'

  return (
    <Modal open={open} onClose={onClose} className="flex max-h-[84vh] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-5">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-white/25">SmoothRadio</p>
          <h2 className="font-display mt-1 text-[21px] font-semibold tracking-[-0.025em] text-white">Einstellungen</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="grid size-9 place-items-center rounded-full text-white/35 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-6 pb-7">
        {settings && (
          <>
            <section className="pt-5">
              <div className="flex items-center gap-2">
                <DiscordIcon className="size-4 text-[#8b9cf7]" />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">Discord Rich Presence</h3>
                <span className="ml-auto flex items-center gap-1.5 rounded-full border border-white/[0.07] px-2 py-0.5 text-[10px] text-white/40">
                  <span className={cn('size-1.5 rounded-full', statusTone)} />
                  {discord.state === 'ready'
                    ? 'verbunden'
                    : discord.state === 'connecting'
                      ? 'verbinde …'
                      : discord.state === 'error'
                        ? 'Fehler'
                        : 'aus'}
                </span>
              </div>

              <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[12.5px] font-medium text-white/80">Status in Discord anzeigen</p>
                    <p className="mt-0.5 text-[11px] text-white/30">
                      Sender, Song und Live-Status erscheinen in deinem Profil.
                    </p>
                  </div>
                  <Toggle
                    label="Discord Rich Presence"
                    checked={settings.discordEnabled}
                    onChange={(value) => void updateSettings({ discordEnabled: value })}
                  />
                </div>

                {discord.state !== 'off' && discord.message && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2">
                    <p className="text-[11px] text-white/45">
                      {discord.state === 'ready' && discord.username
                        ? `Verbunden als ${discord.username}`
                        : discord.message}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        const status = await bridge.discord.reconnect()
                        setDiscord(status)
                      }}
                      className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <RefreshCw size={10} />
                      Neu verbinden
                    </button>
                  </div>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-white/30">
                      Application ID
                    </span>
                    <input
                      value={clientId}
                      onChange={(event) => setClientId(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void saveDiscord()
                      }}
                      placeholder="z. B. 1234567890123456789"
                      spellCheck={false}
                      className="h-10 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 font-mono text-[12px] text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-[var(--accent)]/40"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void saveDiscord()}
                    disabled={saving}
                    className="mt-[22px] h-10 rounded-xl bg-[var(--accent)] px-4 text-[12px] font-semibold text-[#05060a] transition-[filter] hover:brightness-110 disabled:opacity-50"
                  >
                    Speichern
                  </button>
                </div>

                <details className="group mt-4 rounded-xl border border-white/[0.06] bg-black/15 px-3.5 py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[11.5px] font-medium text-white/55 transition-colors hover:text-white/85">
                    <ChevronRight size={13} className="transition-transform group-open:rotate-90" />
                    So richtest du Discord RPC in 2 Minuten ein
                  </summary>
                  <ol className="mt-3 space-y-2 pl-1 text-[11px] leading-relaxed text-white/40">
                    <li>
                      <span className="text-white/60">1.</span> Im{' '}
                      <button
                        type="button"
                        onClick={() => void bridge.app.openExternal('https://discord.com/developers/applications')}
                        className="text-[var(--accent)]/90 underline decoration-[var(--accent)]/30 underline-offset-2 hover:text-[var(--accent)]"
                      >
                        Discord Developer Portal
                      </button>{' '}
                      eine neue Application anlegen.
                    </li>
                    <li>
                      <span className="text-white/60">2.</span> Unter „General Information" die{' '}
                      <span className="text-white/65">Application ID</span> kopieren und oben einfügen.
                    </li>
                    <li>
                      <span className="text-white/60">3.</span> Optional für das Logo: Unter „Rich Presence" → „Art
                      Assets" die Datei <span className="font-mono text-white/55">discord-logo.png</span> als Asset mit
                      dem Namen <span className="font-mono text-white/55">logo</span> hochladen.
                    </li>
                    <li>
                      <span className="text-white/60">4.</span> Discord Desktop starten, speichern — fertig. RPC
                      funktioniert nur lokal auf diesem PC.
                    </li>
                  </ol>
                  <button
                    type="button"
                    onClick={() => void bridge.app.openExternal('https://discord.com/developers/applications')}
                    className="mt-3 flex items-center gap-1.5 text-[10.5px] font-medium text-[var(--accent)]/80 hover:text-[var(--accent)]"
                  >
                    Developer Portal öffnen
                    <ExternalLink size={11} />
                  </button>
                </details>

                <div className="mt-4 space-y-1">
                  <SettingsRow
                    title="Sender-Button anzeigen"
                    description="Fügt deinem Discord-Status einen Button zum Sender hinzu."
                  >
                    <Toggle
                      label="Discord-Button"
                      checked={settings.discordShowButtons}
                      onChange={(value) => void updateSettings({ discordShowButtons: value })}
                    />
                  </SettingsRow>
                  <div className="flex items-center gap-2 border-t border-white/[0.05] pt-3">
                    <label className="min-w-0 flex-1">
                      <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/25">
                        Large-Image Asset-Key
                      </span>
                      <input
                        value={imageKey}
                        onChange={(event) => setImageKey(event.target.value)}
                        onBlur={() => void saveDiscord()}
                        placeholder="logo"
                        spellCheck={false}
                        className="h-9 w-full rounded-lg border border-white/[0.07] bg-black/25 px-2.5 font-mono text-[11.5px] text-white/70 outline-none focus:border-[var(--accent)]/40"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 border-t border-white/[0.06] pt-5">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">Darstellung</h3>
              <p className="mt-1 text-[11px] text-white/30">Akzentfarbe für Player, Icons und Highlights.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {accents.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAccent(item.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all',
                      accent === item.id
                        ? 'border-white/25 bg-white/[0.07] text-white'
                        : 'border-white/[0.07] text-white/40 hover:border-white/15 hover:text-white/75'
                    )}
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-6 border-t border-white/[0.06] pt-5">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">Verhalten</h3>
              <div className="mt-1 divide-y divide-white/[0.05]">
                <SettingsRow
                  title="Im Tray weiterlaufen"
                  description="Beim Schließen wird das Fenster versteckt, die Musik läuft weiter."
                >
                  <Toggle
                    label="Im Tray weiterlaufen"
                    checked={settings.closeToTray}
                    onChange={(value) => void updateSettings({ closeToTray: value })}
                  />
                </SettingsRow>
                <SettingsRow
                  title="Beim Anmelden starten"
                  description="SmoothRadio startet automatisch mit Windows (im Tray)."
                >
                  <Toggle
                    label="Autostart"
                    checked={settings.launchAtLogin}
                    onChange={(value) => void updateSettings({ launchAtLogin: value })}
                  />
                </SettingsRow>
                <SettingsRow
                  title="Minimiert starten"
                  description="Beim Autostart nur im Tray erscheinen, nicht als Fenster."
                >
                  <Toggle
                    label="Minimiert starten"
                    checked={settings.startHidden}
                    onChange={(value) => void updateSettings({ startHidden: value })}
                  />
                </SettingsRow>
              </div>
            </section>

            <section className="mt-6 border-t border-white/[0.06] pt-5">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">Tastenkürzel</h3>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  ['Space', 'Play / Pause'],
                  ['F', 'Fullscreen-Player'],
                  ['Esc', 'Player schließen'],
                  ['F11', 'Vollbild umschalten'],
                  ['Ctrl K', 'Suche fokussieren'],
                  ['M', 'Stummschalten']
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between text-[11px] text-white/35">
                    <span>{label}</span>
                    <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-white/50">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 border-t border-white/[0.06] pt-5">
              <div className="flex items-center gap-3.5">
                <Logo size={48} />
                <div>
                  <p className="font-display text-[15px] font-semibold tracking-[-0.02em] text-white">
                    SmoothRadio <span className="text-white/30">v{version.split(' ')[0]}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/30">
                    Ein smoother Desktop-Radio-Client. Lokal, werbefrei, ohne Konto.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: 'SomaFM', url: 'https://somafm.com/' },
                  { label: 'Radio Paradise', url: 'https://radioparadise.com/' },
                  { label: 'Radio-Browser', url: 'https://www.radio-browser.info/' },
                  { label: 'Discord Portal', url: 'https://discord.com/developers/applications' }
                ].map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => void bridge.app.openExternal(link.url)}
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.07] px-2.5 py-1 text-[10.5px] text-white/35 transition-colors hover:border-white/15 hover:text-white/70"
                  >
                    {link.label}
                    <ExternalLink size={9} />
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[10px] leading-relaxed text-white/20">
                Streams gehören ihren jeweiligen Sendern. SmoothRadio speichert nur Favoriten und Einstellungen lokal
                auf diesem Gerät.
              </p>
            </section>
          </>
        )}
      </div>
    </Modal>
  )
}
