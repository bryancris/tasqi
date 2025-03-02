
import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Create a mock supabase client 
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { 
          user: { id: 'test-user-id' } 
        },
        error: null
      }),
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback => callback({
        data: [],
        error: null
      })),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
        list: vi.fn(),
        remove: vi.fn(),
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { response: 'Mocked AI response' },
        error: null
      }),
    },
    rpc: vi.fn().mockResolvedValue({
      data: null,
      error: null
    }),
  }
}));

// Mock navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock the QueryClient
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock window.setTimeout
vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
  if (typeof callback === 'function') callback();
  return 1 as any;
});

// For testing audio functionality
HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();

// Set up MSW server for mock API responses
export const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
