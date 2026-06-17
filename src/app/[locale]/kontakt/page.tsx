import ContactPageClient from "./ContactPageClient";

const defaultBookingUrl = "https://cal.eu/bewegesund";

export function resolveBookingUrl(configuredBookingUrl = process.env.CONSULTATION_BOOKING_URL) {
  const candidate = configuredBookingUrl || defaultBookingUrl;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function KontaktPage() {
  const bookingUrl = resolveBookingUrl();

  return <ContactPageClient bookingUrl={bookingUrl} />;
}
