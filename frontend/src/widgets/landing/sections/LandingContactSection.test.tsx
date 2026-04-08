/**
 * Smoke tests for LandingContactSection — verifies the heading and the three
 * contact links render.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LandingContactSection } from './LandingContactSection';
import { renderWithProviders } from '@/test/helpers';

describe('LandingContactSection', () => {
  it('renders the contact heading', () => {
    renderWithProviders(<LandingContactSection />);
    expect(
      screen.getByRole('heading', { name: 'contact.title' }),
    ).toBeInTheDocument();
  });

  it('renders telegram, twitter and email links', () => {
    renderWithProviders(<LandingContactSection />);
    expect(screen.getByRole('link', { name: /contact\.telegram/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact\.twitter/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact\.email/i })).toBeInTheDocument();
  });
});
