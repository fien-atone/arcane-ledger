/**
 * Tests for LocationTypesHeroSection — pure presentational header card.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { LocationTypesHeroSection } from './LocationTypesHeroSection';
import { renderWithProviders } from '@/test/helpers';

describe('LocationTypesHeroSection', () => {
  it('renders title and subtitle keys', () => {
    renderWithProviders(<LocationTypesHeroSection onAddNew={() => {}} />);
    expect(screen.getByText('types_title')).toBeInTheDocument();
    expect(screen.getByText('types_subtitle')).toBeInTheDocument();
    expect(screen.getByText('types_add')).toBeInTheDocument();
  });

  it('calls onAddNew when the add button is clicked', () => {
    const onAddNew = vi.fn();
    renderWithProviders(<LocationTypesHeroSection onAddNew={onAddNew} />);
    fireEvent.click(screen.getByText('types_add'));
    expect(onAddNew).toHaveBeenCalledTimes(1);
  });
});
