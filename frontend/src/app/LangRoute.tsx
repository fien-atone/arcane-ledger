import { useEffect } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SUPPORTED_LANGS = ['en', 'ru'] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

function isSupportedLang(v: string): v is Lang {
  return SUPPORTED_LANGS.includes(v as Lang);
}

/**
 * Layout route for public pages that reads `:lang` from the URL,
 * syncs it with i18next, and renders child routes via `<Outlet />`.
 *
 * If `:lang` is not a supported language, redirects to `/en`.
 */
export function LangRoute() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  const valid = lang && isSupportedLang(lang);

  useEffect(() => {
    if (valid && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, valid, i18n]);

  if (!valid) {
    return <Navigate to="/en" replace />;
  }

  return <Outlet />;
}
