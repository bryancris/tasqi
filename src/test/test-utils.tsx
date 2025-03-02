
import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-hooks';
import type { RenderHookOptions, RenderHookResult } from '@testing-library/react-hooks';

// Create a wrapper with the necessary providers
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // cacheTime has been renamed to gcTime in v5
        gcTime: 0,
      },
    },
  });
}

export function createWrapper() {
  const queryClient = createTestQueryClient();
  
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// Export renderHook with a properly typed wrapper
export function renderHook<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'> & { wrapper?: React.ComponentType<any> }
): RenderHookResult<TProps, TResult> {
  if (!options) {
    options = {};
  }
  
  if (!options.wrapper) {
    options.wrapper = createWrapper();
  }
  
  return originalRenderHook(callback, options as RenderHookOptions<TProps>);
}

// Export act from the testing library
export { act };
