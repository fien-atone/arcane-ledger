/**
 * Snapshot + behaviour tests for InlineConfirm — the asking-state UI of the
 * inline Yes/No confirm pattern.
 *
 * Protects against "one className typo breaks 16 sections" regressions —
 * same rationale as SectionPanel.test.tsx.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@/shared/i18n';
import { InlineConfirm } from './InlineConfirm';

describe('InlineConfirm', () => {
  it('renders the label and Yes / No buttons from common namespace', () => {
    render(<InlineConfirm label="Remove?" onYes={() => {}} onNo={() => {}} />);
    expect(screen.getByText('Remove?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('calls onYes when Yes is clicked', () => {
    const onYes = vi.fn();
    render(<InlineConfirm label="Remove?" onYes={onYes} onNo={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onYes).toHaveBeenCalledTimes(1);
  });

  it('calls onNo when No is clicked', () => {
    const onNo = vi.fn();
    render(<InlineConfirm label="Remove?" onYes={() => {}} onNo={onNo} />);
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onNo).toHaveBeenCalledTimes(1);
  });

  it('disables Yes when yesDisabled is true', () => {
    const onYes = vi.fn();
    render(
      <InlineConfirm label="Remove?" onYes={onYes} onNo={() => {}} yesDisabled />,
    );
    const yesBtn = screen.getByRole('button', { name: 'Yes' }) as HTMLButtonElement;
    expect(yesBtn.disabled).toBe(true);
    fireEvent.click(yesBtn);
    expect(onYes).not.toHaveBeenCalled();
  });

  it('row variant uses text-[10px] with no border', () => {
    const { container } = render(
      <InlineConfirm label="Remove?" onYes={() => {}} onNo={() => {}} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-error/5');
    expect(wrapper.className).toContain('border-l');
    expect(wrapper.className).not.toContain('rounded-sm');
    const label = screen.getByText('Remove?');
    expect(label.className).toContain('text-[10px]');
  });

  it('hero variant uses text-[9px] with a bordered pill', () => {
    const { container } = render(
      <InlineConfirm label="Delete?" onYes={() => {}} onNo={() => {}} variant="hero" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('border-error/30');
    expect(wrapper.className).toContain('rounded-sm');
    const label = screen.getByText('Delete?');
    expect(label.className).toContain('text-[9px]');
  });

  it('matches snapshot for row variant', () => {
    const { container } = render(
      <InlineConfirm label="Remove?" onYes={() => {}} onNo={() => {}} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for hero variant', () => {
    const { container } = render(
      <InlineConfirm label="Delete?" onYes={() => {}} onNo={() => {}} variant="hero" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
