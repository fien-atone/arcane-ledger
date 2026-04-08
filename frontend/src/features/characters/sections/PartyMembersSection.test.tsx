/**
 * Tests for PartyMembersSection.
 *
 * Verifies:
 * - Renders nothing when the slots list is empty
 * - Shows each member row with name and email
 * - The kick button only renders for GMs
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { PartyMembersSection } from './PartyMembersSection';
import { renderWithProviders } from '@/test/helpers';
import type { PartySlot } from '@/entities/partySlot';

const slots: PartySlot[] = [
  {
    member: {
      id: 'm-1',
      user: { id: 'u-1', name: 'Alice', email: 'alice@example.com' },
      role: 'PLAYER',
      joinedAt: '2026-01-01',
    },
  },
  {
    member: {
      id: 'm-2',
      user: { id: 'u-2', name: 'Bob', email: 'bob@example.com' },
      role: 'PLAYER',
      joinedAt: '2026-01-01',
    },
    character: {
      id: 'char-1',
      campaignId: 'camp-1',
      name: 'Thorin',
      species: 'Dwarf',
      class: 'Fighter',
      gmNotes: '',
      groupMemberships: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  },
];

describe('PartyMembersSection', () => {
  it('renders nothing when there are no member slots', () => {
    const { container } = renderWithProviders(
      <PartyMembersSection
        slots={[]}
        campaignId="camp-1"
        unassignedCharacters={[]}
        isGm
        onCreateCharacter={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders member rows with name, email, and linked character', () => {
    renderWithProviders(
      <PartyMembersSection
        slots={slots}
        campaignId="camp-1"
        unassignedCharacters={[]}
        isGm={false}
        onCreateCharacter={() => {}}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Thorin')).toBeInTheDocument();
    expect(screen.getByText('section_party_members')).toBeInTheDocument();
  });

  it('shows kick buttons only for GMs', () => {
    const { rerender } = renderWithProviders(
      <PartyMembersSection
        slots={slots}
        campaignId="camp-1"
        unassignedCharacters={[]}
        isGm={false}
        onCreateCharacter={() => {}}
      />,
    );
    expect(screen.queryByText('kick')).not.toBeInTheDocument();

    rerender(
      <PartyMembersSection
        slots={slots}
        campaignId="camp-1"
        unassignedCharacters={[]}
        isGm
        onCreateCharacter={() => {}}
      />,
    );
    expect(screen.getAllByText('kick').length).toBeGreaterThan(0);
  });
});
