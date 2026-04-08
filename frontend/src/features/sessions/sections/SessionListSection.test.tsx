/**
 * Tests for SessionListSection — loading / error / empty / list states of
 * the SessionListPage main list card.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SessionListSection } from './SessionListSection';
import { renderWithProviders } from '@/test/helpers';
import type { Session } from '@/entities/session';

const session: Session = {
  id: 's-1',
  campaignId: 'camp-1',
  number: 4,
  title: 'Into the Mire',
  datetime: '2026-05-01T18:00:00.000Z',
  brief: 'A foggy descent',
  summary: '',
  createdAt: '2026-01-01',
};

function baseProps(
  overrides: Partial<React.ComponentProps<typeof SessionListSection>> = {},
) {
  return {
    campaignId: 'camp-1',
    isLoading: false,
    isError: false,
    filtered: [session],
    formatDate: (iso: string) => `formatted:${iso}`,
    getBadge: vi.fn().mockReturnValue(null),
    ...overrides,
  };
}

describe('SessionListSection', () => {
  it('shows loading state', () => {
    renderWithProviders(
      <SessionListSection {...baseProps({ isLoading: true })} />,
    );
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('shows empty state when filtered is empty', () => {
    renderWithProviders(
      <SessionListSection {...baseProps({ filtered: [] })} />,
    );
    expect(screen.getByText('empty_title')).toBeInTheDocument();
  });

  it('renders rows with title, padded number and formatted date', () => {
    renderWithProviders(<SessionListSection {...baseProps()} />);
    expect(screen.getByText('Into the Mire')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
    // Date appears in both desktop column and mobile subtitle
    expect(
      screen.getAllByText(`formatted:${session.datetime}`).length,
    ).toBeGreaterThan(0);
  });

  it('renders the badge label when getBadge returns one', () => {
    renderWithProviders(
      <SessionListSection
        {...baseProps({
          getBadge: () => ({
            label: 'badge_today',
            cls: '',
            pulse: false,
            dotCls: '',
          }),
        })}
      />,
    );
    expect(screen.getByText('badge_today')).toBeInTheDocument();
  });
});
