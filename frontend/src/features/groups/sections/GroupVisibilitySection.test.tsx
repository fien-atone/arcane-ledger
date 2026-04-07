/**
 * Tests for GroupVisibilitySection — covers the party-gating rule.
 *
 * Should render nothing unless BOTH:
 *   - the current user is the GM, AND
 *   - the party module is enabled for the campaign
 */
import { describe, it, expect } from 'vitest';
import { GroupVisibilitySection } from './GroupVisibilitySection';
import { renderWithProviders } from '@/test/helpers';
import type { Group } from '@/entities/group';

const group: Group = {
  id: 'g-1',
  campaignId: 'camp-1',
  name: 'The Silver Hand',
  type: 'faction',
  aliases: [],
  description: '',
  playerVisible: false,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('GroupVisibilitySection', () => {
  it('renders nothing when party module is disabled', () => {
    const { container } = renderWithProviders(
      <GroupVisibilitySection campaignId="camp-1" group={group} isGm={true} partyEnabled={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when viewer is not GM', () => {
    const { container } = renderWithProviders(
      <GroupVisibilitySection campaignId="camp-1" group={group} isGm={false} partyEnabled={true} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the visibility panel when GM views a party-enabled campaign', () => {
    const { container } = renderWithProviders(
      <GroupVisibilitySection campaignId="camp-1" group={group} isGm={true} partyEnabled={true} />,
    );
    expect(container.querySelector('section')).toBeInTheDocument();
  });
});
