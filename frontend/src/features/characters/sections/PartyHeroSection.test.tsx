/**
 * Tests for PartyHeroSection — header card.
 *
 * Verifies:
 * - The title and subtitle keys render regardless of role
 * - GMs see the invite-player and add-character buttons
 * - Non-GM viewers do not see those controls
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartyHeroSection } from './PartyHeroSection';
import { renderWithProviders } from '@/test/helpers';

describe('PartyHeroSection', () => {
  const baseProps = {
    campaignId: 'camp-1',
    invitePanelOpen: false,
    onToggleInvitePanel: () => {},
    onCloseInvitePanel: () => {},
    onAddCharacter: () => {},
  };

  it('renders title and subtitle keys', () => {
    renderWithProviders(<PartyHeroSection {...baseProps} isGm={false} />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
  });

  it('shows invite and add buttons for GMs', () => {
    renderWithProviders(<PartyHeroSection {...baseProps} isGm />);
    expect(screen.getByText('invite_player')).toBeInTheDocument();
    expect(screen.getByText('add_character')).toBeInTheDocument();
  });

  it('hides invite and add buttons for non-GM viewers', () => {
    renderWithProviders(<PartyHeroSection {...baseProps} isGm={false} />);
    expect(screen.queryByText('invite_player')).not.toBeInTheDocument();
    expect(screen.queryByText('add_character')).not.toBeInTheDocument();
  });

  it('calls onAddCharacter when the add button is clicked', () => {
    const onAddCharacter = vi.fn();
    renderWithProviders(
      <PartyHeroSection {...baseProps} isGm onAddCharacter={onAddCharacter} />,
    );
    fireEvent.click(screen.getByText('add_character'));
    expect(onAddCharacter).toHaveBeenCalledTimes(1);
  });
});
