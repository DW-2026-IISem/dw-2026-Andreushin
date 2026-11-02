/**
 * Production environment (`ng build`).
 *
 * `apiUrl` ends in `/api` WITHOUT a trailing slash: with one, calls would go out as
 * `//recyclers` and Express would treat them as another route.
 *
 * `requireAuth`: front half of the phase switch. Nobody reads it until ISS-08
 * (Phase II). The CircularGuajira backend always protects its business routes (it has
 * no `AUTH_ENABLED` switch), so it stays `true`.
 *
 * `primeUiLicense`: PrimeUI **Community** key (PrimeNG 22). Request it at
 * https://primeui.dev · requirements at https://primeui.dev/licenses. Leave it `''`
 * until you have it (console notice; the app works). Never commit a commercial key.
 */
export const environment = {
  production: true,
  appName: 'CircularGuajira Express II',
  apiUrl: 'http://localhost:4000/api',
  requireAuth: true,
  primeUiLicense: '',
};
