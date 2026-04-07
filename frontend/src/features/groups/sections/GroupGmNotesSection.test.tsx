/**
 * Tests for GroupGmNotesSection — private GM-only notes panel for a group.
 *
 * Mirrors NpcGmNotesPanel and SessionGmNotesSection: returns null for non-GM
 * viewers, renders InlineRichField in GM-notes mode for the GM.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { GroupGmNotesSection } from './GroupGmNotesSection';
import { renderWithProviders } from '@/test/helpers';
import type { Group } from '@/entities/group';

const group: Group = {
  id: 'g-1',
  campaignId: 'camp-1',
  name: 'The Silver Hand',
  type: 'faction',
  aliases: [],
  description: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('GroupGmNotesSection', () => {
  it('renders nothing for non-GM viewers', () => {
    const { container } = renderWithProviders(
      <GroupGmNotesSection group={group} isGm={false} onSaveField={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the GM notes panel when viewer is GM', () => {
    renderWithProviders(
      <GroupGmNotesSection group={group} isGm={true} onSaveField={() => {}} />,
    );
    // InlineRichField in GM-notes mode renders the localized "gm_notes" header
    expect(screen.getByText('gm_notes')).toBeInTheDocument();
  });
});
