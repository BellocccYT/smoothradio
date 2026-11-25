import { Modal } from './Modal'
import { BRAND } from '@shared/brand'

/**
 * Datenschutzhinweis für die Website. Bewusst kein Impressum: Funkkunst ist
 * ein privates, nicht-kommerzielles Projekt ohne Werbung, Spenden oder Verkauf.
 * Die Datenschutzinformation nach Art. 13 DSGVO bleibt trotzdem erforderlich,
 * weil beim Abruf der Seite und beim Laden der Streams personenbezogene Daten
 * (IP-Adressen) an Dritte übertragen werden.
 */
export function LegalDialog({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element {
  return (
    <Modal open={open} onClose={onClose} className="flex max-h-[86vh] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-5">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-white/25">{BRAND.name}</p>
          <h2 className="font-display mt-1 text-[21px] font-semibold tracking-[-0.025em] text-white">Datenschutz</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="grid size-9 place-items-center rounded-full text-white/35 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="scroll-area min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-7 pt-5 text-[11.5px] leading-relaxed text-white/45">
        <section>
          <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Über dieses Angebot</h3>
          <p>
            {BRAND.name} ist ein privates, nicht-kommerzielles Hobbyprojekt. Es gibt keine Werbung, keine Spendenaufrufe,
            keinen Verkauf und keine Benutzerkonten. Es werden keine Analyse- oder Tracking-Tools eingesetzt.
          </p>
        </section>

        <section>
          <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Was lokal auf deinem Gerät gespeichert wird
          </h3>
          <p>
            Favoriten, Verlauf, eigene Sender, Lautstärke und Design-Einstellungen liegen im <code>localStorage</code>{' '}
            deines Browsers. Diese Daten verlassen dein Gerät nicht und werden nicht an uns übertragen. Die Speicherung
            ist technisch notwendig und deshalb nach § 25 Abs. 2 TDDDG ohne Einwilligung zulässig.
          </p>
        </section>

        <section>
          <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Hosting</h3>
          <p>
            Die Seite wird über <span className="text-white/60">GitHub Pages</span> bereitgestellt (GitHub Inc., 88 Colin
            P. Kelly Jr. Street, San Francisco, CA 94107, USA). Beim Aufruf verarbeitet GitHub technisch notwendige
            Verbindungsdaten (IP-Adresse, Zeitpunkt, angeforderte Datei, Browser-Kennung). Das ist für die Auslieferung
            der Seite erforderlich (Art. 6 Abs. 1 lit. f DSGVO). Die Logs dienen ausschließlich dem sicheren Betrieb;
            Details und Speicherdauer stehen in der Datenschutzerklärung von GitHub.
          </p>
          <p className="mt-2">
            Die Übermittlung in die USA stützt sich auf die Standardvertragsklauseln und die Zertifizierung von
            Microsoft/GitHub nach dem EU-U.S. Data Privacy Framework.
          </p>
        </section>

        <section>
          <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Senderdaten und Streams</h3>
          <p>
            Die Sendersuche nutzt die offene <span className="text-white/60">Radio-Browser-API</span>. Dabei wird deine
            IP-Adresse an die Radio-Browser-Server übertragen. Beim Abspielen verbindet sich dein Browser{' '}
            <span className="text-white/60">direkt</span> mit dem Stream-Server des jeweiligen Senders; auch dieser
            erhält deine IP-Adresse. Es findet keine Weiterleitung oder Aufzeichnung über unseren Server statt.
            Sender-Logos werden, sofern vorhanden, direkt vom jeweiligen Sender geladen. Für die Sender auf der
            Startseite (Harmony FM, DASDING, WDR 2 und 1LIVE) wird der aktuelle Titel über eine öffentliche
            JSON- bzw. Text-Schnittstelle des Senders abgerufen; auch dabei wird deine IP-Adresse an den Sender
            übertragen.
          </p>
        </section>

        <section>
          <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Wetter, Suche und externe Links
          </h3>
          <p>
            Wenn du bei <span className="text-white/60">„Wetter"</span> auf „Standort freigeben" tippst, fragt der
            Browser nach deiner Erlaubnis. Erst nach deiner Zustimmung werden die Koordinaten einmalig an{' '}
            <span className="text-white/60">Open-Meteo</span> (open-meteo.com) übertragen, um die Wetterdaten zu laden.
            Wir speichern deinen Standort nicht. Open-Meteo erhält dabei deine IP-Adresse; die Wetterdaten stehen unter
            CC BY 4.0.
          </p>
          <p className="mt-2">
            Die <span className="text-white/60">private Suche</span> öffnet DuckDuckGo, die Links zu{' '}
            <span className="text-white/60">Focus</span> und <span className="text-white/60">duck.ai</span> öffnen die
            jeweilige Seite – jeweils erst beim Klick und in einem neuen Tab. Ab diesem Moment gelten die
            Datenschutzbestimmungen des jeweiligen Anbieters. Es werden keine Inhalte Dritter eingebettet und keine
            Logos nachgeladen.
          </p>
        </section>

        <section>
          <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Cookies</h3>
          <p>
            Diese Seite setzt keine Cookies. Es gibt kein Einwilligungsbanner, weil keine nicht notwendigen Speicher-
            oder Analyse-Technologien verwendet werden.
          </p>
        </section>

        <section>
          <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Deine Rechte</h3>
          <p>
            Du hast nach der DSGVO das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
            Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21).
            Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren. Für Anfragen genügt eine
            E-Mail an <span className="text-white/60">{BRAND.contactEmail}</span>.
          </p>
        </section>

        <section>
          <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Inhalte Dritter</h3>
          <p>
            Alle Streams, Senderlogos und Metadaten gehören den jeweiligen Sendern. {BRAND.name} hostet keine Musik.
            Wenn ein Sender die Einbettung nicht wünscht, wird er auf Anfrage entfernt.
          </p>
        </section>

        <p className="border-t border-white/[0.06] pt-4 text-[10px] text-white/25">Stand: November 2026</p>
      </div>
    </Modal>
  )
}
