
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useChatSubmission } from '../use-chat-submission';
import { supabase } from '@/integrations/supabase/client';

describe('useChatSubmission', () => {
  // Create mock functions for all dependencies
  const mockAddUserMessage = vi.fn().mockReturnValue({ content: 'User message', isUser: true });
  const mockSetMessage = vi.fn();
  const mockSetIsLoading = vi.fn();
  const mockAddLoadingMessage = vi.fn();
  const mockProcessMessage = vi.fn().mockResolvedValue({ response: 'AI response' });
  const mockRemoveLastMessage = vi.fn();
  const mockAddAIMessage = vi.fn();
  const mockHandleTimerResponse = vi.fn();
  const mockHandleTimerRelatedResponse = vi.fn();
  const mockRefreshLists = vi.fn();
  const mockToast = vi.fn();
  const mockNavigator = vi.fn();
  const mockSupabase = vi.mocked(supabase);
  const mockShowNotification = vi.fn();
  
  // Mock React FormEvent
  const mockEvent = {
    preventDefault: vi.fn()
  } as unknown as React.FormEvent;
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default auth response
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    // Mock the notifications module
    vi.mock('@/components/notifications/NotificationsManager', () => ({
      useNotifications: () => ({
        showNotification: mockShowNotification
      })
    }));
    
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  it('should handle basic message submission', async () => {
    const { result } = renderHook(() => useChatSubmission(
      mockAddUserMessage,
      mockSetMessage,
      mockSetIsLoading,
      mockAddLoadingMessage,
      mockProcessMessage,
      mockRemoveLastMessage,
      mockAddAIMessage,
      mockHandleTimerResponse,
      mockHandleTimerRelatedResponse,
      mockRefreshLists,
      mockToast
    ));
    
    await result.current(mockEvent, 'Hello AI');
    
    // Check if functions were called in the correct order with right params
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockAddUserMessage).toHaveBeenCalledWith('Hello AI');
    expect(mockSetMessage).toHaveBeenCalledWith('');
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockAddLoadingMessage).toHaveBeenCalled();
    expect(mockProcessMessage).toHaveBeenCalledWith({ content: 'User message', isUser: true });
    expect(mockRemoveLastMessage).toHaveBeenCalled();
    expect(mockAddAIMessage).toHaveBeenCalledWith('AI response');
    expect(mockRefreshLists).toHaveBeenCalled();
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('should not process empty messages', async () => {
    const { result } = renderHook(() => useChatSubmission(
      mockAddUserMessage,
      mockSetMessage,
      mockSetIsLoading,
      mockAddLoadingMessage,
      mockProcessMessage,
      mockRemoveLastMessage,
      mockAddAIMessage,
      mockHandleTimerResponse,
      mockHandleTimerRelatedResponse,
      mockRefreshLists,
      mockToast
    ));
    
    await result.current(mockEvent, '   ');
    
    // Only preventDefault should be called
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockAddUserMessage).not.toHaveBeenCalled();
    expect(mockSetIsLoading).not.toHaveBeenCalled();
  });

  it('should handle authentication errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });
    
    const { result } = renderHook(() => useChatSubmission(
      mockAddUserMessage,
      mockSetMessage,
      mockSetIsLoading,
      mockAddLoadingMessage,
      mockProcessMessage,
      mockRemoveLastMessage,
      mockAddAIMessage,
      mockHandleTimerResponse,
      mockHandleTimerRelatedResponse,
      mockRefreshLists,
      mockToast
    ));
    
    await result.current(mockEvent, 'Hello AI');
    
    // Should show authentication error
    expect(mockToast).toHaveBeenCalledWith({
      title: "Authentication Error",
      description: expect.stringContaining("sign in"),
      variant: "destructive",
    });
    
    // Should not process the message
    expect(mockProcessMessage).not.toHaveBeenCalled();
  });

  it('should handle timer-related responses', async () => {
    // Mock a timer response
    mockProcessMessage.mockResolvedValue({
      response: 'Timer set',
      timer: { action: 'created', duration: 5 }
    });
    
    const { result } = renderHook(() => useChatSubmission(
      mockAddUserMessage,
      mockSetMessage,
      mockSetIsLoading,
      mockAddLoadingMessage,
      mockProcessMessage,
      mockRemoveLastMessage,
      mockAddAIMessage,
      mockHandleTimerResponse,
      mockHandleTimerRelatedResponse,
      mockRefreshLists,
      mockToast
    ));
    
    await result.current(mockEvent, 'set a 5 minute timer');
    
    // Should process timer response
    expect(mockHandleTimerResponse).toHaveBeenCalledWith({ action: 'created', duration: 5 });
  });

  it('should handle response containing timer phrases', async () => {
    // Mock a response with timer phrases
    mockProcessMessage.mockResolvedValue({
      response: 'Your timer is complete'
    });
    
    const { result } = renderHook(() => useChatSubmission(
      mockAddUserMessage,
      mockSetMessage,
      mockSetIsLoading,
      mockAddLoadingMessage,
      mockProcessMessage,
      mockRemoveLastMessage,
      mockAddAIMessage,
      mockHandleTimerResponse,
      mockHandleTimerRelatedResponse,
      mockRefreshLists,
      mockToast
    ));
    
    await result.current(mockEvent, 'What happened to my timer?');
    
    // Should process timer-related response
    expect(mockHandleTimerRelatedResponse).toHaveBeenCalledWith('Your timer is complete');
  });

  it('should handle offline state', async () => {
    // Mock navigator.onLine as false
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    const { result } = renderHook(() => useChatSubmission(
      mockAddUserMessage,
      mockSetMessage,
      mockSetIsLoading,
      mockAddLoadingMessage,
      mockProcessMessage,
      mockRemoveLastMessage,
      mockAddAIMessage,
      mockHandleTimerResponse,
      mockHandleTimerRelatedResponse,
      mockRefreshLists,
      mockToast
    ));
    
    await result.current(mockEvent, 'Hello AI');
    
    // Should add error message
    expect(mockAddAIMessage).toHaveBeenCalledWith(expect.stringContaining("trouble connecting"));
    expect(mockProcessMessage).not.toHaveBeenCalled();
  });

  it('should handle errors in processMessage', async () => {
    // Mock processMessage to throw an error
    mockProcessMessage.mockRejectedValue(new Error('Processing error'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useChatSubmission(
      mockAddUserMessage,
      mockSetMessage,
      mockSetIsLoading,
      mockAddLoadingMessage,
      mockProcessMessage,
      mockRemoveLastMessage,
      mockAddAIMessage,
      mockHandleTimerResponse,
      mockHandleTimerRelatedResponse,
      mockRefreshLists,
      mockToast
    ));
    
    await result.current(mockEvent, 'Hello AI');
    
    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith('Error processing message:', expect.any(Error));
    
    // Should add error message
    expect(mockAddAIMessage).toHaveBeenCalledWith(expect.stringContaining("encountered an error"));
    
    // Should show error toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: expect.stringContaining("Failed to process message"),
      variant: "destructive",
    });
    
    // Should set isLoading to false
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    
    consoleSpy.mockRestore();
  });
});
