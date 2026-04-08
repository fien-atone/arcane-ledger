/**
 * Tests for CampaignsHeroSection — verifies the title and that the Create
 * Campaign button fires the onCreate callback.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { CampaignsHeroSection } from './CampaignsHeroSection';
import { renderWithProviders } from '@/test/helpers';

describe('CampaignsHeroSection', () => {
  it('renders the "my_campaigns" heading', () => {
    renderWithProviders(<CampaignsHeroSection onCreate={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'my_campaigns' }),
    ).toBeInTheDocument();
  });

  it('calls onCreate when the Create Campaign button is clicked', () => {
    const onCreate = vi.fn();
    renderWithProviders(<CampaignsHeroSection onCreate={onCreate} />);
    fireEvent.click(screen.getByRole('button', { name: /create_campaign/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
