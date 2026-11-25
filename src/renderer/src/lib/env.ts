/**
 * Laufzeit-Umgebung: Electron-Desktop-App oder Browser (Website).
 * `window.smooth` wird ausschließlich vom Electron-Preload gesetzt.
 */
export const isDesktopApp =
  typeof window !== 'undefined' && Boolean((window as Window & { smooth?: unknown }).smooth)

export const isWebApp = !isDesktopApp
