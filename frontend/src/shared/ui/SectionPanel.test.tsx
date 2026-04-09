/**
 * Snapshot tests for SectionPanel.
 *
 * These protect against "one className typo breaks 83 sections" regressions —
 * the whole point of extracting this wrapper is that its exact classList is
 * the one source of truth for the card-panel look.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionPanel } from './SectionPanel';

describe('SectionPanel', () => {
  it('renders children inside the surface wrapper', () => {
    render(
      <SectionPanel>
        <p>hello world</p>
      </SectionPanel>,
    );
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('renders the gold md-size title when title is provided', () => {
    render(
      <SectionPanel title="Members">
        <div />
      </SectionPanel>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Members' });
    expect(heading).toHaveClass('text-sm', 'font-label', 'font-bold', 'uppercase', 'text-primary');
    expect(heading.className).toContain('tracking-[0.2em]');
  });

  it('renders the small-size title variant', () => {
    render(
      <SectionPanel title="Profile info" size="sm">
        <div />
      </SectionPanel>,
    );
    const heading = screen.getByRole('heading', { level: 3, name: 'Profile info' });
    expect(heading.className).toContain('text-[10px]');
    expect(heading.className).toContain('tracking-[0.18em]');
  });

  it('renders an action slot next to the divider', () => {
    render(
      <SectionPanel title="NPCs" action={<button>Add</button>}>
        <div />
      </SectionPanel>,
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('omits the header row entirely when no title and no action', () => {
    const { container } = render(
      <SectionPanel>
        <p>body</p>
      </SectionPanel>,
    );
    expect(container.querySelector('h2, h3')).toBeNull();
    // No divider either.
    expect(container.querySelector('.h-px')).toBeNull();
  });

  it('appends className to the wrapper without dropping base classes', () => {
    const { container } = render(
      <SectionPanel className="mb-8">
        <div />
      </SectionPanel>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-surface-container');
    expect(wrapper.className).toContain('border-outline-variant/20');
    expect(wrapper.className).toContain('rounded-sm');
    expect(wrapper.className).toContain('p-6');
    expect(wrapper.className).toContain('mb-8');
  });

  it('matches snapshot for the canonical title + action shape', () => {
    const { container } = render(
      <SectionPanel title="Members" action={<button>Add</button>}>
        <p>body</p>
      </SectionPanel>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
