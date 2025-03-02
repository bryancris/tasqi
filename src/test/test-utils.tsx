
import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook as originalRenderHook, RenderHookOptions } from '@testing-library/react-hooks';

// Create a wrapper with the necessary providers
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });
}

export function createWrapper() {
  const queryClient = createTestQueryClient();
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderHook<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>
) {
  if (!options) {
    options = { wrapper: createWrapper() };
  } else if (!options.wrapper) {
    options.wrapper = createWrapper();
  }
  
  return originalRenderHook(callback, options);
}
