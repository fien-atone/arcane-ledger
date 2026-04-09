/**
 * Tests for NpcRelationsSection.
 *
 * - Renders typed relations (sibling, parent, ally, etc.) when NPC has them
 * - Resolves relation targets via the useNpcs query
 * - Renders nothing when NPC has no relations and viewer is not GM
 *
 * Note: We test with isGm=false to avoid pulling in SocialRelationsSection,
 * which has its own nested queries. GM-only SocialRelationsSection is covered
 * elsewhere.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { NpcRelationsSection } from './NpcRelationsSection';
import { renderWithProviders } from '@/test/helpers';
import type { NPC } from '@/entities/npc';

const NPCS_QUERY = gql`
  query Npcs($campaignId: ID!, $search: String, $status: String) {
    npcs(campaignId: $campaignId, search: $search, status: $status) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      playerVisible playerVisibleFields
      createdAt updatedAt
      locationPresences { locationId note playerVisible }
      groupMemberships { groupId relation subfaction playerVisible }
    }
  }
`;

const otherNpc = {
  id: 'npc-2',
  campaignId: 'camp-1',
  name: 'Brother Alvin',
  aliases: [],
  status: 'ALIVE',
  gender: null,
  age: null,
  species: null,
  speciesId: null,
  appearance: null,
  personality: null,
  description: '',
  motivation: null,
  flaws: null,
  gmNotes: null,
  image: null,
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  locationPresences: [],
  groupMemberships: [],
};

const npcsMock = {
  request: { query: NPCS_QUERY, variables: { campaignId: 'camp-1', search: null, status: null } },
  result: { data: { npcs: [otherNpc] } },
};

const baseNpc: NPC = {
  id: 'npc-1',
  campaignId: 'camp-1',
  name: 'Test',
  aliases: [],
  status: 'alive',
  description: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  playerVisible: true,
  playerVisibleFields: [],
  locationPresences: [],
  groupMemberships: [],
  relations: [],
};

const npcWithRelation: NPC = {
  ...baseNpc,
  relations: [{ npcId: 'npc-2', type: 'sibling', note: 'Younger brother' }],
};

describe('NpcRelationsSection', () => {
  it('renders relation to the resolved target NPC', async () => {
    renderWithProviders(
      <NpcRelationsSection campaignId="camp-1" npc={npcWithRelation} isGm={false} />,
      { mocks: [npcsMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('Brother Alvin')).toBeInTheDocument();
    });
    expect(screen.getByText('Younger brother')).toBeInTheDocument();
    // relation_sibling is the i18n key returned as-is
    expect(screen.getByText('relation_sibling')).toBeInTheDocument();
  });

  it('renders nothing when NPC has no relations and viewer is not GM', async () => {
    const { container } = renderWithProviders(
      <NpcRelationsSection campaignId="camp-1" npc={baseNpc} isGm={false} />,
      { mocks: [npcsMock] },
    );
    await waitFor(() => {
      // Query resolves; since there are no relations to show and no GM panel,
      // the component renders an empty fragment
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('filters out relations whose target NPC does not exist in the fetched list', async () => {
    const orphanRelation: NPC = {
      ...baseNpc,
      relations: [{ npcId: 'missing-npc', type: 'ally' }],
    };
    const { container } = renderWithProviders(
      <NpcRelationsSection campaignId="camp-1" npc={orphanRelation} isGm={false} />,
      { mocks: [npcsMock] },
    );
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});
