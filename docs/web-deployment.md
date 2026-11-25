# Funkkunst als Website betreiben

Diese Anleitung beschreibt den Static-Website-Build (`dist-web/`), das Deployment auf einer `.de`-Domain und die rechtlichen Leitplanken. Sie ersetzt keine Rechtsberatung.

- **Name:** Funkkunst
- **Domain:** `funkkunst.de` (bei DENIC als frei geprüft, Stand November 2026)
- **Anspruch:** privates, nicht-kommerzielles Hobbyprojekt — keine Werbung, keine Spenden, kein Verkauf, keine Konten

---

## 1. Build

```bash
npm install
npm run build:web
```

Ergebnis: `dist-web/`

```
dist-web/
  index.html
  assets/          JS, CSS, Fonts, App-Icon
  favicon.png
  og.png           Social-Preview
  robots.txt
  sitemap.xml
```

Lokal testen:

```bash
npm run preview:web   # http://localhost:4173
```

Der Build ist eine Single-Page-App ohne Router. Der Datenschutz-Dialog ist über `/#datenschutz` direkt verlinkbar.

## 2. Hosting

Reines Static Hosting genügt. **Gewählter Weg: GitHub Pages + Strato-DNS** (kostenlos, kein Nameserver-Wechsel nötig).

### GitHub Pages einrichten

1. Im Repo unter **Settings → Pages** als **Source** „GitHub Actions" wählen.
2. Push auf `main` (oder manuell den Workflow starten) — `.github/workflows/deploy-web.yml` baut `dist-web/` und veröffentlicht es.
3. Unter **Settings → Pages → Custom domain** `funkkunst.de` eintragen und **Enforce HTTPS** aktivieren (das Zertifikat braucht ggf. ein paar Minuten).
4. Die Datei `src/renderer/public/CNAME` enthält bereits `funkkunst.de` und landet im Build.

### DNS bei Strato

In der Strato-Domainverwaltung → **DNS-Einstellungen** für `funkkunst.de`:

| Typ | Name | Wert | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 3600 |
| A | `@` | `185.199.109.153` | 3600 |
| A | `@` | `185.199.110.153` | 3600 |
| A | `@` | `185.199.111.153` | 3600 |
| AAAA | `@` | `2606:50c0:8000::153` | 3600 |
| AAAA | `@` | `2606:50c0:8001::153` | 3600 |
| AAAA | `@` | `2606:50c0:8002::153` | 3600 |
| AAAA | `@` | `2606:50c0:8003::153` | 3600 |
| CNAME | `www` | `BellocccYT.github.io.` | 3600 |

Wichtig:

- Vorhandene **Park-/Weiterleitungs-Einträge** für `@` und `www` vorher löschen.
- Die AAAA-Records sind optional, aber empfohlen.
- `www.funkkunst.de` leitet GitHub Pages anschließend automatisch auf `funkkunst.de` um, sobald die Domain in den Pages-Einstellungen steht.
- Prüfen: `nslookup funkkunst.de` sollte die vier GitHub-IPs liefern.

### Alternativen

- **Cloudflare Pages:** kostenlos, unbegrenzte Bandbreite — für die Apex-Domain `funkkunst.de` müssen die Nameserver zu Cloudflare wechseln (Strato → Nameserver). Erst danach lässt sich die Apex-Domain sauber verbinden.
- **Netlify:** kostenlos, 100 GB/Monat, Custom Domain per CNAME/ALIAS möglich.
- **Strato-Webhosting:** nur sinnvoll, wenn du dort schon ein Paket bezahlst — dann `dist-web/` per FTP/SSH hochladen.

Wichtig für alle Varianten:

- **HTTPS muss aktiv sein.** Auf einer https-Seite blockieren Browser alle `http://`-Streams (Mixed Content). Der Web-Build filtert solche Sender bereits aus; eigene Streams werden nur mit `https://` angenommen.
- **Kein Proxy, kein Transcoding, kein Recording.** Die Streams laufen direkt vom Sender zum Browser. Genau das hält die GEMA-/GVL-Frage raus. Ein Audio-Proxy würde dich zum Weiterverbreiter machen.
- **Keine Server-Logik nötig.** Kein Node-Server, keine Datenbank, keine Sessions.

## 3. Domain

`funkkunst.de` ist bei **Strato** registriert. DENIC verlangt einen Inhaber mit deutscher Postanschrift (kein Postfach) — das ist mit der Registrierung bereits erledigt.

1. DNS-Einträge wie oben bei Strato setzen
2. In GitHub Pages `funkkunst.de` als Custom Domain eintragen
3. HTTPS-Zertifikat ausstellen lassen (GitHub Pages, kostenlos)

Die Domain bleibt bei Strato; es ist kein Umzug und kein Nameserver-Wechsel nötig.

## 4. Was die Website bewusst nicht kann

| Feature | Grund |
|---|---|
| Discord Rich Presence | Kein IPC im Browser; nur Desktop-App |
| Echte Songtitel (ICY) | Browser kann keine ICY-Header lesen. Ein Metadata-Proxy wäre möglich, ist aber zusätzliche Infrastruktur und sollte rechtlich geprüft werden |
| http-Streams | Mixed Content wird von Browsern blockiert |
| Tray, Autostart, Media-Tasten | Electron-Features |
| Aufnahmen/Downloads | Urheberrechtlich heikel — bewusst nicht eingebaut |

## 5. Rechtlicher Rahmen

### Kein Impressum — warum das hier vertretbar ist

§ 5 DDG verlangt ein Impressum für **geschäftsmäßige, in der Regel gegen Entgelt angebotene** Telemedien. Funkkunst ist ein privates Hobbyprojekt ohne Werbung, Spenden, Verkauf oder kostenpflichtige Angebote. Deshalb ist kein Impressum eingebaut.

**Kippt das, sobald:**

- Werbung, Affiliate-Links oder Sponsoring dazukommen
- ein Spendenbutton oder Paid-Tier eingebaut wird
- das Angebot „geschäftsmäßig" wird (z. B. regelmäßige Einnahmen, Firmenbezug)
- ein Impressum von Behörden oder Gerichten verlangt wird

Dann: Impressum mit Name, ladungsfähiger Anschrift und E-Mail ergänzen.

### Datenschutz bleibt Pflicht

Auch ein privates Projekt muss nach **Art. 13 DSGVO** informieren, weil beim Seitenaufruf und beim Streamen IP-Adressen an Dritte gehen. Der Dialog unter `#datenschutz` deckt ab:

- localStorage (Favoriten, Verlauf, Einstellungen) — § 25 Abs. 2 TDDDG, kein Banner nötig
- Hosting-/Server-Logs — Anbieter und Speicherdauer **müssen noch eingetragen werden**
- Radio-Browser-API — IP wird an deren Server übertragen
- Streams und Sender-Logos — direkte Verbindung zum Sender
- keine Cookies, kein Tracking, keine Werbung

**Vor dem Launch ergänzen** in `src/renderer/src/components/LegalDialog.tsx`:

1. Name und Anschrift des Hosting-Anbieters + Speicherdauer der Logs
2. Kontaktadresse (`BRAND.contactEmail` in `src/shared/brand.ts`) — aktuell `kontakt@funkkunst.de`; Postfach anlegen oder Adresse anpassen

### Keine GEMA-Lizenz nötig

Funkkunst hostet keine Musik und verbreitet sie nicht selbst. Der Browser verbindet sich direkt mit den öffentlich zugänglichen Streams der Sender; die Sender haben die Rechte. Das ist die gleiche Konstellation wie bei einem Webradio-Verzeichnis.

**Nicht tun:**

- Streams über einen eigenen Server proxyen oder transcodieren
- Streams aufnehmen und zum Download anbieten
- eigene Werbe- oder Jingle-Blöcke in fremde Streams schneiden
- einen eigenen 24/7-Channel mit Werbung betreiben (dann Rundfunk-/Medienrecht)

### Sender-AGB und Takedown

Manche Sender erlauben Dritt-Player ausdrücklich (SomaFM, Radio Paradise, FIP, KEXP), andere nicht. Zwei Regeln:

1. **Notice-and-Takedown:** Eine erreichbare Kontaktadresse im Datenschutz-Dialog ist gesetzt. Auf Anfrage eines Senders wird dieser entfernt.
2. **Keine offensichtlich illegalen Sender** aus der Radio-Browser-Datenbank kuratieren oder bewerben. Als Vermittler greifen die DSA-Haftungsprivilegien, aber nur solange keine Kenntnis von Rechtsverstößen besteht.

### Name und Marke

- „Smooth Radio" ist eine UK-Radiomarke von Global und für ein deutsches Radio-Produkt ein Abmahnrisiko — deshalb der neue Name.
- `funkkunst.de` war bei DENIC frei. Vor dem Launch trotzdem **DPMA- und EUIPO-Register** (TMview) auf „Funkkunst" prüfen.
- „Funkkunst" ist ein beschreibender Begriff; falls eine ältere Marke existiert, lieber einen weiteren Namen wählen.

### Kein Impressum ≠ keine Verantwortung

Die Website ist kein rechtsfreier Raum: Persönlichkeitsrechte, Markenrechte und das Urheberrecht an Logos/Fotos gelten weiterhin. Sender-Logos werden nur verlinkt (vom Sender geladen), nicht gehostet.

## 6. Deployment-Checkliste

- [ ] `npm run typecheck` und `npm run build:web` laufen fehlerfrei
- [ ] `dist-web/` enthält `index.html`, `assets/`, `robots.txt`, `sitemap.xml`
- [ ] HTTPS auf der Domain aktiv
- [ ] Hosting-Anbieter + Log-Speicherdauer im Datenschutz-Dialog eingetragen _(GitHub Pages ist eingetragen)_
- [ ] Kontaktadresse funktioniert
- [ ] Impressum bewusst weggelassen (privat, nicht kommerziell)
- [ ] Keine Werbung, keine Spenden, keine Analytics eingebaut
- [ ] `#datenschutz` ist erreichbar und der Dialog scrollt vollständig
- [ ] Ein Teststream (https) spielt auf Desktop und Handy
- [ ] `sitemap.xml`/`robots.txt` zeigen auf die richtige Domain
- [ ] Markenrecherche „Funkkunst" (DPMA/EUIPO) dokumentiert

## 7. Später: echte Songtitel im Web

Optional, aber nur mit zusätzlicher Infrastruktur: eine kleine Serverless-Function liest die ICY-Header des Streams und liefert **nur den Titeltext** als JSON. Das ist kein Audio-Proxy, sondern eine Metadaten-Abfrage. Trotzdem: Bandbreite, Rate-Limits und die AGB der Sender beachten. Ohne diese Function zeigt die Website bewusst keine Songtitel, statt Demodaten vorzutäuschen.
