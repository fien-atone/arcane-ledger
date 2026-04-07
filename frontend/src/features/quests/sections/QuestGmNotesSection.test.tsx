/**
 * Tests for QuestGmNotesSection — private GM-only notes panel for a quest.
 *
 * Mirrors GroupGmNotesSection: returns null for non-GM viewers, renders
 * InlineRichField in GM-notes mode for the GM.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { QuestGmNotesSection } from './QuestGmNotesSection';
import { renderWithProviders } from '@/test/helpers';
import type { Quest } from '@/entities/quest';

const quest: Quest = {
  id: 'q-1',
  campaignId: 'camp-1',
  title: 'Recover the Amulet',
  description: '',
  status: 'active',
  notes: '',
  createdAt: '2026-01-01',
};

describe('QuestGmNotesSection', () => {
  it('renders nothing for non-GM viewers', () => {
    const { container } = renderWithProviders(
      <QuestGmNotesSection quest={quest} isGm={false} onSaveField={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the GM notes panel when viewer is GM', () => {
    renderWithProviders(
      <QuestGmNotesSection quest={quest} isGm={true} onSaveField={() => {}} />,
    );
    // InlineRichField in GM-notes mode renders the localized "gm_notes" header
    expect(screen.getByText('gm_notes')).toBeInTheDocument();
  });
});
