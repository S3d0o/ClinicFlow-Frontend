import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PreviewRibbon } from './PreviewRibbon';

describe('PreviewRibbon', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('marks the public preview build as sample data', () => {
    vi.stubEnv('VITE_PREVIEW', 'true');
    render(<PreviewRibbon />);
    expect(screen.getByRole('note')).toHaveTextContent('Preview: sample data, not the live app');
  });

  it('shows nothing in other builds', () => {
    vi.stubEnv('VITE_PREVIEW', '');
    const { container } = render(<PreviewRibbon />);
    expect(container).toBeEmptyDOMElement();
  });
});
