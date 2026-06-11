# Firebase authentication email templates

## Project ID and public sender

Keep the existing Firebase project ID:

```text
sandrin-app
```

The project ID is a permanent technical identifier used by Firebase APIs,
Authentication, Firestore, Cloud Functions, and deployed resources. It does
not need to match the public Bewegesund brand.

Do not use the default public sender:

```text
noreply@sandrin-app.firebaseapp.com
```

Configure the Authentication templates to use the verified custom domain so
the public sender becomes:

```text
Bewegesund <noreply@bewegesund.de>
```

In Firebase Console:

1. Open **Authentication > Templates**.
2. Edit each template.
3. Set the sender name to **Bewegesund**.
4. Select **Customize domain** and enter `bewegesund.de`.
5. Add the TXT and CNAME records shown by Firebase to the DNS configuration
   for `bewegesund.de`.
6. Wait for Firebase to show **Verification complete**. DNS verification can
   take up to 24 hours.
7. Select **Apply Custom Domain**.

The DNS records must be copied from the Firebase Console because Firebase
generates project-specific values. If an SPF TXT record already exists for the
domain, merge the Firebase value into that record instead of creating a second
`v=spf1` record.

The application handles Firebase action links at:

```text
https://bewegesund.de/auth/action
```

In Firebase Console, open **Authentication > Templates** and set the custom
action URL to that production URL. The application then forwards the request
to the German or English action screen based on the Firebase `continueUrl`.
Keep `%LINK%` unchanged: Firebase replaces it with the signed, one-time action
URL.

## Important template limitation

The built-in Firebase Authentication template editor is not a general-purpose
HTML email editor. Do not paste the branded HTML examples into that editor.
Firebase controls the final email markup and turns `%LINK%` into the action
link.

Use the plain-text templates below with Firebase's built-in email delivery.
Full logo, colors, layout, and button styling require generating the action
link with the Firebase Admin SDK and sending the email through a transactional
email provider.

## Firebase verification template

Subject:

```text
Bestätige deine E-Mail-Adresse | Bewegesund
```

Message:

```text
Hallo,

willkommen bei Bewegesund. Bitte bestätige deine E-Mail-Adresse über den folgenden sicheren Link:

%LINK%

Falls du dieses Konto nicht erstellt hast, kannst du diese Nachricht ignorieren.

Viele Grüße
Dein Bewegesund-Team
```

## Firebase password-reset template

Subject:

```text
Setze dein Passwort zurück | Bewegesund
```

Message:

```text
Hallo,

über den folgenden sicheren Link kannst du ein neues Passwort für dein Bewegesund-Konto festlegen:

%LINK%

Falls du kein neues Passwort angefordert hast, kannst du diese Nachricht ignorieren.

Viele Grüße
Dein Bewegesund-Team
```

Firebase replaces `%LINK%` with the signed action URL. Email clients normally
render that generated URL as a clickable link, but Firebase controls its visual
appearance.

## Full branded HTML

To use the logo, navy background, red button, yellow accent, and custom HTML:

1. Generate verification and reset links on the server with the Firebase Admin
   SDK.
2. Render the links inside the application's HTML templates.
3. Send the messages with a provider such as Postmark, Resend, SendGrid, or
   Amazon SES.
4. Authenticate `bewegesund.de` with SPF, DKIM, and DMARC.

In that setup, the HTML button uses the generated URL as its `href`; `%LINK%`
is only a Firebase Console placeholder and is not sent directly to the email
provider.
