import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement } from 'react';

/**
 * Custom render function that wraps components with necessary providers.
 * Extend this as new context providers are needed.
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };
