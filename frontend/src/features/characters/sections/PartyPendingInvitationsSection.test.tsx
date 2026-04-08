/**
 * Tests for PartyPendingInvitationsSection.
 *
 * Verifies:
 * - Returns null when there are no invitations (no section card rendered)
 * - Lists invitation rows with user name and email
 * - Cancel button only renders for GMs
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { PartyPendingInvitationsSection } from './PartyPendingInvitationsSection';
import { renderWithProviders } from '@/test/helpers';
import type { CampaignInvitation } from '@/entities/invitation';

const invitations: CampaignInvitation[] = [
  {
    id: 'inv-1',
    campaignId: 'camp-1',
    user: { id: 'u1', name: 'Alice', email: 'alice@example.com' },
    invitedBy: { id: 'gm', name: 'GM' },
    status: 'pending',
    createdAt: '2026-01-01',
  },
];

describe('PartyPendingInvitationsSection', () => {
  it('renders nothing when there are no invitations', () => {
    const { container } = renderWithProviders(
      <PartyPendingInvitationsSection invitations={[]} isGm />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each invitation row with name and email', () => {
    renderWithProviders(
      <PartyPendingInvitationsSection invitations={invitations} isGm={false} />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('section_pending_invitations')).toBeInTheDocument();
    expect(screen.getByText('status_pending')).toBeInTheDocument();
  });

  it('shows the cancel button only for GMs', () => {
    const { rerender } = renderWithProviders(
      <PartyPendingInvitationsSection invitations={invitations} isGm={false} />,
    );
    expect(screen.queryByTitle('cancel_invitation')).not.toBeInTheDocument();

    rerender(<PartyPendingInvitationsSection invitations={invitations} isGm />);
    expect(screen.getByTitle('cancel_invitation')).toBeInTheDocument();
  });
});
