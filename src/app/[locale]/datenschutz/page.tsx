import InfoPage from "@/app/components/InfoPage/InfoPage";
import { getLegalProvider } from "@/lib/legal";

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const provider = getLegalProvider();
  const isGerman = locale === "de";
  const sections = isGerman
    ? [
        {
          title: "Verantwortlicher",
          body: `${provider.name}, ${provider.address}. Datenschutzkontakt: ${provider.email}.`,
        },
        {
          title: "Verarbeitete Daten und Zwecke",
          body: "Wir verarbeiten Konto- und Kontaktdaten, Paket- und Nutzungsdaten sowie die freiwillig angegebenen Profildaten Alter, Geschlecht, Körpergröße und Gewicht. Diese Daten werden für Anmeldung, Zugriffsschutz, BMI-Berechnung, Trainingspersonalisierung, Fortschrittsanzeige, Sicherheit und Support verwendet.",
        },
        {
          title: "Rechtsgrundlagen und Einwilligung",
          body: "Die Kontoverarbeitung erfolgt zur Vertragserfüllung bzw. Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO). Sicherheits- und Betriebsdaten verarbeiten wir auf Grundlage berechtigter Interessen (Art. 6 Abs. 1 lit. f DSGVO). Gesundheitsbezogene Profildaten werden nur nach ausdrücklicher Einwilligung verarbeitet (Art. 6 Abs. 1 lit. a und Art. 9 Abs. 2 lit. a DSGVO).",
        },
        {
          title: "Dienstleister und Empfänger",
          body: "Firebase/Google verarbeitet Authentifizierungs- und Profildaten, Vercel stellt die Webanwendung bereit, Contentful liefert redaktionelle Inhalte, Mux stellt geschützte Videos bereit und Vercel Analytics verarbeitet technische Nutzungsdaten. Mit eingesetzten Auftragsverarbeitern sind die erforderlichen Datenschutzvereinbarungen abzuschließen.",
        },
        {
          title: "Speicherdauer und Löschung",
          body: "Kontodaten werden bis zur Kontolöschung oder bis zum Ende gesetzlicher Aufbewahrungspflichten gespeichert. Die Funktion „Profil löschen“ entfernt das Firebase-Konto einschließlich zugehöriger Profildokumente und Unterkollektionen. Sicherheitsprotokolle und Backups werden nur für begrenzte betriebliche Fristen aufbewahrt.",
        },
        {
          title: "Deine Rechte",
          body: "Du hast nach Maßgabe der DSGVO Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Eine Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen. Außerdem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.",
        },
        {
          title: "Sicherheit und Drittlandübermittlungen",
          body: "Daten werden durch Zugriffskontrollen, verschlüsselte Übertragung und kurzlebige Videotokens geschützt. Soweit Dienstleister Daten außerhalb des EWR verarbeiten, müssen geeignete Garantien wie Angemessenheitsbeschlüsse oder EU-Standardvertragsklauseln eingesetzt werden.",
        },
      ]
    : [
        {
          title: "Controller",
          body: `${provider.name}, ${provider.address}. Privacy contact: ${provider.email}.`,
        },
        {
          title: "Data and purposes",
          body: "We process account and contact details, membership and usage data, and the voluntarily supplied profile data age, gender, height, and weight. These data support authentication, access control, BMI calculation, training personalization, progress display, security, and support.",
        },
        {
          title: "Legal bases and consent",
          body: "Account processing is necessary for contract performance or pre-contractual steps (GDPR Art. 6(1)(b)). Security and operational data are processed for legitimate interests (Art. 6(1)(f)). Health-related profile data are processed only with explicit consent (Art. 6(1)(a) and Art. 9(2)(a)).",
        },
        {
          title: "Processors and recipients",
          body: "Firebase/Google processes authentication and profile data, Vercel hosts the application, Contentful supplies editorial content, Mux provides protected video, and Vercel Analytics processes technical usage data. Required data-processing agreements must be maintained with service providers.",
        },
        {
          title: "Retention and deletion",
          body: "Account data are retained until account deletion or the end of applicable legal retention periods. The Delete Profile function removes the Firebase account and associated profile documents and subcollections. Security logs and backups are retained only for limited operational periods.",
        },
        {
          title: "Your rights",
          body: "Subject to the GDPR, you may request access, correction, deletion, restriction, portability, or object to processing. Consent can be withdrawn at any time for future processing. You may also complain to a competent data protection authority.",
        },
        {
          title: "Security and international transfers",
          body: "Access controls, encrypted transport, and short-lived video tokens protect data. Where providers process data outside the EEA, appropriate safeguards such as adequacy decisions or EU Standard Contractual Clauses must apply.",
        },
      ];

  return (
    <InfoPage
      title={isGerman ? "Datenschutz" : "Privacy Policy"}
      intro={isGerman ? "Informationen gemäß Art. 13 DSGVO." : "Information provided under GDPR Article 13."}
      sections={sections}
      note={isGerman ? "Stand: Juni 2026" : "Last updated: June 2026"}
    />
  );
}
