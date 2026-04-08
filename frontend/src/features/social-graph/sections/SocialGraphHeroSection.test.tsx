/**
 * Tests for SocialGraphHeroSection — presentational header card with title,
 * view-mode switcher, and list-view link.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SocialGraphHeroSection } from './SocialGraphHeroSection';
import { renderWithProviders } from '@/test/helpers';

function baseProps(
  overrides: Partial<React.ComponentProps<typeof SocialGraphHeroSection>> = {},
) {
  return {
    campaignId: 'camp-1',
    viewMode: 'chord' as const,
    onViewModeChange: vi.fn(),
    ...overrides,
  };
}

describe('SocialGraphHeroSection', () => {
  it('renders title, subtitle and both view-mode buttons', () => {
    renderWithProviders(<SocialGraphHeroSection {...baseProps()} />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(screen.getByTitle('view_force_title')).toBeInTheDocument();
    expect(screen.getByTitle('view_chord_title')).toBeInTheDocument();
    expect(screen.getByTitle('view_list_title')).toBeInTheDocument();
  });

  it('calls onViewModeChange when clicking force/chord buttons', () => {
    const onViewModeChange = vi.fn();
    renderWithProviders(
      <SocialGraphHeroSection {...baseProps({ onViewModeChange })} />,
    );

    fireEvent.click(screen.getByTitle('view_force_title'));
    expect(onViewModeChange).toHaveBeenCalledWith('force');

    fireEvent.click(screen.getByTitle('view_chord_title'));
    expect(onViewModeChange).toHaveBeenCalledWith('chord');
  });

  it('list link points to the campaign NPC list', () => {
    renderWithProviders(
      <SocialGraphHeroSection {...baseProps({ campaignId: 'camp-42' })} />,
    );
    const link = screen.getByTitle('view_list_title') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/campaigns/camp-42/npcs');
  });
});
