/**
 * Tests for QuestSessionsSection — sessions where this quest progressed.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { QuestSessionsSection } from './QuestSessionsSection';
import { renderWithProviders } from '@/test/helpers';
import type { Quest } from '@/entities/quest';

const baseQuest: Quest = {
  id: 'q-1',
  campaignId: 'camp-1',
  title: 'Recover the Amulet',
  description: '',
  status: 'active',
  notes: '',
  createdAt: '2026-01-01',
};

describe('QuestSessionsSection', () => {
  it('renders nothing when the sessions module is disabled', () => {
    const { container } = renderWithProviders(
      <QuestSessionsSection
        campaignId="camp-1"
        quest={{
          ...baseQuest,
          sessions: [{ id: 's-1', number: 1, title: 'The Beginning' }],
        }}
        sessionsEnabled={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the quest has no linked sessions', () => {
    const { container } = renderWithProviders(
      <QuestSessionsSection campaignId="camp-1" quest={baseQuest} sessionsEnabled={true} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders linked sessions sorted by number desc', () => {
    renderWithProviders(
      <QuestSessionsSection
        campaignId="camp-1"
        quest={{
          ...baseQuest,
          sessions: [
            { id: 's-1', number: 1, title: 'The Beginning' },
            { id: 's-2', number: 2, title: 'The Middle' },
          ],
        }}
        sessionsEnabled={true}
      />,
    );
    expect(screen.getByText('section_sessions')).toBeInTheDocument();
    expect(screen.getByText('The Beginning')).toBeInTheDocument();
    expect(screen.getByText('The Middle')).toBeInTheDocument();
  });
});
