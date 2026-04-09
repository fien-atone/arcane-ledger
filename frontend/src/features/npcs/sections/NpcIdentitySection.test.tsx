/**
 * Tests for NpcIdentityPills + NpcAliasList.
 *
 * NpcIdentityPills queries useSpecies to resolve species links, so we mock
 * the SPECIES_QUERY. NpcAliasList is pure presentation — no mocks needed.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { gql } from '@apollo/client';
import { NpcIdentityPills, NpcAliasList } from './NpcIdentitySection';
import { renderWithProviders } from '@/test/helpers';
import type { NPC } from '@/entities/npc';

const SPECIES_QUERY = gql`
  query Species($campaignId: ID!, $search: String, $type: String) {
    species(campaignId: $campaignId, search: $search, type: $type) {
      id campaignId name pluralName type size description traits
    }
  }
`;

const emptySpeciesMock = {
  request: { query: SPECIES_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: { data: { species: [] } },
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

describe('NpcIdentityPills', () => {
  it('renders the status pill always', () => {
    renderWithProviders(
      <NpcIdentityPills campaignId="camp-1" npc={baseNpc} speciesEnabled={false} />,
      { mocks: [emptySpeciesMock] },
    );
    // status_alive is the i18n key returned as-is
    expect(screen.getByText('status_alive')).toBeInTheDocument();
  });

  it('renders gender and age pills when present', () => {
    const npc = { ...baseNpc, gender: 'male' as const, age: 42 };
    renderWithProviders(
      <NpcIdentityPills campaignId="camp-1" npc={npc} speciesEnabled={false} />,
      { mocks: [emptySpeciesMock] },
    );
    expect(screen.getByText('gender_male')).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('hides gender and age pills when absent', () => {
    renderWithProviders(
      <NpcIdentityPills campaignId="camp-1" npc={baseNpc} speciesEnabled={false} />,
      { mocks: [emptySpeciesMock] },
    );
    expect(screen.queryByText('gender_male')).not.toBeInTheDocument();
    expect(screen.queryByText('gender_female')).not.toBeInTheDocument();
    expect(screen.queryByText('age_prefix')).not.toBeInTheDocument();
  });

  it('hides species pill when species module is disabled', () => {
    const npc = { ...baseNpc, species: 'Elf' };
    renderWithProviders(
      <NpcIdentityPills campaignId="camp-1" npc={npc} speciesEnabled={false} />,
      { mocks: [emptySpeciesMock] },
    );
    expect(screen.queryByText('Elf')).not.toBeInTheDocument();
  });
});

describe('NpcAliasList', () => {
  it('renders nothing when aliases is empty', () => {
    const { container } = renderWithProviders(<NpcAliasList npc={baseNpc} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each alias in quotes', () => {
    const npc = { ...baseNpc, aliases: ['The Brave', 'Dragonbane'] };
    renderWithProviders(<NpcAliasList npc={npc} />);
    expect(screen.getByText('"The Brave"')).toBeInTheDocument();
    expect(screen.getByText('"Dragonbane"')).toBeInTheDocument();
  });
});
