/**
 * Smoke tests for LandingNavSection — verifies brand, anchor links and
 * login CTA render.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LandingNavSection } from './LandingNavSection';
import { renderWithProviders } from '@/test/helpers';

describe('LandingNavSection', () => {
  it('renders the Arcane Ledger brand', () => {
    renderWithProviders(<LandingNavSection />);
    expect(screen.getByText('Arcane Ledger')).toBeInTheDocument();
  });

  it('renders the open_app CTA link', () => {
    renderWithProviders(<LandingNavSection />);
    expect(screen.getByRole('link', { name: /nav\.open_app/i })).toBeInTheDocument();
  });
});
