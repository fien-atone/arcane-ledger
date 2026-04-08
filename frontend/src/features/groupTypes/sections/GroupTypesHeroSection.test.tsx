/**
 * Tests for GroupTypesHeroSection — pure presentational header card.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { GroupTypesHeroSection } from './GroupTypesHeroSection';
import { renderWithProviders } from '@/test/helpers';

describe('GroupTypesHeroSection', () => {
  it('renders title, subtitle and add-button keys', () => {
    renderWithProviders(<GroupTypesHeroSection onAddNew={() => {}} />);
    expect(screen.getByText('types_title')).toBeInTheDocument();
    expect(screen.getByText('types_subtitle')).toBeInTheDocument();
    expect(screen.getByText('types_add')).toBeInTheDocument();
  });

  it('calls onAddNew when the add button is clicked', () => {
    const onAddNew = vi.fn();
    renderWithProviders(<GroupTypesHeroSection onAddNew={onAddNew} />);
    fireEvent.click(screen.getByText('types_add'));
    expect(onAddNew).toHaveBeenCalledTimes(1);
  });
});
