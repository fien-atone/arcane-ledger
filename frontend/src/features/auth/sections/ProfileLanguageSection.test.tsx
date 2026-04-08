/**
 * Tests for ProfileLanguageSection — verifies the language label renders
 * and the Select reflects the current i18n language.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ProfileLanguageSection } from './ProfileLanguageSection';
import { renderWithProviders } from '@/test/helpers';

describe('ProfileLanguageSection', () => {
  it('renders the language section header and label', () => {
    renderWithProviders(<ProfileLanguageSection />);
    expect(screen.getByText('language')).toBeInTheDocument();
    expect(screen.getByText('language_label')).toBeInTheDocument();
  });

  it('shows the English option as the current selection by default', () => {
    renderWithProviders(<ProfileLanguageSection />);
    expect(screen.getByText('English')).toBeInTheDocument();
  });
});
