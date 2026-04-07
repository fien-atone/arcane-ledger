/**
 * Tests for SessionMyNotesSection — per-user private notes for players.
 *
 * Symmetric to SessionGmNotesSection: returns null for the GM, renders the
 * teal "private notes" panel for players.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { SessionMyNotesSection } from './SessionMyNotesSection';
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

describe('SessionMyNotesSection', () => {
  it('renders nothing when viewer is GM', () => {
    const { container } = renderWithProviders(
      <SessionMyNotesSection session={session} isGm={true} onSaveNote={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the private notes header for a player', () => {
    renderWithProviders(
      <SessionMyNotesSection session={session} isGm={false} onSaveNote={() => {}} />,
    );
    expect(screen.getByText('section_my_notes')).toBeInTheDocument();
    expect(screen.getByText('notes_private')).toBeInTheDocument();
  });
});
