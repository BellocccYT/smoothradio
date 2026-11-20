export interface Accent {
  id: string
  label: string
  from: string
  to: string
}

export const accents: Accent[] = [
  { id: 'mint', label: 'Mint', from: '#5EEAD4', to: '#38BDF8' },
  { id: 'violet', label: 'Violett', from: '#C084FC', to: '#818CF8' },
  { id: 'rose', label: 'Rosé', from: '#FDA4AF', to: '#F43F5E' },
  { id: 'amber', label: 'Amber', from: '#FCD34D', to: '#FB923C' },
  { id: 'lime', label: 'Limette', from: '#BEF264', to: '#22C55E' },
  { id: 'ice', label: 'Ice', from: '#A5F3FC', to: '#60A5FA' }
]

export function getAccent(id: string): Accent {
  return accents.find((accent) => accent.id === id) ?? accents[0]
}
