import { useEffect, useState } from 'react'
import { Link2, X } from 'lucide-react'
import { usePlayer } from '../store/player'
import { isWebApp } from '../lib/env'
import type { Station } from '../lib/types'
import { Modal } from './Modal'

export function AddStreamDialog({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element {
  const addCustomStation = usePlayer((state) => state.addCustomStation)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [homepage, setHomepage] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setUrl('')
    setHomepage('')
    setError(null)
  }, [open])

  const submit = async (): Promise<void> => {
    const trimmedUrl = url.trim()
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError('Bitte eine vollständige Stream-URL mit http:// oder https:// eingeben.')
      return
    }
    if (isWebApp && !/^https:\/\//i.test(trimmedUrl)) {
      setError('Im Browser funktionieren nur https-Streams – http wird auf einer https-Seite blockiert.')
      return
    }
    let hostname = ''
    try {
      hostname = new URL(trimmedUrl).hostname
    } catch {
      setError('Diese URL sieht nicht gültig aus.')
      return
    }
    setError(null)
    const station: Station = {
      id: `custom-${Date.now()}`,
      name: name.trim() || hostname,
      url: trimmedUrl,
      homepage: homepage.trim() || undefined,
      favicon: `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      tags: ['Eigener Stream'],
      country: 'Eigene Quelle',
      codec: /\.m3u8(\?|$)/i.test(trimmedUrl) ? 'HLS' : 'Stream',
      curated: true
    }
    await addCustomStation(station)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-[480px]">
      <div className="flex items-start justify-between px-6 pt-6">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-white/25">Eigene Quelle</p>
          <h2 className="font-display mt-1 text-[21px] font-semibold tracking-[-0.025em] text-white">
            Stream hinzufügen
          </h2>
          <p className="mt-1.5 text-[11.5px] text-white/35">
            MP3-, AAC- oder HLS-Stream (.m3u8). Die URL muss direkt auf den Audio-Stream zeigen.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="grid size-8 place-items-center rounded-full text-white/35 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <X size={15} />
        </button>
      </div>

      <div className="space-y-3.5 px-6 pb-6 pt-5">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-white/30">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mein Lieblingssender"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 text-[12.5px] text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-[var(--accent)]/40"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-white/30">
            Stream-URL
          </span>
          <div className="relative">
            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void submit()
              }}
              placeholder="https://stream.example.com/live.mp3"
              spellCheck={false}
              autoFocus
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-black/30 pl-9 pr-3 font-mono text-[11.5px] text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-[var(--accent)]/40"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-white/30">
            Website <span className="text-white/15">(optional)</span>
          </span>
          <input
            value={homepage}
            onChange={(event) => setHomepage(event.target.value)}
            placeholder="https://example.com"
            spellCheck={false}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 font-mono text-[11.5px] text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-[var(--accent)]/40"
          />
        </label>

        {error && (
          <p className="rounded-lg border border-red-400/15 bg-red-500/[0.06] px-3 py-2 text-[11px] text-red-200/75">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-full px-4 text-[12px] font-medium text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white/80"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            className="h-9 rounded-full bg-[var(--accent)] px-4 text-[12px] font-semibold text-[#05060a] transition-[filter] hover:brightness-110"
          >
            Hinzufügen & abspielen
          </button>
        </div>
      </div>
    </Modal>
  )
}
