export interface Station {
  id: string
  name: string
  url: string
  homepage?: string
  favicon?: string
  /** Hellt das Artwork auf, damit dunkle Wortmarken lesbar bleiben. */
  logoBackground?: 'light'
  tags: string[]
  country?: string
  codec?: string
  bitrate?: number
  hls?: boolean
  curated?: boolean
  description?: string
}

export type View = 'home' | 'search' | 'favorites' | 'history' | 'genre'

export type ToastTone = 'info' | 'success' | 'error'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

export interface Genre {
  id: string
  label: string
  tag: string
  blurb: string
  from: string
  to: string
}
