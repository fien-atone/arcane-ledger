/**
 * Smoke tests for LandingHeroSection — verifies the headline and primary
 * CTA render.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LandingHeroSection } from './LandingHeroSection';
import { renderWithProviders } from '@/test/helpers';

describe('LandingHeroSection', () => {
  it('renders the headline copy', () => {
    renderWithProviders(<LandingHeroSection />);
    expect(screen.getByText('hero.headline_1')).toBeInTheDocument();
    expect(screen.getByText('hero.headline_2')).toBeInTheDocument();
  });

  it('renders the primary CTA link', () => {
    renderWithProviders(<LandingHeroSection />);
    expect(screen.getByRole('link', { name: /hero\.cta_primary/i })).toBeInTheDocument();
  });
});
