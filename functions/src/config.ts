import { defineSecret, defineString } from "firebase-functions/params";

export const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
export const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
export const stripeBasicPriceId = defineString("STRIPE_BASIC_PRICE_ID");
export const stripePlusPriceId = defineString("STRIPE_PLUS_PRICE_ID");
export const appBaseUrl = defineString("APP_BASE_URL");
