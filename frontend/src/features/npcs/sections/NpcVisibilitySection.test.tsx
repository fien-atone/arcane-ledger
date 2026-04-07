/**
 * Reference test for a section widget — covers the party-gating rule.
 *
 * The NpcVisibilitySection should render nothing unless BOTH
 *   - the current user is the GM, AND
 *   - the party module is enabled for the campaign
 *
 * This ensures players never see visibility controls, and GMs only see them
 * for campaigns where players actually exist.
 */
import { describe, it, expect } from 'vitest';
import { NpcVisibilitySection } from './NpcVisibilitySection';
import { renderWithProviders } from '@/test/helpers';
import type { NPC } from '@/entities/npc';

const fakeNpc: NPC = {
  id: 'npc-1',
  campaignId: 'camp-1',
  name: 'Test NPC',
  aliases: [],
  status: 'alive',
  description: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  playerVisible: false,
  playerVisibleFields: [],
  locationPresences: [],
  groupMemberships: [],
  relations: [],
};

describe('NpcVisibilitySection', () => {
  it('renders nothing when party module is disabled', () => {
    const { container } = renderWithProviders(
      <NpcVisibilitySection campaignId="camp-1" npc={fakeNpc} isGm={true} partyEnabled={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when viewer is not GM', () => {
    const { container } = renderWithProviders(
      <NpcVisibilitySection campaignId="camp-1" npc={fakeNpc} isGm={false} partyEnabled={true} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the visibility panel when GM views a party-enabled campaign', () => {
    const { container } = renderWithProviders(
      <NpcVisibilitySection campaignId="camp-1" npc={fakeNpc} isGm={true} partyEnabled={true} />,
    );
    // The VisibilityPanel shared component renders a <section>
    expect(container.querySelector('section')).toBeInTheDocument();
  });
});
