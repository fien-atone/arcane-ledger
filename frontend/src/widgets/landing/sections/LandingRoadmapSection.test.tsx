/**
 * Smoke tests for LandingRoadmapSection — verifies the heading and one
 * roadmap card render.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LandingRoadmapSection } from './LandingRoadmapSection';
import { renderWithProviders } from '@/test/helpers';

describe('LandingRoadmapSection', () => {
  it('renders the roadmap heading', () => {
    renderWithProviders(<LandingRoadmapSection />);
    expect(
      screen.getByRole('heading', { name: 'roadmap.title' }),
    ).toBeInTheDocument();
  });

  it('renders a roadmap card title', () => {
    renderWithProviders(<LandingRoadmapSection />);
    expect(screen.getByText('roadmap.items_artifacts')).toBeInTheDocument();
  });
});
