import InfoPage from "@/app/components/InfoPage/InfoPage";
import { getLegalProvider } from "@/lib/legal";

export default async function TermsPage({
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
          title: "Anbieter und Geltungsbereich",
          body: `Diese Nutzungsbedingungen gelten für die Nutzung der Bewegesund Plattform von ${provider.name}. Sie regeln den Zugriff auf Trainings-, Gesundheitsbildungs- und Mitgliedschaftsfunktionen.`,
        },
        {
          title: "Kein Ersatz für medizinische Behandlung",
          body: "Die Inhalte dienen der allgemeinen Gesundheitsbildung, Bewegung und Trainingsbegleitung. Sie ersetzen keine ärztliche Diagnose, Therapie, Notfallversorgung oder individuelle medizinische Beratung. Bei Beschwerden, Erkrankungen, Schwangerschaft oder Unsicherheit solltest du vor der Nutzung fachlichen Rat einholen.",
        },
        {
          title: "Konto, Mitgliedschaft und Zahlung",
          body: "Bestimmte Inhalte sind nur mit registriertem Konto und aktiver Mitgliedschaft verfügbar. Zahlungen und Abonnements werden über Stripe verarbeitet. Der Zugriff beginnt erst, wenn die Zahlung bzw. das Abo bestätigt wurde. Preis-, Paket- und Kündigungsinformationen werden im jeweiligen Checkout oder Kundenportal angezeigt.",
        },
        {
          title: "Eigenverantwortliche Nutzung",
          body: "Du bist dafür verantwortlich, Übungen nur im Rahmen deiner persönlichen Möglichkeiten auszuführen, auf Warnsignale deines Körpers zu achten und die Nutzung bei Schmerzen, Schwindel oder anderen Beschwerden zu unterbrechen.",
        },
        {
          title: "Wearables und Google Health",
          body: "Die Verbindung von Google Health ist freiwillig. Wenn du sie nutzt, erlaubst du Bewegesund, zusammengefasste Tageswerte wie Schritte, Aktivzeit, Schlafdauer und Ruhepuls zur Personalisierung deiner App-Erfahrung zu verarbeiten. Du kannst die Verbindung jederzeit im Profil trennen.",
        },
        {
          title: "Urheberrechte und zulässige Nutzung",
          body: "Texte, Videos, Programme, Designs und sonstige Inhalte dürfen nur für persönliche, nicht kommerzielle Zwecke genutzt werden. Weitergabe, Veröffentlichung, Scraping, Download oder Weiterverkauf ohne Erlaubnis ist nicht gestattet.",
        },
        {
          title: "Verfügbarkeit und Änderungen",
          body: "Wir bemühen uns um eine stabile Verfügbarkeit, können aber Wartung, technische Störungen oder Änderungen an Inhalten, Funktionen und Paketen nicht ausschließen. Wesentliche Änderungen dieser Bedingungen werden angemessen mitgeteilt.",
        },
        {
          title: "Haftung",
          body: "Eine Haftung besteht nur nach den gesetzlichen Vorschriften, insbesondere bei Vorsatz, grober Fahrlässigkeit, Verletzung von Leben, Körper oder Gesundheit sowie zwingender gesetzlicher Haftung. Im Übrigen ist die Haftung, soweit gesetzlich zulässig, beschränkt.",
        },
        {
          title: "Kontakt",
          body: `Bei Fragen zu diesen Bedingungen erreichst du uns unter ${provider.email}.`,
        },
      ]
    : [
        {
          title: "Provider and scope",
          body: `These Terms of Service apply to use of the Bewegesund platform provided by ${provider.name}. They govern access to training, health education, and membership features.`,
        },
        {
          title: "Not medical care",
          body: "The content is for general health education, movement, and training support. It does not replace medical diagnosis, treatment, emergency care, or individual medical advice. If you have symptoms, medical conditions, are pregnant, or are unsure, seek professional advice before use.",
        },
        {
          title: "Account, membership, and payment",
          body: "Certain content requires a registered account and active membership. Payments and subscriptions are processed through Stripe. Access starts only after the payment or subscription has been confirmed. Pricing, package, and cancellation information is shown in the relevant checkout or customer portal.",
        },
        {
          title: "Responsible use",
          body: "You are responsible for performing exercises only within your personal capabilities, paying attention to warning signs from your body, and stopping use if pain, dizziness, or other symptoms occur.",
        },
        {
          title: "Wearables and Google Health",
          body: "Connecting Google Health is voluntary. If you use it, you allow Bewegesund to process summarized daily values such as steps, active time, sleep duration, and resting heart rate to personalize your app experience. You can disconnect the integration at any time in your profile.",
        },
        {
          title: "Intellectual property and permitted use",
          body: "Texts, videos, programs, designs, and other content may be used only for personal, non-commercial purposes. Sharing, publishing, scraping, downloading, or reselling content without permission is not allowed.",
        },
        {
          title: "Availability and changes",
          body: "We aim to provide stable availability, but maintenance, technical interruptions, or changes to content, features, and packages may occur. Material changes to these terms will be communicated appropriately.",
        },
        {
          title: "Liability",
          body: "Liability applies according to statutory law, especially in cases of intent, gross negligence, injury to life, body, or health, and mandatory statutory liability. Otherwise, liability is limited to the extent permitted by law.",
        },
        {
          title: "Contact",
          body: `For questions about these terms, contact us at ${provider.email}.`,
        },
      ];

  return (
    <InfoPage
      title={isGerman ? "Nutzungsbedingungen" : "Terms of Service"}
      intro={
        isGerman
          ? "Bedingungen für die Nutzung der Bewegesund Plattform."
          : "Terms for using the Bewegesund platform."
      }
      sections={sections}
      note={isGerman ? "Stand: Juni 2026" : "Last updated: June 2026"}
    />
  );
}
