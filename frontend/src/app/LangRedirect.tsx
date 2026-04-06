import { Navigate, useLocation } from 'react-router-dom';

/**
 * Detects the preferred language from localStorage and redirects
 * the current path under the `/:lang` prefix.
 *
 * - `/` → `/en` (or `/ru` if stored preference)
 * - `/login` → `/en/login`
 * - `/changelog` → `/en/changelog`
 */
export function LangRedirect() {
  const stored = localStorage.getItem('arcane_ledger_lang');
  const lang = stored === 'ru' ? 'ru' : 'en';
  const { pathname } = useLocation();

  // Strip leading slash to get the remaining path segment
  const rest = pathname === '/' ? '' : pathname;
  const target = `/${lang}${rest}`;

  return <Navigate to={target} replace />;
}
