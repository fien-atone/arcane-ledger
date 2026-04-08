/**
 * Tests for QuestListSection — loading / error / empty / list states of the
 * main QuestListPage list card.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { QuestListSection } from './QuestListSection';
import { renderWithProviders } from '@/test/helpers';
import type { Quest } from '@/entities/quest';

const quest: Quest = {
  id: 'q-1',
  campaignId: 'camp-1',
  title: 'Find the Sword',
  description: 'Locate the ancient blade',
  status: 'active',
  notes: '',
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
};

function baseProps(
  overrides: Partial<React.ComponentProps<typeof QuestListSection>> = {},
) {
  return {
    campaignId: 'camp-1',
    isGm: true,
    partyEnabled: true,
    isLoading: false,
    isError: false,
    filtered: [quest],
    onToggleVisibility: vi.fn(),
    ...overrides,
  };
}

describe('QuestListSection', () => {
  it('shows empty state when filtered is empty', () => {
    renderWithProviders(<QuestListSection {...baseProps({ filtered: [] })} />);
    expect(screen.getByText('empty_title')).toBeInTheDocument();
  });

  it('renders rows with title and status label', () => {
    renderWithProviders(<QuestListSection {...baseProps()} />);
    expect(screen.getByText('Find the Sword')).toBeInTheDocument();
    // status_active appears in the pill and the mobile subtitle
    expect(screen.getAllByText('status_active').length).toBeGreaterThan(0);
  });

  it('calls onToggleVisibility when the eye button is clicked (party-gated)', () => {
    const onToggleVisibility = vi.fn();
    renderWithProviders(
      <QuestListSection {...baseProps({ onToggleVisibility })} />,
    );
    fireEvent.click(screen.getByTitle('visible_to_players'));
    expect(onToggleVisibility).toHaveBeenCalledWith(quest);
  });

  it('hides the visibility toggle when party is disabled', () => {
    renderWithProviders(
      <QuestListSection {...baseProps({ partyEnabled: false })} />,
    );
    expect(screen.queryByTitle('visible_to_players')).not.toBeInTheDocument();
  });
});
