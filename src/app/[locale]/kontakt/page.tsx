import ContactPageClient from "./ContactPageClient";
import { resolveBookingUrl } from "./booking";

export default function KontaktPage() {
  const bookingUrl = resolveBookingUrl();

  return <ContactPageClient bookingUrl={bookingUrl} />;
}
