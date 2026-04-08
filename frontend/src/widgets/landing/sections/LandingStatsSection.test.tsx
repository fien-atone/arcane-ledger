/**
 * Smoke tests for LandingStatsSection — verifies the four stat labels render.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LandingStatsSection } from './LandingStatsSection';
import { renderWithProviders } from '@/test/helpers';

describe('LandingStatsSection', () => {
  it('renders all four stat labels', () => {
    renderWithProviders(<LandingStatsSection />);
    expect(screen.getByText('stats.entity_types')).toBeInTheDocument();
    expect(screen.getByText('stats.locations_maps')).toBeInTheDocument();
    expect(screen.getByText('stats.dice_roller')).toBeInTheDocument();
    expect(screen.getByText('stats.in_active_dev')).toBeInTheDocument();
  });
});
