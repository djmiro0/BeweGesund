import ContactPageClient from "./ContactPageClient";

export default function KontaktPage() {
  const configuredBookingUrl = process.env.CONSULTATION_BOOKING_URL;
  let bookingUrl: string | null = null;

  if (configuredBookingUrl) {
    try {
      const url = new URL(configuredBookingUrl);
      bookingUrl = url.protocol === "https:" ? url.toString() : null;
    } catch {
      bookingUrl = null;
    }
  }

  return <ContactPageClient bookingUrl={bookingUrl} />;
}
