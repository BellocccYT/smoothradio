import type { SmoothApi } from '../shared/types'

declare global {
  interface Window {
    smooth?: SmoothApi
  }
}

export {}
