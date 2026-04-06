import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enLanding from './locales/en/landing.json';
import enAuth from './locales/en/auth.json';
import enCampaigns from './locales/en/campaigns.json';
import enNpcs from './locales/en/npcs.json';
import enLocations from './locales/en/locations.json';
import enSessions from './locales/en/sessions.json';
import enParty from './locales/en/party.json';
import enQuests from './locales/en/quests.json';
import enGroups from './locales/en/groups.json';
import enSpecies from './locales/en/species.json';
import enFactions from './locales/en/factions.json';
import enSocial from './locales/en/social.json';
import enAdmin from './locales/en/admin.json';
import enProfile from './locales/en/profile.json';

import ruCommon from './locales/ru/common.json';
import ruLanding from './locales/ru/landing.json';
import ruAuth from './locales/ru/auth.json';
import ruCampaigns from './locales/ru/campaigns.json';
import ruNpcs from './locales/ru/npcs.json';
import ruLocations from './locales/ru/locations.json';
import ruSessions from './locales/ru/sessions.json';
import ruParty from './locales/ru/party.json';
import ruQuests from './locales/ru/quests.json';
import ruGroups from './locales/ru/groups.json';
import ruSpecies from './locales/ru/species.json';
import ruFactions from './locales/ru/factions.json';
import ruSocial from './locales/ru/social.json';
import ruAdmin from './locales/ru/admin.json';
import ruProfile from './locales/ru/profile.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        landing: enLanding,
        auth: enAuth,
        campaigns: enCampaigns,
        npcs: enNpcs,
        locations: enLocations,
        sessions: enSessions,
        party: enParty,
        quests: enQuests,
        groups: enGroups,
        species: enSpecies,
        factions: enFactions,
        social: enSocial,
        admin: enAdmin,
        profile: enProfile,
      },
      ru: {
        common: ruCommon,
        landing: ruLanding,
        auth: ruAuth,
        campaigns: ruCampaigns,
        npcs: ruNpcs,
        locations: ruLocations,
        sessions: ruSessions,
        party: ruParty,
        quests: ruQuests,
        groups: ruGroups,
        species: ruSpecies,
        factions: ruFactions,
        social: ruSocial,
        admin: ruAdmin,
        profile: ruProfile,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'arcane_ledger_lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
