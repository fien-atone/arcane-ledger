/**
 * Tests for QuestVisibilitySection — covers the party-gating rule.
 *
 * Should render nothing unless BOTH:
 *   - the current user is the GM, AND
 *   - the party module is enabled for the campaign
 */
import { describe, it, expect } from 'vitest';
import { QuestVisibilitySection } from './QuestVisibilitySection';
import { renderWithProviders } from '@/test/helpers';
import type { Quest } from '@/entities/quest';

const quest: Quest = {
  id: 'q-1',
  campaignId: 'camp-1',
  title: 'Recover the Amulet',
  description: '',
  status: 'active',
  notes: '',
  playerVisible: false,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
};

describe('QuestVisibilitySection', () => {
  it('renders nothing when party module is disabled', () => {
    const { container } = renderWithProviders(
      <QuestVisibilitySection campaignId="camp-1" quest={quest} isGm={true} partyEnabled={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when viewer is not GM', () => {
    const { container } = renderWithProviders(
      <QuestVisibilitySection campaignId="camp-1" quest={quest} isGm={false} partyEnabled={true} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the visibility panel when GM views a party-enabled campaign', () => {
    const { container } = renderWithProviders(
      <QuestVisibilitySection campaignId="camp-1" quest={quest} isGm={true} partyEnabled={true} />,
    );
    expect(container.querySelector('section')).toBeInTheDocument();
  });
});
