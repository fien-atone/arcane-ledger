/**
 * Tests for PartyEmptyStateSection — shown when the party has no members,
 * no pending invitations, and no unassigned characters.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartyEmptyStateSection } from './PartyEmptyStateSection';
import { renderWithProviders } from '@/test/helpers';

describe('PartyEmptyStateSection', () => {
  it('renders empty title and subtitle keys', () => {
    renderWithProviders(
      <PartyEmptyStateSection
        isGm={false}
        onInvitePlayer={() => {}}
        onCreateCharacter={() => {}}
      />,
    );
    expect(screen.getByText('empty_title')).toBeInTheDocument();
    expect(screen.getByText('empty_subtitle')).toBeInTheDocument();
  });

  it('hides GM shortcut buttons for non-GM viewers', () => {
    renderWithProviders(
      <PartyEmptyStateSection
        isGm={false}
        onInvitePlayer={() => {}}
        onCreateCharacter={() => {}}
      />,
    );
    expect(screen.queryByText('invite_player')).not.toBeInTheDocument();
    expect(screen.queryByText('create_character')).not.toBeInTheDocument();
  });

  it('calls the GM callbacks when shortcut buttons are clicked', () => {
    const onInvitePlayer = vi.fn();
    const onCreateCharacter = vi.fn();
    renderWithProviders(
      <PartyEmptyStateSection
        isGm
        onInvitePlayer={onInvitePlayer}
        onCreateCharacter={onCreateCharacter}
      />,
    );
    fireEvent.click(screen.getByText('invite_player'));
    fireEvent.click(screen.getByText('create_character'));
    expect(onInvitePlayer).toHaveBeenCalledTimes(1);
    expect(onCreateCharacter).toHaveBeenCalledTimes(1);
  });
});
