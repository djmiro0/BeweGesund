# Stripe Billing

The application uses Stripe Checkout for the Basic and Plus subscriptions and Stripe
Customer Portal for payment-method updates and cancellation. Firestore access
is updated only from verified Stripe webhooks. Checkout and Customer Portal
callable functions require a signed-in Firebase user, but they intentionally do
not enforce Firebase App Check so billing does not depend on reCAPTCHA.

## Test-mode setup

1. In Stripe test mode, create two products with recurring monthly Prices:

   - `BeweGesund Basic`: EUR 9.99 per month
   - `BeweGesund Plus`: EUR 12.99 per month

2. Copy `functions/.env.example` to `functions/.env.sandrin-app`.
3. Set `APP_BASE_URL` to the deployed test URL and
   `FUNCTIONS_BASE_URL` to the deployed Cloud Functions base URL for the
   Firebase project, then set both Stripe Price IDs:

   ```env
   STRIPE_BASIC_PRICE_ID=price_...
   STRIPE_PLUS_PRICE_ID=price_...
   FUNCTIONS_BASE_URL=https://europe-west3-project-id.cloudfunctions.net
   ```
4. Store the test secret key:

   ```bash
   firebase functions:secrets:set STRIPE_SECRET_KEY
   ```

5. Deploy the Functions once so the webhook URL exists:

   ```bash
   firebase deploy --only functions
   ```

6. In Stripe Workbench, create a webhook endpoint:

   ```text
   https://europe-west3-sandrin-app.cloudfunctions.net/stripeWebhook
   ```

   Subscribe it to:

   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

7. Copy the endpoint signing secret (`whsec_...`) into Firebase:

   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   firebase deploy --only functions
   ```

8. Enable Stripe Customer Portal in test mode. Allow payment-method updates,
   subscription cancellation, and switching between the Basic and Plus prices.

## Test account

Create a normal Firebase test user through the registration screen using an
email address you control. Verify the email, sign in, open Profile, and choose
choose either the Basic or Plus subscription.

Use Stripe test data only:

- Successful card: `4242 4242 4242 4242`
- Any future expiry date
- Any three-digit CVC
- Any valid postal code
- 3DS test card: `4000 0025 0000 3155`

After successful checkout, verify:

1. Stripe shows an active test subscription.
2. The webhook endpoint returned HTTP 200.
3. `/users/{uid}` contains the purchased `memberPackage` and
   `subscriptionStatus: "active"`.
4. The profile shows Plus and `Manage billing`.
5. Canceling through Customer Portal returns the user to the profile.
6. After the Stripe cancellation event, protected member content is no longer
   accessible.
7. Deleting a paid test account cancels its Stripe subscription before the
   Firebase Authentication user and Firestore profile are removed.

Do not create a hardcoded shared account or store test credentials in Git.

## Live-mode switch

Repeat the setup with live Products/Prices, a live `sk_live_...` key, and a
separate live webhook signing secret. Test and live Stripe objects are
independent; test Price IDs cannot be used with a live secret key.
