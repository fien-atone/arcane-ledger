/**
 * Smoke tests for LandingCtaSection — verifies heading and the CTA button
 * link render.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LandingCtaSection } from './LandingCtaSection';
import { renderWithProviders } from '@/test/helpers';

describe('LandingCtaSection', () => {
  it('renders the CTA heading', () => {
    renderWithProviders(<LandingCtaSection />);
    expect(
      screen.getByRole('heading', { name: 'cta.title' }),
    ).toBeInTheDocument();
  });

  it('renders the CTA button link', () => {
    renderWithProviders(<LandingCtaSection />);
    expect(screen.getByRole('link', { name: /cta\.button/i })).toBeInTheDocument();
  });
});
