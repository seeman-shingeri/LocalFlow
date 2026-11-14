import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary';

const FaultyComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Simulated component rendering crash');
  }
  return <div>Normal Content Loaded Successfully</div>;
};

describe('Enterprise Global Error Boundary (GlobalErrorBoundary)', () => {
  it('renders children properly when no errors are thrown', () => {
    render(
      <GlobalErrorBoundary>
        <FaultyComponent shouldThrow={false} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Normal Content Loaded Successfully')).toBeInTheDocument();
  });

  it('catches render errors and displays sanitized fallback UI with incident reference', () => {
    // Suppress React boundary console.error during test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <GlobalErrorBoundary>
        <FaultyComponent shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText(/Incident Reference:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('resets error state when clicking Try Again', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let hasFailed = true;

    const DynamicComponent: React.FC = () => {
      if (hasFailed) {
        throw new Error('Initial fail');
      }
      return <div>Recovered Successfully</div>;
    };

    render(
      <GlobalErrorBoundary onReset={() => { hasFailed = false; }}>
        <DynamicComponent />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();

    // Trigger reset
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    expect(screen.getByText('Recovered Successfully')).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
