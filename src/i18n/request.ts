import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  // Fallback to "en" if locale is undefined (type-safe)
  const safeLocale = locale ?? "en";

  return {
    locale: safeLocale,
    messages: (await import(`../../locales/${safeLocale}.json`)).default,
  };
});
