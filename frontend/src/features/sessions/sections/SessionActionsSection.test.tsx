/**
 * Tests for SessionActionsSection — top-right actions cluster.
 *
 * - Players never see edit/delete buttons (GM-only).
 * - The calendar dropdown trigger is shown to anyone if datetime exists.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { SessionActionsSection } from './SessionActionsSection';
import { renderWithProviders } from '@/test/helpers';
import type { Session } from '@/entities/session';

const session: Session = {
  id: 's-1',
  campaignId: 'camp-1',
  number: 1,
  title: 'The Beginning',
  datetime: '2026-04-01T20:00:00Z',
  brief: '',
  summary: '',
  createdAt: '2026-04-01',
  npcs: [],
  locations: [],
  quests: [],
};

describe('SessionActionsSection', () => {
  it('hides edit and delete buttons for non-GM viewers', () => {
    renderWithProviders(
      <SessionActionsSection
        session={session}
        isGm={false}
        campaignTitle="Test Campaign"
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    // Players see one button: the calendar trigger.
    expect(screen.getByText('calendar')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('shows edit and delete buttons for GM viewers', () => {
    renderWithProviders(
      <SessionActionsSection
        session={session}
        isGm={true}
        campaignTitle="Test Campaign"
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    // GM gets calendar + delete + edit (3 buttons total)
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByText('calendar')).toBeInTheDocument();
  });
});
