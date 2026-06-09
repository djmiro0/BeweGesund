import InfoPage from "@/app/components/InfoPage/InfoPage";
import { getLegalProvider } from "@/lib/legal";

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const provider = getLegalProvider();
  const isGerman = locale === "de";
  const contact = [provider.email, provider.phone].filter(Boolean).join(" · ");
  const sections = isGerman
    ? [
        { title: "Angaben gemäß § 5 DDG", body: `${provider.name}\n${provider.address}` },
        { title: "Vertretung und inhaltliche Verantwortung", body: provider.responsiblePerson },
        { title: "Kontakt", body: contact },
        ...(provider.vatId ? [{ title: "Umsatzsteuer-ID", body: provider.vatId }] : []),
        {
          title: "Haftungshinweis",
          body: "Die Inhalte dienen der allgemeinen Information zu Bewegung, Training und Gesundheit. Sie ersetzen keine individuelle medizinische Diagnose oder Behandlung.",
        },
      ]
    : [
        { title: "Provider information under § 5 DDG", body: `${provider.name}\n${provider.address}` },
        { title: "Representation and content responsibility", body: provider.responsiblePerson },
        { title: "Contact", body: contact },
        ...(provider.vatId ? [{ title: "VAT identification number", body: provider.vatId }] : []),
        {
          title: "Liability notice",
          body: "The content provides general information about movement, training, and health. It does not replace individual medical diagnosis or treatment.",
        },
      ];

  return (
    <InfoPage
      title={isGerman ? "Impressum" : "Imprint"}
      intro={isGerman ? "Anbieterkennzeichnung für Bewegesund." : "Legal provider information for Bewegesund."}
      sections={sections}
      note={isGerman ? "Stand: Juni 2026" : "Last updated: June 2026"}
    />
  );
}
