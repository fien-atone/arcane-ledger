/**
 * Snapshot + interaction tests for FormDrawer.
 *
 * Protects against "one className typo breaks 11 drawers" regressions.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers';
import { FormDrawer } from './FormDrawer';

describe('FormDrawer', () => {
  it('renders nothing when open is false', () => {
    const { container } = renderWithProviders(
      <FormDrawer open={false} onClose={() => {}}>
        <FormDrawer.Body>hidden</FormDrawer.Body>
      </FormDrawer>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders children when open is true', () => {
    renderWithProviders(
      <FormDrawer open={true} onClose={() => {}}>
        <FormDrawer.Body>visible content</FormDrawer.Body>
      </FormDrawer>,
    );
    expect(screen.getByText('visible content')).toBeInTheDocument();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <FormDrawer open={true} onClose={onClose}>
        <FormDrawer.Body>x</FormDrawer.Body>
      </FormDrawer>,
    );
    const backdrop = container.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('applies standard z-index by default', () => {
    const { container } = renderWithProviders(
      <FormDrawer open={true} onClose={() => {}}>
        <FormDrawer.Body>x</FormDrawer.Body>
      </FormDrawer>,
    );
    const backdrop = container.querySelector('.fixed.inset-0') as HTMLElement;
    const panel = container.querySelector('.fixed.inset-y-0') as HTMLElement;
    expect(backdrop.className).toContain('z-60');
    expect(panel.className).toContain('z-70');
  });

  it('applies elevated z-index when elevated is true', () => {
    const { container } = renderWithProviders(
      <FormDrawer open={true} onClose={() => {}} elevated>
        <FormDrawer.Body>x</FormDrawer.Body>
      </FormDrawer>,
    );
    const backdrop = container.querySelector('.fixed.inset-0') as HTMLElement;
    const panel = container.querySelector('.fixed.inset-y-0') as HTMLElement;
    expect(backdrop.className).toContain('z-[110]');
    expect(panel.className).toContain('z-[120]');
  });

  it('panel has max-w-lg wrapper class', () => {
    const { container } = renderWithProviders(
      <FormDrawer open={true} onClose={() => {}}>
        <FormDrawer.Body>x</FormDrawer.Body>
      </FormDrawer>,
    );
    const panel = container.querySelector('.fixed.inset-y-0') as HTMLElement;
    expect(panel.className).toContain('max-w-lg');
    expect(panel.className).toContain('bg-surface');
    expect(panel.className).toContain('border-l');
  });

  it('matches canonical snapshot', () => {
    const { container } = renderWithProviders(
      <FormDrawer open={true} onClose={() => {}}>
        <FormDrawer.Header title="Edit NPC" onClose={() => {}} />
        <FormDrawer.Body>
          <label>Name</label>
          <input />
        </FormDrawer.Body>
        <FormDrawer.Footer
          onCancel={() => {}}
          onSave={() => {}}
          cancelLabel="Cancel"
          saveLabel="Save"
        />
      </FormDrawer>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('FormDrawer.Header', () => {
  it('renders title in an h2', () => {
    renderWithProviders(<FormDrawer.Header title="Edit NPC" onClose={() => {}} />);
    const heading = screen.getByRole('heading', { level: 2, name: 'Edit NPC' });
    expect(heading).toHaveClass('font-headline', 'text-xl', 'font-bold');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(<FormDrawer.Header title="t" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('FormDrawer.Body', () => {
  it('renders children with default layout classes', () => {
    const { container } = renderWithProviders(
      <FormDrawer.Body>
        <p>hi</p>
      </FormDrawer.Body>,
    );
    const body = container.firstChild as HTMLElement;
    expect(body.className).toContain('flex-1');
    expect(body.className).toContain('overflow-y-auto');
    expect(body.className).toContain('px-8');
    expect(body.className).toContain('space-y-5');
  });

  it('appends custom className without dropping base classes', () => {
    const { container } = renderWithProviders(
      <FormDrawer.Body className="extra-class">
        <p>hi</p>
      </FormDrawer.Body>,
    );
    const body = container.firstChild as HTMLElement;
    expect(body.className).toContain('flex-1');
    expect(body.className).toContain('extra-class');
  });
});

describe('FormDrawer.Footer', () => {
  it('renders default Cancel and Save labels from i18n', () => {
    renderWithProviders(
      <FormDrawer.Footer onCancel={() => {}} onSave={() => {}} />,
    );
    // test i18n returns the key itself
    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
    // save button's accessible name includes the icon text "save" + label "save"
    expect(screen.getByRole('button', { name: /save/ })).toBeInTheDocument();
  });

  it('accepts custom cancel/save labels', () => {
    renderWithProviders(
      <FormDrawer.Footer
        onCancel={() => {}}
        onSave={() => {}}
        cancelLabel="Nevermind"
        saveLabel="Create NPC"
      />,
    );
    expect(screen.getByRole('button', { name: 'Nevermind' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create NPC/ })).toBeInTheDocument();
  });

  it('calls onCancel and onSave', () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    renderWithProviders(
      <FormDrawer.Footer
        onCancel={onCancel}
        onSave={onSave}
        cancelLabel="Cancel"
        saveLabel="Save"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables save button when saveDisabled is true', () => {
    renderWithProviders(
      <FormDrawer.Footer
        onCancel={() => {}}
        onSave={() => {}}
        saveDisabled
        cancelLabel="Cancel"
        saveLabel="Save"
      />,
    );
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
  });

  it('disables save button when saving is true', () => {
    renderWithProviders(
      <FormDrawer.Footer
        onCancel={() => {}}
        onSave={() => {}}
        saving
        cancelLabel="Cancel"
        saveLabel="Save"
      />,
    );
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
  });

  it('shows spinner icon when saving', () => {
    const { container } = renderWithProviders(
      <FormDrawer.Footer
        onCancel={() => {}}
        onSave={() => {}}
        saving
        cancelLabel="Cancel"
        saveLabel="Save"
      />,
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
