/**
 * Tests for SessionBriefSection — public-facing session brief.
 *
 * Both GM and player views render the section_brief label so we just check
 * the appropriate empty/content state for each role.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { SessionBriefSection } from './SessionBriefSection';
import { renderWithProviders } from '@/test/helpers';
import type { Session } from '@/entities/session';

const baseSession: Session = {
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

describe('SessionBriefSection', () => {
  it('renders the brief content for a player when present', () => {
    renderWithProviders(
      <SessionBriefSection
        session={{ ...baseSession, brief: '<p>The party met in a tavern.</p>' }}
        isGm={false}
        onSaveField={() => {}}
      />,
    );
    expect(screen.getByText(/met in a tavern/)).toBeInTheDocument();
  });

  it('shows the empty brief placeholder for a player when no brief', () => {
    renderWithProviders(
      <SessionBriefSection session={baseSession} isGm={false} onSaveField={() => {}} />,
    );
    expect(screen.getByText('no_brief')).toBeInTheDocument();
  });

  it('renders the rich-text editor label for the GM', () => {
    renderWithProviders(
      <SessionBriefSection session={baseSession} isGm={true} onSaveField={() => {}} />,
    );
    // The GM gets InlineRichField which renders the label
    expect(screen.getByText('section_brief')).toBeInTheDocument();
  });
});
