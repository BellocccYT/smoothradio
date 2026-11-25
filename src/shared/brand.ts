/**
 * Zentrale Marken-Definition. Der Name ist bewusst kein "Smooth Radio"
 * (Marke von Global/UK) und die Website bleibt ein privates, werbefreies
 * Hobbyprojekt.
 */
export const BRAND = {
  name: 'Funkkunst',
  tagline: 'Radio, das Kunst ist.',
  domain: 'funkkunst.de',
  url: 'https://funkkunst.de',
  description:
    'Funkkunst ist ein kostenloses Webradio: handverlesene Sender und über 50.000 Livestreams. Ohne Werbung, ohne Konto, ohne Tracking.',
  contactEmail: 'kontakt@funkkunst.de'
} as const

export type Brand = typeof BRAND
