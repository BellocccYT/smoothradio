import type { Genre, Station } from './types'

export const curatedStations: Station[] = [
  {
    id: 'curated-groove-salad',
    name: 'SomaFM Groove Salad',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    homepage: 'https://somafm.com/groovesalad/',
    tags: ['Chill', 'Downtempo', 'Ambient'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Ein angenehm entspannter Mix aus Downtempo, Ambient und Trip-Hop.'
  },
  {
    id: 'curated-lush',
    name: 'SomaFM Lush',
    url: 'https://ice1.somafm.com/lush-128-mp3',
    homepage: 'https://somafm.com/lush/',
    tags: ['Vocal', 'Chill', 'Dream Pop'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Sanfte Vocals und verträumte Indie-Pop-Perlen für lange Abende.'
  },
  {
    id: 'curated-drone-zone',
    name: 'SomaFM Drone Zone',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    homepage: 'https://somafm.com/dronezone/',
    tags: ['Ambient', 'Drone', 'Fokus'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Weite Ambient-Flächen. Perfekt zum Arbeiten, Lesen oder Einschlafen.'
  },
  {
    id: 'curated-deep-space-one',
    name: 'SomaFM Deep Space One',
    url: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    homepage: 'https://somafm.com/deepspaceone/',
    tags: ['Ambient', 'Space', 'Electronic'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Klang gewordene Raumfahrt: langsame Synths und tiefe Texturen.'
  },
  {
    id: 'curated-secret-agent',
    name: 'SomaFM Secret Agent',
    url: 'https://ice1.somafm.com/secretagent-128-mp3',
    homepage: 'https://somafm.com/secretagent/',
    tags: ['Lounge', 'Spy Jazz', 'Cinematic'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Cocktail-Lounge, Spionage-Jazz und Kino für die Ohren.'
  },
  {
    id: 'curated-indie-pop',
    name: 'SomaFM Indie Pop Rocks',
    url: 'https://ice1.somafm.com/indiepop-128-mp3',
    homepage: 'https://somafm.com/indiepop/',
    tags: ['Indie', 'Pop', 'Alternative'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Indie-Pop, Shoegaze und Alternative ohne Playlist-Zwang.'
  },
  {
    id: 'curated-beat-blender',
    name: 'SomaFM Beat Blender',
    url: 'https://ice1.somafm.com/beatblender-128-mp3',
    homepage: 'https://somafm.com/beatblender/',
    tags: ['House', 'Deep House', 'Electronic'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Deep House und geschmeidige Grooves für den Flow.'
  },
  {
    id: 'curated-defcon',
    name: 'SomaFM DEF CON Radio',
    url: 'https://ice1.somafm.com/defcon-128-mp3',
    homepage: 'https://somafm.com/defcon/',
    tags: ['Electronic', 'Techno', 'Hacker'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Der Soundtrack der DEF CON: düster, treibend, elektronisch.'
  },
  {
    id: 'curated-fluid',
    name: 'SomaFM Fluid',
    url: 'https://ice1.somafm.com/fluid-128-mp3',
    homepage: 'https://somafm.com/fluid/',
    tags: ['Hip-Hop', 'Instrumental', 'Beats'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Instrumentaler Hip-Hop und entspannte Beat-Tapes.'
  },
  {
    id: 'curated-sonic-universe',
    name: 'SomaFM Sonic Universe',
    url: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    homepage: 'https://somafm.com/sonicuniverse/',
    tags: ['Jazz', 'Avantgarde', 'Modern'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Zeitgenössischer Jazz zwischen Avantgarde und Groove.'
  },
  {
    id: 'curated-boot-liquor',
    name: 'SomaFM Boot Liquor',
    url: 'https://ice1.somafm.com/bootliquor-128-mp3',
    homepage: 'https://somafm.com/bootliquor/',
    tags: ['Americana', 'Country', 'Roots'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Americana, Outlaw Country und staubige Roots-Musik.'
  },
  {
    id: 'curated-left-coast-70s',
    name: 'SomaFM Left Coast 70s',
    url: 'https://ice1.somafm.com/seventies-128-mp3',
    homepage: 'https://somafm.com/seventies/',
    tags: ['70s', 'Rock', 'Classic'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Westcoast-Rock, Softrock und Singer-Songwriter der 70er.'
  },
  {
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
  },
  {
    id: 'curated-paradise-mellow',
    name: 'Radio Paradise Mellow Mix',
    url: 'https://stream.radioparadise.com/mellow-192',
    homepage: 'https://radioparadise.com/',
    tags: ['Mellow', 'Chill', 'Acoustic'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 192,
    curated: true,
    description: 'Die ruhige Seite von Radio Paradise: akustisch, warm, zeitlos.'
  },
  {
    id: 'curated-paradise-global',
    name: 'Radio Paradise Global Mix',
    url: 'https://stream.radioparadise.com/global-192',
    homepage: 'https://radioparadise.com/',
    tags: ['Global', 'World', 'Eclectic'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 192,
    curated: true,
    description: 'Musik aus aller Welt, nahtlos zu einer Reise verwoben.'
  },
  {
    id: 'curated-fip',
    name: 'FIP',
    url: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
    homepage: 'https://www.radiofrance.fr/fip',
    tags: ['Jazz', 'Eclectic', 'Paris'],
    country: 'Frankreich',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Paris in einem Stream: Jazz, Soul, Electro und Entdeckungen.'
  },
  {
    id: 'curated-kexp',
    name: 'KEXP 90.3 Seattle',
    url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
    homepage: 'https://kexp.org/',
    tags: ['Indie', 'Alternative', 'Seattle'],
    country: 'USA',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Seattles legendärer Public-Radio-Sender für neue Musik.'
  },
  {
    id: 'curated-einslive',
    name: '1LIVE',
    url: 'https://wdr-1live-live.icecast.wdr.de/wdr/1live/live/mp3/128/stream.mp3',
    homepage: 'https://www1.wdr.de/radio/1live/',
    tags: ['Pop', 'Charts', 'Deutschland'],
    country: 'Deutschland',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Das junge WDR-Programm: Pop, Comedy und neue Musik.'
  },
  {
    id: 'curated-deutschlandfunk',
    name: 'Deutschlandfunk',
    url: 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3',
    homepage: 'https://www.deutschlandfunk.de/',
    tags: ['News', 'Kultur', 'Deutschland'],
    country: 'Deutschland',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Nachrichten, Hintergründe und Kultur aus Deutschland.'
  },
  {
    id: 'curated-nightride',
    name: 'Nightride FM',
    url: 'https://stream.nightride.fm/nightride.mp3',
    homepage: 'https://nightride.fm/',
    tags: ['Synthwave', 'Electronic', 'Night'],
    country: 'Weltweit',
    codec: 'MP3',
    bitrate: 256,
    curated: true,
    description: 'Synthwave, Retrowave und Neonlicht für die Nacht.'
  },
  {
    id: 'curated-chillsynth',
    name: 'Nightride Chillsynth',
    url: 'https://stream.nightride.fm/chillsynth.mp3',
    homepage: 'https://nightride.fm/',
    tags: ['Chillsynth', 'Dreamwave', 'Chill'],
    country: 'Weltweit',
    codec: 'MP3',
    bitrate: 256,
    curated: true,
    description: 'Langsamere Synthwellen, weiche Flächen, endlose Nacht.'
  },
  {
    id: 'curated-swiss-jazz',
    name: 'Radio Swiss Jazz',
    url: 'https://stream.srg-ssr.ch/m/rsj/mp3_128',
    homepage: 'https://www.radioswissjazz.ch/',
    tags: ['Jazz', 'Soul', 'Schweiz'],
    country: 'Schweiz',
    codec: 'MP3',
    bitrate: 128,
    curated: true,
    description: 'Jazz ohne Unterbrechung, moderiert von der Musik selbst.'
  },
  {
    id: 'curated-fluxfm',
    name: 'FluxFM',
    url: 'https://streams.fluxfm.de/FluxFM/mp3-320/stream.mp3',
    homepage: 'https://www.fluxfm.de/',
    tags: ['Indie', 'Berlin', 'Alternative'],
    country: 'Deutschland',
    codec: 'MP3',
    bitrate: 320,
    curated: true,
    description: 'Berliner Indie-Radio mit Haltung und gutem Geschmack.'
  },
  {
    id: 'curated-sunshine-live',
    name: 'sunshine live',
    url: 'https://stream.sunshine-live.de/live/mp3-192',
    homepage: 'https://www.sunshine-live.de/',
    tags: ['Dance', 'Electronic', 'Deutschland'],
    country: 'Deutschland',
    codec: 'MP3',
    bitrate: 192,
    curated: true,
    description: 'Electronic, Dance und Clubsound aus Mannheim.'
  }
]

export const genres: Genre[] = [
  { id: 'chill', label: 'Chill', tag: 'chillout', blurb: 'Downtempo, Ambient, Lounge', from: '#5EEAD4', to: '#38BDF8' },
  { id: 'jazz', label: 'Jazz', tag: 'jazz', blurb: 'Swing, Soul, Modern Jazz', from: '#FCD34D', to: '#FB923C' },
  { id: 'electronic', label: 'Electronic', tag: 'electronic', blurb: 'House, Techno, Synthwave', from: '#C084FC', to: '#6366F1' },
  { id: 'indie', label: 'Indie', tag: 'indie', blurb: 'Alternative, Shoegaze, Neu', from: '#FDA4AF', to: '#F43F5E' },
  { id: 'rock', label: 'Rock', tag: 'rock', blurb: 'Classic, Garage, Loud', from: '#FB7185', to: '#B91C1C' },
  { id: 'hiphop', label: 'Hip-Hop', tag: 'hip hop', blurb: 'Beats, Rap, Instrumentals', from: '#A3E635', to: '#22C55E' },
  { id: 'classical', label: 'Klassik', tag: 'classical', blurb: 'Orchester, Kammermusik, Fokus', from: '#93C5FD', to: '#6366F1' },
  { id: 'news', label: 'News', tag: 'news', blurb: 'Welt, Politik, Hintergrund', from: '#CBD5E1', to: '#64748B' }
]

export function findGenre(id: string | null): Genre | undefined {
  return genres.find((genre) => genre.id === id)
}

export const featuredStation = curatedStations[0]
