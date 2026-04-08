/**
 * Tests for LocationTypeDetailSection — right-column edit view.
 *
 * Mutation hooks fire only on user interaction so no Apollo mocks are needed
 * for the basic render assertions.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LocationTypeDetailSection } from './LocationTypeDetailSection';
import { renderWithProviders } from '@/test/helpers';
import type {
  LocationTypeEntry,
  LocationTypeContainmentRule,
} from '@/entities/locationType';

const entry: LocationTypeEntry = {
  id: 'lt-1',
  name: 'Settlement',
  icon: 'apartment',
  category: 'civilization',
  biomeOptions: [],
  isSettlement: true,
  builtin: true,
  createdAt: '',
};

const customEntry: LocationTypeEntry = {
  id: 'lt-2',
  name: 'Custom Type',
  icon: 'place',
  category: 'poi',
  biomeOptions: [],
  isSettlement: false,
  builtin: false,
  createdAt: '',
};

const allTypes: LocationTypeEntry[] = [entry, customEntry];
const containRules: LocationTypeContainmentRule[] = [];

describe('LocationTypeDetailSection', () => {
  it('renders the entry name in the editable field and the save button', () => {
    renderWithProviders(
      <LocationTypeDetailSection
        campaignId="camp-1"
        entry={entry}
        allTypes={allTypes}
        containRules={containRules}
        onDeleted={() => {}}
      />,
    );
    expect(screen.getByDisplayValue('Settlement')).toBeInTheDocument();
    expect(screen.getByText('types_save_changes')).toBeInTheDocument();
  });

  it('hides the delete button for builtin types', () => {
    renderWithProviders(
      <LocationTypeDetailSection
        campaignId="camp-1"
        entry={entry}
        allTypes={allTypes}
        containRules={containRules}
        onDeleted={() => {}}
      />,
    );
    expect(screen.queryByText('types_delete')).toBeNull();
  });

  it('shows the delete button for custom (non-builtin) types', () => {
    renderWithProviders(
      <LocationTypeDetailSection
        campaignId="camp-1"
        entry={customEntry}
        allTypes={allTypes}
        containRules={containRules}
        onDeleted={() => {}}
      />,
    );
    expect(screen.getByText('types_delete')).toBeInTheDocument();
  });

  it('renders both relation sub-sections', () => {
    renderWithProviders(
      <LocationTypeDetailSection
        campaignId="camp-1"
        entry={entry}
        allTypes={allTypes}
        containRules={containRules}
        onDeleted={() => {}}
      />,
    );
    expect(screen.getByText('types_relation_can_be_child_of')).toBeInTheDocument();
    expect(screen.getByText('types_relation_can_contain')).toBeInTheDocument();
  });
});
