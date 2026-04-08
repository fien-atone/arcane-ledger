/**
 * Tests for ProfileHeroSection — verifies the title + subtitle render.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ProfileHeroSection } from './ProfileHeroSection';
import { renderWithProviders } from '@/test/helpers';

describe('ProfileHeroSection', () => {
  it('renders the profile title heading', () => {
    renderWithProviders(<ProfileHeroSection />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
  });

  it('renders the subtitle copy', () => {
    renderWithProviders(<ProfileHeroSection />);
    expect(screen.getByText('subtitle')).toBeInTheDocument();
  });
});
