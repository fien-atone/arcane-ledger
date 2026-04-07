/**
 * Tests for LocationVisibilitySection — covers party-gating and GM-gating.
 */
import { describe, it, expect } from 'vitest';
import { LocationVisibilitySection } from './LocationVisibilitySection';
import { renderWithProviders } from '@/test/helpers';
import type { Location } from '@/entities/location';

const location: Location = {
  id: 'loc-1',
  campaignId: 'camp-1',
  name: 'Silverhold',
  type: 'settlement',
  description: '',
  createdAt: '2026-01-01',
  playerVisible: false,
  playerVisibleFields: [],
};

describe('LocationVisibilitySection', () => {
  it('renders nothing when the party module is disabled', () => {
    const { container } = renderWithProviders(
      <LocationVisibilitySection
        campaignId="camp-1"
        location={location}
        isGm={true}
        partyEnabled={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the viewer is not the GM', () => {
    const { container } = renderWithProviders(
      <LocationVisibilitySection
        campaignId="camp-1"
        location={location}
        isGm={false}
        partyEnabled={true}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the visibility panel for the GM in a party-enabled campaign', () => {
    const { container } = renderWithProviders(
      <LocationVisibilitySection
        campaignId="camp-1"
        location={location}
        isGm={true}
        partyEnabled={true}
      />,
    );
    expect(container.querySelector('section')).toBeInTheDocument();
  });
});
