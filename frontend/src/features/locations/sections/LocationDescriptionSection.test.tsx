/**
 * Tests for LocationDescriptionSection — public-facing description.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LocationDescriptionSection } from './LocationDescriptionSection';
import { renderWithProviders } from '@/test/helpers';
import type { Location } from '@/entities/location';

const baseLocation: Location = {
  id: 'loc-1',
  campaignId: 'camp-1',
  name: 'Silverhold',
  type: 'settlement',
  description: '',
  createdAt: '2026-01-01',
};

describe('LocationDescriptionSection', () => {
  it('renders the description content for a player', () => {
    renderWithProviders(
      <LocationDescriptionSection
        location={{ ...baseLocation, description: '<p>A walled city.</p>' }}
        isGm={false}
        onSaveField={() => {}}
      />,
    );
    expect(screen.getByText(/walled city/)).toBeInTheDocument();
  });

  it('renders the rich-text editor label for the GM', () => {
    renderWithProviders(
      <LocationDescriptionSection location={baseLocation} isGm={true} onSaveField={() => {}} />,
    );
    expect(screen.getByText('section_description')).toBeInTheDocument();
  });
});
