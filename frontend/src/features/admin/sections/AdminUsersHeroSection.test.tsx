/**
 * Tests for AdminUsersHeroSection — verifies the title renders and the
 * Create User button fires the onCreate callback.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AdminUsersHeroSection } from './AdminUsersHeroSection';
import { renderWithProviders } from '@/test/helpers';

describe('AdminUsersHeroSection', () => {
  it('renders the admin title heading', () => {
    renderWithProviders(<AdminUsersHeroSection onCreate={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
  });

  it('calls onCreate when the Create User button is clicked', () => {
    const onCreate = vi.fn();
    renderWithProviders(<AdminUsersHeroSection onCreate={onCreate} />);
    fireEvent.click(screen.getByRole('button', { name: /create_user/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
