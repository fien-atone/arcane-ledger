/**
 * Smoke tests for LandingFeaturesSection — verifies the section heading and
 * at least one feature card render.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LandingFeaturesSection } from './LandingFeaturesSection';
import { renderWithProviders } from '@/test/helpers';

describe('LandingFeaturesSection', () => {
  it('renders the features heading', () => {
    renderWithProviders(<LandingFeaturesSection />);
    expect(
      screen.getByRole('heading', { name: 'features.title' }),
    ).toBeInTheDocument();
  });

  it('renders a feature card title', () => {
    renderWithProviders(<LandingFeaturesSection />);
    expect(screen.getByText('features.locations_maps')).toBeInTheDocument();
  });
});
