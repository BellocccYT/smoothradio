# Funkkunst

Ein Webradio für Desktop und Browser — handverlesene Sender, Live-Metadaten, animiertes Spektrum und **Discord Rich Presence** in der Desktop-App. Gebaut mit Electron, React, TypeScript und Tailwind.

![Funkkunst](docs/screenshot.png)

> **Hinweis:** Funkkunst ist ein privates, nicht-kommerzielles Projekt. Es gibt keine Werbung, keine Spendenaufrufe, keine Konten und kein Tracking.

## Download

[**Windows-Installer & Portable herunterladen**](https://github.com/BellocccYT/smoothradio/releases/latest) · [Zum Quellcode](https://github.com/BellocccYT/smoothradio) · [**Website: funkkunst.de**](https://funkkunst.de)

## Features

- **Entdecken** — kuratierte Sender (SomaFM, Radio Paradise, FIP, KEXP, 1LIVE, DLF, Nightride …) plus ~50.000 Sender über die Radio-Browser-API
- **Suche & Genres** — nach Name, Stadt oder Stimmung; acht Genre-Welten
- **Live-Metadaten** — aktuelle Songs via ICY-StreamTitle, automatisch aktualisiert; HLS-Sender wie WDR 2 nutzen automatisch einen MP3-Spiegel *(nur Desktop)*
- **Discord Rich Presence** — Sender, Song und Live-Status im Discord-Profil, inkl. Sender-Button *(nur Desktop)*
- **Favoriten, Verlauf, eigene Streams** — lokal gespeichert, kein Konto nötig
- **Fullscreen-Player** — ein immersiver Now-Playing-Modus mit riesigem Vinyl-Artwork, Live-Spektrum, Queue und Discord-Status (`F`)
- **Sleep-Timer, Media-Tasten, Tray** — Radio läuft weiter, wenn das Fenster zu ist *(Tray nur Desktop)*
- **Eigenes Design** — Vektor-Logo, Glass-UI, Aurora-Hintergrund, sechs Akzentfarben, animiertes Canvas-Spektrum

![Fullscreen Player](docs/fullscreen.png)

## Website (Browser-Version)

Funkkunst lässt sich als statische Website auf einer `.de`-Domain betreiben. Der Web-Build nutzt denselben React-Renderer, spielt Streams aber direkt im Browser ab — ohne Proxy, ohne Server-Logik, ohne Werbung.

```bash
npm install
npm run build:web     # erzeugt dist-web/
npm run preview:web   # lokal auf http://localhost:4173
```

Das Ergebnis in `dist-web/` ist reines Static Hosting: HTML, JS, CSS, Fonts, `robots.txt`, `sitemap.xml`. Details zu Deployment und Recht findest du in **[docs/web-deployment.md](docs/web-deployment.md)**.

### Unterschiede zur Desktop-App

| | Desktop | Website |
|---|---|---|
| Discord Rich Presence | ✅ | — (kein IPC im Browser) |
| Echte Songtitel (ICY) | ✅ | — (Browser kann keine ICY-Header lesen) |
| http-Streams | ✅ | — (Mixed Content wird blockiert) |
| Tray, Autostart, Media-Tasten | ✅ | — |
| Favoriten, Verlauf, eigene Sender | ✅ | ✅ (localStorage) |

## Schnellstart (Entwicklung)

```bash
npm install
npm run dev        # Electron-App
npm run dev:web    # Website im Browser
```

> Falls Electron unter Windows nicht startet, weil `npm` Install-Scripts blockiert:
> `node node_modules/electron/install.js`

## EXE bauen

```bash
npm run dist
```

Ergebnis in `dist/`:

- `Funkkunst-1.0.1-x64.exe` — One-Click-Installer, per Benutzer (keine Adminrechte, Desktop-Shortcut)
- `Funkkunst-1.0.1-Portable.exe` — portable Version ohne Installation

Die EXE ist **nicht code-signiert**. Windows SmartScreen zeigt beim ersten Start ggf. „Unbekannter Herausgeber" → *Weitere Informationen* → *Trotzdem ausführen*.

## Discord Rich Presence einrichten

1. [Discord Developer Portal](https://discord.com/developers/applications) öffnen → **New Application**
2. Unter **General Information** die **Application ID** kopieren
3. In Funkkunst → **Einstellungen** → **Discord Rich Presence** aktivieren, ID einfügen, **Speichern**
4. Optional: Unter **Rich Presence → Art Assets** die Datei `resources/discord-logo.png` als Asset namens `logo` hochladen — dann erscheint das App-Logo im Discord-Profil

Discord Desktop muss auf demselben PC laufen. Bei geschlossenem Discord versucht Funkkunst automatisch alle 20 Sekunden erneut zu verbinden.

![Einstellungen](docs/settings.png)

## Shortcuts

| Taste | Aktion |
| --- | --- |
| `Space` | Play / Pause |
| `F` | Fullscreen-Player öffnen / schließen |
| `Esc` | Fullscreen-Player schließen |
| `F11` | Echtes Vollbild umschalten *(nur Desktop)* |
| `Ctrl + K` oder `/` | Suche fokussieren |
| `M` | Stummschalten |
| `F12` | DevTools |

Media-Tasten (Play/Pause, Next, Previous) und das Tray-Menü steuern den Player ebenfalls.

## Projektstruktur

```
src/
  main/        Electron-Main: Fenster, Tray, Settings, Discord RPC, ICY-Metadaten
  preload/     typsichere IPC-Bridge (contextBridge)
  renderer/    React-App (Views, Komponenten, Store, Audio-Engine)
  shared/      gemeinsame TypeScript-Typen und Marken-Definition
resources/     Logo, Tray-Icon, Discord-Asset
scripts/       Icon-Pipeline, Preview-Server, Smoke-Test
vite.web.config.mts  Static-Website-Build (dist-web/)
```

## Technik

- Electron 45 · React 19 · TypeScript 5.9 · Vite 8 · Tailwind 4
- `@xhayper/discord-rpc` für Rich Presence (IPC, Main-Prozess)
- `hls.js` für `.m3u8`-Streams, nativer MP3/AAC-Support über `<audio>`
- Zustand + Persist für Favoriten/Verlauf/Player-State
- Icons & Logo: handgezeichnetes SVG, per `sharp` zu PNG/ICO gerendert (`npm run icon`)

## Credits

Streams und Metadaten gehören den jeweiligen Sendern. Funkkunst speichert ausschließlich lokal (Favoriten, Verlauf, Einstellungen) und sendet keine Nutzungsdaten. Die Website setzt keine Cookies und kein Tracking ein.
