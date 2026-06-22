import { defineSecret, defineString } from "firebase-functions/params";

export const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
export const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
export const googleHealthClientSecret = defineSecret("GOOGLE_HEALTH_CLIENT_SECRET");
export const stripeBasicPriceId = defineString("STRIPE_BASIC_PRICE_ID");
export const stripePlusPriceId = defineString("STRIPE_PLUS_PRICE_ID");
export const googleHealthClientId = defineString("GOOGLE_HEALTH_CLIENT_ID");
export const appBaseUrl = defineString("APP_BASE_URL");
export const functionsBaseUrl = defineString("FUNCTIONS_BASE_URL");
