
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useServerCommunication } from '../use-server-communication';
import { supabase } from '@/integrations/supabase/client';

// Create a mock for the supabase client
const mockSupabase = vi.mocked(supabase);

describe('useServerCommunication', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup a default successful response
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { response: 'Mocked AI response' },
      error: null
    });
  });

  it('should call supabase function with correct parameters', async () => {
    const { result } = renderHook(() => useServerCommunication());
    
    await result.current.invokeProcessChat('Hello AI', 'test-user-id');
    
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('process-chat', {
      body: { message: 'Hello AI', userId: 'test-user-id' }
    });
  });

  it('should return the response data on success', async () => {
    const mockResponse = { response: 'AI response', timer: { duration: 5 } };
    mockSupabase.functions.invoke.mockResolvedValue({
      data: mockResponse,
      error: null
    });
    
    const { result } = renderHook(() => useServerCommunication());
    
    const response = await result.current.invokeProcessChat('Set a timer', 'test-user-id');
    
    expect(response).toEqual(mockResponse);
  });

  it('should invalidate timers query when timer data is present', async () => {
    const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
    vi.mocked(require('@tanstack/react-query').useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries
    });
    
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { response: 'Timer set', timer: { duration: 5 } },
      error: null
    });
    
    const { result } = renderHook(() => useServerCommunication());
    
    await result.current.invokeProcessChat('Set a timer', 'test-user-id');
    
    // With our mocked setTimeout, this should be called immediately
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['timers'] });
  });

  it('should throw an error when the function call fails', async () => {
    const mockError = new Error('Function error');
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: mockError
    });
    
    const { result } = renderHook(() => useServerCommunication());
    
    await expect(result.current.invokeProcessChat('Hello AI', 'test-user-id'))
      .rejects.toThrow('Function error');
  });

  it('should handle CORS and network errors', async () => {
    // Test TypeError: Failed to fetch
    mockSupabase.functions.invoke.mockRejectedValue(new TypeError('Failed to fetch'));
    
    const { result } = renderHook(() => useServerCommunication());
    
    await expect(result.current.invokeProcessChat('Hello AI', 'test-user-id'))
      .rejects.toThrow('The server is currently unavailable. Please try again later.');
    
    // Test CORS error
    mockSupabase.functions.invoke.mockRejectedValue(new Error('CORS policy prevented access'));
    
    await expect(result.current.invokeProcessChat('Hello AI', 'test-user-id'))
      .rejects.toThrow('The server is currently unavailable. Please try again later.');
  });
});
