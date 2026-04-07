/**
 * Test helpers for component and hook tests.
 *
 * Provides:
 * - `renderWithProviders`: wraps a component in MockedProvider, MemoryRouter,
 *   and i18next so it can be tested in isolation
 * - `renderHookWithProviders`: same but for hooks
 * - `i18nForTests`: a minimal i18next instance that returns the key as-is
 *   (so tests can assert against the key, not the translated string)
 */
import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';

type MockedResponse = MockLink.MockedResponse<any, any>;
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Minimal i18n instance for tests — returns the key itself instead of translating.
// This means tests assert on `t('field_name')` returning 'field_name', which is
// stable and doesn't depend on translation files.
const i18nForTests = i18n.createInstance();
i18nForTests.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'npcs', 'locations', 'sessions', 'quests', 'groups', 'party', 'species', 'social', 'campaigns', 'auth', 'profile', 'admin', 'landing'],
  defaultNS: 'common',
  resources: {},
  interpolation: { escapeValue: false },
  // The magic: return the key when no translation found
  saveMissing: false,
  parseMissingKeyHandler: (key: string) => key,
});

interface ProviderProps {
  children: ReactNode;
  mocks?: MockedResponse[];
  initialRoute?: string;
}

function AllProviders({ children, mocks = [], initialRoute = '/' }: ProviderProps) {
  return (
    <MockedProvider mocks={mocks}>
      <I18nextProvider i18n={i18nForTests}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {children}
        </MemoryRouter>
      </I18nextProvider>
    </MockedProvider>
  );
}

interface RenderOpts extends Omit<RenderOptions, 'wrapper'> {
  mocks?: MockedResponse[];
  initialRoute?: string;
}

/**
 * Render a component wrapped in MockedProvider, MemoryRouter, and i18next.
 * Pass GraphQL mocks via options.mocks for queries/mutations the component needs.
 */
export function renderWithProviders(
  ui: ReactElement,
  { mocks, initialRoute, ...renderOptions }: RenderOpts = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders mocks={mocks} initialRoute={initialRoute}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Render a hook wrapped in MockedProvider, MemoryRouter, and i18next.
 */
export function renderHookWithProviders<TProps, TResult>(
  hook: (props: TProps) => TResult,
  { mocks, initialRoute, initialProps }: { mocks?: MockedResponse[]; initialRoute?: string; initialProps?: TProps } = {},
) {
  return renderHook(hook, {
    wrapper: ({ children }) => (
      <AllProviders mocks={mocks} initialRoute={initialRoute}>
        {children}
      </AllProviders>
    ),
    initialProps,
  });
}

export { i18nForTests };
