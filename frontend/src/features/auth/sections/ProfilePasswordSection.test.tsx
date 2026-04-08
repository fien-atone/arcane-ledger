/**
 * Tests for ProfilePasswordSection — verifies the three password inputs
 * render, the submit button is disabled until all fields are filled, and
 * client-side validation rejects mismatched passwords.
 */
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ProfilePasswordSection } from './ProfilePasswordSection';
import { renderWithProviders } from '@/test/helpers';

describe('ProfilePasswordSection', () => {
  it('renders current, new, and confirm password inputs', () => {
    renderWithProviders(<ProfilePasswordSection />);
    expect(screen.getByPlaceholderText('current_password_placeholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('new_password_placeholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('confirm_password_placeholder')).toBeInTheDocument();
  });

  it('keeps the submit button disabled until all three fields are filled', () => {
    renderWithProviders(<ProfilePasswordSection />);
    const btn = screen.getByRole('button', { name: /change_password_button/i });
    expect(btn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('current_password_placeholder'), {
      target: { value: 'old' },
    });
    fireEvent.change(screen.getByPlaceholderText('new_password_placeholder'), {
      target: { value: 'newpass' },
    });
    fireEvent.change(screen.getByPlaceholderText('confirm_password_placeholder'), {
      target: { value: 'newpass' },
    });
    expect(btn).not.toBeDisabled();
  });

  it('shows a validation error when new and confirm passwords do not match', () => {
    renderWithProviders(<ProfilePasswordSection />);
    fireEvent.change(screen.getByPlaceholderText('current_password_placeholder'), {
      target: { value: 'old' },
    });
    fireEvent.change(screen.getByPlaceholderText('new_password_placeholder'), {
      target: { value: 'newpass' },
    });
    fireEvent.change(screen.getByPlaceholderText('confirm_password_placeholder'), {
      target: { value: 'different' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change_password_button/i }));
    expect(screen.getByText('validation.passwords_not_match')).toBeInTheDocument();
  });
});
