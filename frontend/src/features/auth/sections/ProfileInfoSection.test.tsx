/**
 * Tests for ProfileInfoSection — verifies the current user name prefills
 * the input, the email is shown read-only, and editing the name enables
 * the save button (disabled while it matches the stored name).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ProfileInfoSection } from './ProfileInfoSection';
import { renderWithProviders } from '@/test/helpers';
import { useAuthStore } from '@/features/auth';

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 'u-1',
      email: 'gm@arcaneledger.app',
      name: 'Game Master',
      systemRole: 'admin',
    },
  });
});

describe('ProfileInfoSection', () => {
  it('prefills the name input with the current user name', () => {
    renderWithProviders(<ProfileInfoSection />);
    const input = screen.getByPlaceholderText('name_placeholder') as HTMLInputElement;
    expect(input.value).toBe('Game Master');
  });

  it('shows the email as a read-only field', () => {
    renderWithProviders(<ProfileInfoSection />);
    const email = screen.getByDisplayValue('gm@arcaneledger.app') as HTMLInputElement;
    expect(email).toBeDisabled();
  });

  it('disables save while the name matches the stored name and enables it on edit', () => {
    renderWithProviders(<ProfileInfoSection />);
    const saveBtn = screen.getByRole('button', { name: /save_changes/i });
    expect(saveBtn).toBeDisabled();

    const input = screen.getByPlaceholderText('name_placeholder');
    fireEvent.change(input, { target: { value: 'New Name' } });
    expect(saveBtn).not.toBeDisabled();
  });
});
