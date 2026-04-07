/**
 * Tests for LocationGmNotesSection — GM-only notes panel.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LocationGmNotesSection } from './LocationGmNotesSection';
import { renderWithProviders } from '@/test/helpers';
import type { Location } from '@/entities/location';

const baseLocation: Location = {
  id: 'loc-1',
  campaignId: 'camp-1',
  name: 'Silverhold',
  type: 'settlement',
  description: '',
  createdAt: '2026-01-01',
};

describe('LocationGmNotesSection', () => {
  it('renders nothing for non-GM viewers', () => {
    const { container } = renderWithProviders(
      <LocationGmNotesSection location={baseLocation} isGm={false} onSaveField={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the GM notes editor label for the GM', () => {
    renderWithProviders(
      <LocationGmNotesSection location={baseLocation} isGm={true} onSaveField={() => {}} />,
    );
    // The InlineRichField with `isGmNotes` renders its own internal "gm_notes"
    // heading rather than the supplied label, so we assert the GM-only chrome.
    expect(screen.getByText('gm_notes')).toBeInTheDocument();
  });
});
