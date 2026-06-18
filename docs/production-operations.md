# Production Operations

## Required release checks

- `npm run lint`
- `npm run test:component`
- `npm run build`
- `npm run build` in `functions/`
- Complete a Stripe test subscription and Customer Portal cancellation.
- Verify `/api/health` returns HTTP 200 after deployment.
- Smoke-test registration, email verification, password reset, settings save, video playback, contact delivery, and account deletion.

## Required production configuration

- Contentful delivery configuration
- Firebase project ID and Firebase App Check reCAPTCHA v3 site key
- Mux signing credentials and a mandatory admin upload token
- `NEXT_PUBLIC_SITE_URL`
- Resend API key, verified contact sender, recipient address, and optional HTTPS consultation booking URL
- All `LEGAL_*` provider variables from `.env.example`
- Stripe Basic and Plus Price IDs, secret key, webhook signing secret, and Customer Portal configuration

For contact delivery, configure these variables in the deployment provider:

```env
RESEND_API_KEY=...
CONTACT_EMAIL_FROM=BeweGesund <kontakt@your-verified-domain.example>
CONTACT_EMAIL_TO=info@bewegesund.de
```

`CONTACT_EMAIL_FROM` must use a sender domain verified in Resend. This does not
move the mailbox to Resend; the recipient can still be an IONOS mailbox through
`CONTACT_EMAIL_TO`. `CONTACT_EMAIL_TO` is optional in code and defaults to
`info@bewegesund.de`, but setting it explicitly makes production configuration
easier to audit.

Consultation bookings default to `https://cal.eu/bewegesund`. Set
`CONSULTATION_BOOKING_URL` only when the booking destination should be changed.

Follow `docs/stripe-billing.md` in Stripe test mode before adding any live
Stripe credentials.

Enable Firebase App Check enforcement for Firestore after the web app is registered and verified.

## Backups

Configure scheduled Firestore exports in Google Cloud to a dedicated, access-restricted Cloud Storage bucket. Use a daily schedule, a documented retention period, and lifecycle deletion. Test a restore into a non-production project before launch and at least quarterly.

## Monitoring and alerts

- Monitor `/api/health` from an external uptime service.
- Configure Vercel alerts for elevated 5xx rates and failed deployments.
- Configure Firebase alerts for Functions errors, quota usage, and App Check rejection spikes.
- Configure Stripe webhook failure and failed-payment notifications.
- Never log passwords, Firebase ID tokens, Mux signing keys, or health-profile values.

## Incident response

1. Disable affected endpoints or revoke credentials.
2. Rotate exposed Firebase, Contentful, or Mux credentials.
3. Review Vercel and Firebase logs.
4. Assess notification obligations with the data-protection contact.
5. Document the incident, impact, response, and preventive changes.
