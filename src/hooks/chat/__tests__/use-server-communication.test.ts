
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useServerCommunication } from '../use-server-communication';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';

describe('useServerCommunication', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mock for supabase functions.invoke
    vi.mocked(supabase.functions).invoke = vi.fn().mockResolvedValue({
      data: { response: 'AI response' },
      error: null
    });
  });

  it('should invoke the process-chat function', async () => {
    const { result } = renderHook(() => useServerCommunication());
    
    const response = await result.current.invokeProcessChat('Hello AI', 'user-123');
    
    expect(vi.mocked(supabase.functions).invoke).toHaveBeenCalledWith('process-chat', {
      body: { message: 'Hello AI', userId: 'user-123' }
    });
    
    expect(response).toEqual({ response: 'AI response' });
  });

  it('should handle timer data and refresh the query', async () => {
    const mockInvalidateQueries = vi.fn();
    vi.mock('@tanstack/react-query', () => ({
      useQueryClient: () => ({
        invalidateQueries: mockInvalidateQueries
      })
    }));
    
    // Setup mock to return timer data
    vi.mocked(supabase.functions).invoke = vi.fn().mockResolvedValue({
      data: { 
        response: 'Timer set', 
        timer: { duration: 5, unit: 'min' } 
      },
      error: null
    });
    
    const { result } = renderHook(() => useServerCommunication());
    
    const response = await result.current.invokeProcessChat('Set a timer', 'user-123');
    
    expect(vi.mocked(supabase.functions).invoke).toHaveBeenCalledWith('process-chat', {
      body: { message: 'Set a timer', userId: 'user-123' }
    });
    
    // Wait for setTimeout to execute
    await new Promise(resolve => setTimeout(resolve, 400));
    
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['timers'] });
    expect(response).toEqual({ 
      response: 'Timer set', 
      timer: { duration: 5, unit: 'min' } 
    });
  });

  it('should handle function errors', async () => {
    // Setup mock to return an error
    vi.mocked(supabase.functions).invoke = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Function error')
    });
    
    const { result } = renderHook(() => useServerCommunication());
    
    await expect(result.current.invokeProcessChat('Hello', 'user-123')).rejects.toThrow('Function error');
  });

  it('should handle network errors', async () => {
    // Setup mock to reject with a network error
    vi.mocked(supabase.functions).invoke = vi.fn().mockRejectedValue(
      new TypeError('Failed to fetch')
    );
    
    const { result } = renderHook(() => useServerCommunication());
    
    await expect(result.current.invokeProcessChat('Hello', 'user-123')).rejects.toThrow(
      'The server is currently unavailable'
    );
  });

  it('should handle CORS errors', async () => {
    // Setup mock to reject with a CORS error
    vi.mocked(supabase.functions).invoke = vi.fn().mockRejectedValue(
      new Error('CORS policy prevented the request')
    );
    
    const { result } = renderHook(() => useServerCommunication());
    
    await expect(result.current.invokeProcessChat('Hello', 'user-123')).rejects.toThrow(
      'The server is currently unavailable'
    );
  });
});
