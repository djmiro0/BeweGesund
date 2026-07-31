import InfoPage from "@/app/components/InfoPage/InfoPage";
import { getLegalProvider } from "@/lib/legal";

export default async function DatenschutzPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
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
          body: "Firebase/Google verarbeitet Authentifizierungs- und Profildaten, Vercel stellt die Webanwendung bereit, Contentful liefert redaktionelle Inhalte, Mux stellt geschützte Videos bereit, Stripe verarbeitet Zahlungsdaten und Vercel Analytics verarbeitet technische Nutzungsdaten. Mit eingesetzten Auftragsverarbeitern sind die erforderlichen Datenschutzvereinbarungen abzuschließen.",
        },
        {
          title: "Google Health und Wearable-Daten",
          body: "Wenn du Google Health freiwillig verbindest, verarbeiten wir über die von dir freigegebenen Google Health APIs zusammengefasste Tageswerte wie Schritte, aktive Minuten, Schlafdauer und Ruhepuls. Wir speichern keine Rohdatenströme, sondern nur Tageszusammenfassungen in deinem Konto. Die Verarbeitung erfolgt nur mit deiner ausdrücklichen Einwilligung zur Personalisierung von Trainings- und Gesundheitsfunktionen. Du kannst die Verbindung jederzeit im Profil trennen.",
        },
        {
          title: "Google API Limited Use",
          body: "Die Nutzung von über Google APIs erhaltenen Informationen erfolgt nach der Google API Services User Data Policy einschließlich der Limited-Use-Anforderungen. Google-Health-Daten werden nicht verkauft, nicht für Werbung verwendet und nicht an Dritte weitergegeben, außer soweit dies zur Bereitstellung der App-Funktionen, zur Sicherheit, zur Einhaltung gesetzlicher Pflichten oder mit deiner ausdrücklichen Zustimmung erforderlich ist.",
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
          body: "Firebase/Google processes authentication and profile data, Vercel hosts the application, Contentful supplies editorial content, Mux provides protected video, Stripe processes payment data, and Vercel Analytics processes technical usage data. Required data-processing agreements must be maintained with service providers.",
        },
        {
          title: "Google Health and wearable data",
          body: "If you voluntarily connect Google Health, we process summarized daily values made available through the Google Health APIs you authorize, such as steps, active minutes, sleep duration, and resting heart rate. We do not store raw data streams; we store only daily summaries in your account. Processing is based on your explicit consent for personalized training and health features. You can disconnect the integration at any time in your profile.",
        },
        {
          title: "Google API Limited Use",
          body: "Use of information received from Google APIs follows the Google API Services User Data Policy, including the Limited Use requirements. Google Health data is not sold, not used for advertising, and not shared with third parties except as necessary to provide app functionality, maintain security, comply with law, or with your explicit consent.",
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
      intro={
        isGerman
          ? "Informationen gemäß Art. 13 DSGVO."
          : "Information provided under GDPR Article 13."
      }
      sections={sections}
      note={isGerman ? "Stand: Juni 2026" : "Last updated: June 2026"}
    />
  );
}
