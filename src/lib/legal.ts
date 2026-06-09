export interface LegalProvider {
  name: string;
  address: string;
  email: string;
  phone: string;
  responsiblePerson: string;
  vatId: string;
}

const requiredVariables = [
  "LEGAL_PROVIDER_NAME",
  "LEGAL_PROVIDER_ADDRESS",
  "LEGAL_PROVIDER_EMAIL",
  "LEGAL_RESPONSIBLE_PERSON",
] as const;

export function getLegalProvider(): LegalProvider {
  const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());

  if (process.env.VERCEL_ENV === "production" && missingVariables.length) {
    throw new Error(`Missing required production legal configuration: ${missingVariables.join(", ")}`);
  }

  return {
    name: process.env.LEGAL_PROVIDER_NAME?.trim() || "[LEGAL_PROVIDER_NAME]",
    address: process.env.LEGAL_PROVIDER_ADDRESS?.trim() || "[LEGAL_PROVIDER_ADDRESS]",
    email: process.env.LEGAL_PROVIDER_EMAIL?.trim() || "info@bewegesund.de",
    phone: process.env.LEGAL_PROVIDER_PHONE?.trim() || "",
    responsiblePerson: process.env.LEGAL_RESPONSIBLE_PERSON?.trim() || "[LEGAL_RESPONSIBLE_PERSON]",
    vatId: process.env.LEGAL_VAT_ID?.trim() || "",
  };
}
