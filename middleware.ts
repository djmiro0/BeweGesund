import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Define all supported locales here
  locales: ['en', 'de'],

  // Default locale when user doesn't specify one
  defaultLocale: 'de',
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
