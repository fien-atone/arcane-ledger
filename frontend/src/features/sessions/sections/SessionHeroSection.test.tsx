/**
 * Tests for SessionHeroSection — header card with number, title, datetime,
 * prev/next nav, and the actions cluster.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { SessionHeroSection } from './SessionHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { Session } from '@/entities/session';

const session: Session = {
  id: 's-2',
  campaignId: 'camp-1',
  number: 7,
  title: 'The Goblin Caves',
  datetime: '2026-04-01T20:00:00Z',
  brief: '',
  summary: '',
  createdAt: '2026-04-01',
  npcs: [],
  locations: [],
  quests: [],
};

describe('SessionHeroSection', () => {
  it('renders the title and zero-padded session number', () => {
    renderWithProviders(
      <SessionHeroSection
        campaignId="camp-1"
        session={session}
        prevSession={undefined}
        nextSession={undefined}
        isGm={false}
        campaignTitle="Test Campaign"
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { name: 'The Goblin Caves' })).toBeInTheDocument();
    // session_prefix is rendered with zero-padded number (e.g. "session_prefix07")
    expect(screen.getByText(/07/)).toBeInTheDocument();
  });

  it('renders prev/next nav links when siblings are provided', () => {
    const prev: Session = { ...session, id: 's-1', number: 6, title: 'Prev' };
    const next: Session = { ...session, id: 's-3', number: 8, title: 'Next' };
    renderWithProviders(
      <SessionHeroSection
        campaignId="camp-1"
        session={session}
        prevSession={prev}
        nextSession={next}
        isGm={false}
        campaignTitle="Test Campaign"
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    const prevLink = screen.getByRole('link', { name: /06/ });
    const nextLink = screen.getByRole('link', { name: /08/ });
    expect(prevLink).toHaveAttribute('href', '/campaigns/camp-1/sessions/s-1');
    expect(nextLink).toHaveAttribute('href', '/campaigns/camp-1/sessions/s-3');
  });
});
