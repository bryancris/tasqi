
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../../test/test-utils';
import { useServerCommunicationCore } from '../use-server-communication-core';
import { supabase } from '@/integrations/supabase/client';

// Mock the error handling hook
vi.mock('../use-error-handling', () => ({
  useServerErrorHandling: () => ({
    handleServerError: vi.fn().mockImplementation((error) => {
      throw error;
    })
  })
}));

describe('useServerCommunicationCore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mock for supabase functions.invoke
    vi.mocked(supabase.functions).invoke = vi.fn().mockResolvedValue({
      data: { response: 'AI response' },
      error: null
    });
  });

  it('should invoke the process-chat function', async () => {
    const { result } = renderHook(() => useServerCommunicationCore());
    
    const response = await result.current.invokeProcessChat('Hello AI', 'user-123');
    
    expect(vi.mocked(supabase.functions).invoke).toHaveBeenCalledWith('process-chat', {
      body: { message: 'Hello AI', userId: 'user-123' }
    });
    
    expect(response).toEqual({ response: 'AI response' });
  });

  it('should handle function errors', async () => {
    // Setup mock to return an error
    vi.mocked(supabase.functions).invoke = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Function error')
    });
    
    const { result } = renderHook(() => useServerCommunicationCore());
    
    await expect(result.current.invokeProcessChat('Hello', 'user-123')).rejects.toThrow('Function error');
  });
});
