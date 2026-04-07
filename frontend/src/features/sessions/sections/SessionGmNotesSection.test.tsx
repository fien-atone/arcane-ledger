/**
 * Tests for SessionGmNotesSection — private GM-only notes panel.
 *
 * Mirrors the NpcGmNotesPanel pattern: renders nothing for non-GM viewers.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { SessionGmNotesSection } from './SessionGmNotesSection';
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

describe('SessionGmNotesSection', () => {
  it('renders nothing for non-GM viewers', () => {
    const { container } = renderWithProviders(
      <SessionGmNotesSection session={session} isGm={false} onSaveNote={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the GM notes panel when viewer is GM', () => {
    renderWithProviders(
      <SessionGmNotesSection session={session} isGm={true} onSaveNote={() => {}} />,
    );
    // InlineRichField in GM-notes mode renders the localized "gm_notes" header
    // (not the section_gm_notes label key) plus the placeholder copy.
    expect(screen.getByText('gm_notes')).toBeInTheDocument();
    expect(screen.getByText('placeholder_gm_notes')).toBeInTheDocument();
  });
});
