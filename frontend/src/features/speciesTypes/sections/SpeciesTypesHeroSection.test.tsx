/**
 * Tests for SpeciesTypesHeroSection — pure presentational header card.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SpeciesTypesHeroSection } from './SpeciesTypesHeroSection';
import { renderWithProviders } from '@/test/helpers';

describe('SpeciesTypesHeroSection', () => {
  it('renders title, subtitle and add-button keys', () => {
    renderWithProviders(<SpeciesTypesHeroSection onAddNew={() => {}} />);
    expect(screen.getByText('types_title')).toBeInTheDocument();
    expect(screen.getByText('types_subtitle')).toBeInTheDocument();
    expect(screen.getByText('types_add')).toBeInTheDocument();
  });

  it('calls onAddNew when the add button is clicked', () => {
    const onAddNew = vi.fn();
    renderWithProviders(<SpeciesTypesHeroSection onAddNew={onAddNew} />);
    fireEvent.click(screen.getByText('types_add'));
    expect(onAddNew).toHaveBeenCalledTimes(1);
  });
});
