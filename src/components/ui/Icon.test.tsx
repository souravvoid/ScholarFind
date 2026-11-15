import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
// @ts-ignore - screen is a runtime export but missing from v16 type defs
import { screen } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders a decorative icon hidden from assistive tech by default', () => {
    const { container } = render(<Icon name="saved" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes an accessible label when one is provided', () => {
    render(<Icon name="saved" label="Save scholarship" />);
    expect(screen.getByRole('img', { name: 'Save scholarship' })).toBeInTheDocument();
  });
});
