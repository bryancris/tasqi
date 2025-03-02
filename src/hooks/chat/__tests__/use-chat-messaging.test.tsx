import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { act } from '../../../test/test-utils';
import { useChatMessaging } from '../use-chat-messaging';
import { supabase } from '@/integrations/supabase/client';

// Create mocks for dependencies
vi.mock('../use-message-state', () => ({
  useMessageState: () => ({
    message: 'Test message',
    messages: [],
    setMessage: vi.fn(),
    addUserMessage: vi.fn().mockReturnValue({ content: 'User message', isUser: true }),
    addAIMessage: vi.fn(),
    addLoadingMessage: vi.fn(),
    removeLastMessage: vi.fn(),
    resetMessages: vi.fn(),
    setMessages: vi.fn()
  })
}));

vi.mock('../use-loading-state', () => ({
  useLoadingState: () => ({
    isLoading: false,
    setIsLoading: vi.fn()
  })
}));

vi.mock('../use-network-detection', () => ({
  useNetworkDetection: () => ({
    isNetworkAvailable: vi.fn().mockReturnValue(true)
  })
}));

vi.mock('../use-timer-detection', () => ({
  useTimerDetection: () => ({
    detectTimerRequest: vi.fn().mockReturnValue({ timerMatch: false }),
    createClientSideTimerResponse: vi.fn(),
    refreshTimerData: vi.fn()
  })
}));

vi.mock('../use-server-communication', () => ({
  useServerCommunication: () => ({
    invokeProcessChat: vi.fn().mockResolvedValue({ response: 'AI response' })
  })
}));

// Create a mock for toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useChatMessaging', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default auth response
    vi.mocked(supabase.auth).getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
  });

  it('should initialize properly', () => {
    const { result } = renderHook(() => useChatMessaging());
    
    expect(result.current).toHaveProperty('message');
    expect(result.current).toHaveProperty('messages');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('processMessage');
    expect(result.current).toHaveProperty('setIsLoading');
  });

  it('should process a regular message', async () => {
    const mockInvokeProcessChat = vi.fn().mockResolvedValue({ response: 'AI response' });
    vi.mocked(require('../use-server-communication').useServerCommunication).mockReturnValue({
      invokeProcessChat: mockInvokeProcessChat
    });
    
    const { result } = renderHook(() => useChatMessaging());
    
    const response = await result.current.processMessage({ content: 'Hello AI', isUser: true });
    
    expect(mockInvokeProcessChat).toHaveBeenCalledWith('Hello AI', 'test-user-id');
    expect(response).toEqual({ response: 'AI response' });
  });

  it('should throw an error when no user is authenticated', async () => {
    vi.mocked(supabase.auth).getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null
    });
    
    const { result } = renderHook(() => useChatMessaging());
    
    await expect(result.current.processMessage({ content: 'Hello AI', isUser: true }))
      .rejects.toThrow('Authentication required');
  });

  it('should handle timer requests', async () => {
    // Mock timer detection to return true
    vi.mocked(require('../use-timer-detection').useTimerDetection).mockReturnValue({
      detectTimerRequest: vi.fn().mockReturnValue({ 
        timerMatch: true, 
        duration: 5, 
        unit: 'min' 
      }),
      createClientSideTimerResponse: vi.fn().mockReturnValue({
        response: 'Timer set for 5 minutes',
        timer: { action: 'created', duration: 5, unit: 'min' }
      }),
      refreshTimerData: vi.fn()
    });
    
    const mockInvokeProcessChat = vi.fn().mockResolvedValue({ 
      response: 'Setting a 5 minute timer',
      timer: { duration: 5, unit: 'min' }
    });
    
    vi.mocked(require('../use-server-communication').useServerCommunication).mockReturnValue({
      invokeProcessChat: mockInvokeProcessChat
    });
    
    const { result } = renderHook(() => useChatMessaging());
    
    const response = await result.current.processMessage({ content: 'set a 5 min timer', isUser: true });
    
    expect(mockInvokeProcessChat).toHaveBeenCalledWith('set a 5 min timer', 'test-user-id');
    expect(response.response).toBe('Setting a 5 minute timer');
    expect(response.timer).toEqual({ duration: 5, unit: 'min' });
  });

  it('should fall back to client-side timer when server fails', async () => {
    // Mock timer detection to return true
    const mockCreateClientSideTimerResponse = vi.fn().mockReturnValue({
      response: 'Client-side timer set for 5 minutes',
      timer: { action: 'created', duration: 5, unit: 'min' }
    });
    
    vi.mocked(require('../use-timer-detection').useTimerDetection).mockReturnValue({
      detectTimerRequest: vi.fn().mockReturnValue({ 
        timerMatch: true, 
        duration: 5, 
        unit: 'min' 
      }),
      createClientSideTimerResponse: mockCreateClientSideTimerResponse,
      refreshTimerData: vi.fn()
    });
    
    // Make the server call fail
    const mockInvokeProcessChat = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.mocked(require('../use-server-communication').useServerCommunication).mockReturnValue({
      invokeProcessChat: mockInvokeProcessChat
    });
    
    const { result } = renderHook(() => useChatMessaging());
    
    const response = await result.current.processMessage({ content: 'set a 5 min timer', isUser: true });
    
    expect(mockInvokeProcessChat).toHaveBeenCalledWith('set a 5 min timer', 'test-user-id');
    expect(mockCreateClientSideTimerResponse).toHaveBeenCalledWith(5, 'min');
    expect(response.response).toBe('Client-side timer set for 5 minutes');
  });

  it('should throw an error when offline and not a timer request', async () => {
    // Mock network detection to return false
    vi.mocked(require('../use-network-detection').useNetworkDetection).mockReturnValue({
      isNetworkAvailable: vi.fn().mockReturnValue(false)
    });
    
    // Mock timer detection to return false
    vi.mocked(require('../use-timer-detection').useTimerDetection).mockReturnValue({
      detectTimerRequest: vi.fn().mockReturnValue({ timerMatch: false }),
      createClientSideTimerResponse: vi.fn(),
      refreshTimerData: vi.fn()
    });
    
    const { result } = renderHook(() => useChatMessaging());
    
    await expect(result.current.processMessage({ content: 'Hello AI', isUser: true }))
      .rejects.toThrow('You are currently offline. Please check your internet connection.');
  });
});
