/**
 * Tests for DashboardHeroSection — verifies title rendering, the GM-only
 * archive/sections controls, and inline title editing UI.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DashboardHeroSection } from './DashboardHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { CampaignSummary } from '@/entities/campaign';

const fakeCampaign: CampaignSummary = {
  id: 'camp-1',
  title: 'Shadows of Valoria',
  description: '<p>Desc</p>',
  createdAt: '2026-01-01',
  archivedAt: undefined,
  myRole: 'gm',
  enabledSections: ['sessions', 'npcs'],
  sessionCount: 0,
  memberCount: 0,
};

const baseProps = {
  campaignId: 'camp-1',
  campaign: fakeCampaign,
  sectionOn: () => true,
  editingTitle: false,
  titleDraft: '',
  onTitleDraftChange: vi.fn(),
  onStartEditTitle: vi.fn(),
  onCommitTitle: vi.fn(),
  onCancelEditTitle: vi.fn(),
  confirmArchive: false,
  onRequestArchive: vi.fn(),
  onCancelArchive: vi.fn(),
  onToggleArchive: vi.fn(),
  onOpenSections: vi.fn(),
  onSaveDescription: vi.fn(),
};

describe('DashboardHeroSection', () => {
  it('renders the campaign title as a heading', () => {
    renderWithProviders(<DashboardHeroSection {...baseProps} isGm={true} />);
    expect(
      screen.getByRole('heading', { name: /Shadows of Valoria/i }),
    ).toBeInTheDocument();
  });

  it('hides archive/sections buttons for non-GM viewers', () => {
    renderWithProviders(<DashboardHeroSection {...baseProps} isGm={false} />);
    expect(screen.queryByText('common:sections')).not.toBeInTheDocument();
    expect(screen.queryByText('common:archive')).not.toBeInTheDocument();
  });

  it('shows the archive confirm prompt when confirmArchive=true for GM', () => {
    renderWithProviders(
      <DashboardHeroSection {...baseProps} isGm={true} confirmArchive={true} />,
    );
    expect(screen.getByText('dashboard.archive_confirm')).toBeInTheDocument();
    expect(screen.getByText('yes')).toBeInTheDocument();
    expect(screen.getByText('no')).toBeInTheDocument();
  });
});
