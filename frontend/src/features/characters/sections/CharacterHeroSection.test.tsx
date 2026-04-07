/**
 * Tests for CharacterHeroSection.
 *
 * Verifies the name is rendered and that non-GM viewers don't see
 * edit/delete controls.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CharacterHeroSection } from './CharacterHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { PlayerCharacter } from '@/entities/character';

const fakeCharacter: PlayerCharacter = {
  id: 'char-1',
  campaignId: 'camp-1',
  name: 'Lyra Starweaver',
  gmNotes: '',
  groupMemberships: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('CharacterHeroSection', () => {
  it('renders the character name as a heading', () => {
    renderWithProviders(
      <CharacterHeroSection
        campaignId="camp-1"
        character={fakeCharacter}
        isGm={false}
        speciesEnabled={false}
        imgVersion={0}
        onUploadImage={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Lyra Starweaver' })).toBeInTheDocument();
  });

  it('does not show edit/delete actions for non-GM viewers', () => {
    renderWithProviders(
      <CharacterHeroSection
        campaignId="camp-1"
        character={fakeCharacter}
        isGm={false}
        speciesEnabled={false}
        imgVersion={0}
        onUploadImage={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.queryByText('detail.edit')).not.toBeInTheDocument();
    expect(screen.queryByText('detail.confirm_delete')).not.toBeInTheDocument();
  });

  it('renders the demo badge when identity fields are present', () => {
    renderWithProviders(
      <CharacterHeroSection
        campaignId="camp-1"
        character={{ ...fakeCharacter, gender: 'female', class: 'Wizard', age: 27 }}
        isGm={false}
        speciesEnabled={false}
        imgVersion={0}
        onUploadImage={() => {}}
        onDelete={() => {}}
      />,
    );
    // Badge text is joined with ' · ', and since we use keys-as-values,
    // female shows as `gender_female` and age prefix is `field_age`.
    expect(screen.getByText(/Wizard/)).toBeInTheDocument();
    expect(screen.getByText(/gender_female/)).toBeInTheDocument();
    expect(screen.getByText(/field_age 27/)).toBeInTheDocument();
  });
});
