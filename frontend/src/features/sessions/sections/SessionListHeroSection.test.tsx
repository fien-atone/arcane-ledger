/**
 * Tests for SessionListHeroSection — presentational header card with title,
 * add CTA, and search input.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SessionListHeroSection } from './SessionListHeroSection';
import { renderWithProviders } from '@/test/helpers';

function baseProps(
  overrides: Partial<
    React.ComponentProps<typeof SessionListHeroSection>
  > = {},
) {
  return {
    isGm: true,
    search: '',
    onSearchChange: vi.fn(),
    shownCount: 3,
    onAdd: vi.fn(),
    ...overrides,
  };
}

describe('SessionListHeroSection', () => {
  it('renders title, subtitle and GM add button', () => {
    renderWithProviders(<SessionListHeroSection {...baseProps()} />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(
      screen.getByText('new_session', { selector: 'span.font-label' }),
    ).toBeInTheDocument();
  });

  it('hides add button for non-GM users', () => {
    renderWithProviders(
      <SessionListHeroSection {...baseProps({ isGm: false })} />,
    );
    expect(
      screen.queryByText('new_session', { selector: 'span.font-label' }),
    ).not.toBeInTheDocument();
  });

  it('calls onAdd and onSearchChange handlers', () => {
    const onAdd = vi.fn();
    const onSearchChange = vi.fn();
    renderWithProviders(
      <SessionListHeroSection {...baseProps({ onAdd, onSearchChange })} />,
    );

    fireEvent.click(
      screen.getByText('new_session', { selector: 'span.font-label' }),
    );
    expect(onAdd).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('search_placeholder'), {
      target: { value: 'goblin' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('goblin');
  });
});
