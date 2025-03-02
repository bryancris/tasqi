import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useChatSubmission } from '../use-chat-submission';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/components/chat/types';

// Create a mock for toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/components/notifications/NotificationsManager', () => ({
  useNotifications: () => ({
    showNotification: vi.fn(),
    notifications: [],
    dismissNotification: vi.fn(),
    dismissGroup: vi.fn(),
    isSubscribed: true,
    hasPermission: true,
    subscribe: vi.fn()
  })
}));

describe('useChatSubmission', () => {
  // Create all necessary mocks
  const mockAddUserMessage = vi.fn().mockReturnValue({ content: 'User message', isUser: true });
  const mockSetMessage = vi.fn();
  const mockSetIsLoading = vi.fn();
  const mockAddLoadingMessage = vi.fn();
  const mockProcessMessage = vi.fn().mockResolvedValue({ response: 'AI response' });
  const mockRemoveLastMessage = vi.fn();
  const mockAddAIMessage = vi.fn();
  const mockHandleTimerResponse = vi.fn().mockResolvedValue(undefined);
  const mockHandleTimerRelatedResponse = vi.fn().mockResolvedValue(undefined);
  const mockRefreshLists = vi.fn().mockResolvedValue(undefined);
  const mockToast = { error: vi.fn() };
  
  const mockEvent = {
    preventDefault: vi.fn()
  } as unknown as React.FormEvent;

  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default auth response
    vi.mocked(supabase.auth).getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
  });

  it('should call preventDefault on the event', async () => {
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
    
    await result.current(mockEvent, 'Test message');
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not proceed if the message is empty', async () => {
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
    
    expect(mockAddUserMessage).not.toHaveBeenCalled();
    expect(mockSetIsLoading).not.toHaveBeenCalled();
    expect(mockAddLoadingMessage).not.toHaveBeenCalled();
  });

  it('should add user message, set message, and set loading state', async () => {
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
    
    await result.current(mockEvent, 'Test message');
    
    expect(mockAddUserMessage).toHaveBeenCalledWith('Test message');
    expect(mockSetMessage).toHaveBeenCalledWith('');
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockAddLoadingMessage).toHaveBeenCalled();
  });

  it('should call processMessage with the user message', async () => {
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
    
    await result.current(mockEvent, 'Test message');
    
    expect(mockProcessMessage).toHaveBeenCalledWith({ content: 'User message', isUser: true });
  });

  it('should add AI message and remove loading message on successful response', async () => {
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
    
    await result.current(mockEvent, 'Test message');
    
    expect(mockRemoveLastMessage).toHaveBeenCalled();
    expect(mockAddAIMessage).toHaveBeenCalledWith('AI response');
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('should handle errors and display a toast', async () => {
    // Mock processMessage to reject
    mockProcessMessage.mockRejectedValue(new Error('Async error'));
    
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
    
    await result.current(mockEvent, 'Test message');
    
    expect(mockRemoveLastMessage).toHaveBeenCalled();
    expect(mockAddAIMessage).toHaveBeenCalledWith("Sorry, I encountered an error processing your message. Please try again later.");
    expect(mockToast.error).toHaveBeenCalledWith("Failed to process message. Please try again.");
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });
});
