/**
 * Reference test for a section widget with presentational output.
 *
 * NpcHeroSection renders the name, portrait, and (for GMs) edit/delete actions.
 * These tests verify:
 *   - The NPC name is rendered as the heading
 *   - Non-GM viewers don't see edit/delete controls
 *
 * We use the player (isGm=false) case to avoid pulling in ImageUpload +
 * NpcEditDrawer dependencies which require additional GraphQL mocks.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { NpcHeroSection } from './NpcHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { NPC } from '@/entities/npc';

const fakeNpc: NPC = {
  id: 'npc-1',
  campaignId: 'camp-1',
  name: 'Alvin the Brave',
  aliases: [],
  status: 'alive',
  description: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  playerVisible: true,
  playerVisibleFields: ['name'],
  locationPresences: [],
  groupMemberships: [],
  relations: [],
};

describe('NpcHeroSection', () => {
  it('renders the NPC name as a heading', () => {
    renderWithProviders(
      <NpcHeroSection
        campaignId="camp-1"
        npc={fakeNpc}
        isGm={false}
        speciesEnabled={false}
        imgVersion={0}
        onUploadImage={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Alvin the Brave' })).toBeInTheDocument();
  });

  it('does not show edit/delete actions for non-GM viewers', () => {
    renderWithProviders(
      <NpcHeroSection
        campaignId="camp-1"
        npc={fakeNpc}
        isGm={false}
        speciesEnabled={false}
        imgVersion={0}
        onUploadImage={() => {}}
        onDelete={() => {}}
      />,
    );
    // Edit button text is translated — with our i18n-keys-as-values setup
    // the button content would be 'edit'. Regardless, assert no buttons
    // labelled edit or delete exist for players.
    expect(screen.queryByText('edit')).not.toBeInTheDocument();
    expect(screen.queryByText('confirm_delete')).not.toBeInTheDocument();
  });
});
