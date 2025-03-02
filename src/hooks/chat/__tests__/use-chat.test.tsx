
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { act } from '../../../test/test-utils';
import { useChat } from '../use-chat';

// Mock all imported hooks
vi.mock('../use-chat-messaging', () => ({
  useChatMessaging: () => ({
    message: 'Test message',
    messages: [],
    isLoading: false,
    setMessage: vi.fn(),
    addUserMessage: vi.fn(),
    addAIMessage: vi.fn(),
    addLoadingMessage: vi.fn(),
    removeLastMessage: vi.fn(),
    processMessage: vi.fn(),
    setIsLoading: vi.fn(),
    toast: vi.fn(),
    setMessages: vi.fn(),
  })
}));

vi.mock('../use-chat-history', () => ({
  useChatHistory: vi.fn().mockReturnValue({
    fetchChatHistory: vi.fn()
  })
}));

vi.mock('../use-chat-notifications', () => ({
  useChatNotifications: () => ({
    handleTimerResponse: vi.fn(),
    handleTimerRelatedResponse: vi.fn(),
    refreshLists: vi.fn()
  })
}));

vi.mock('../use-chat-submission', () => ({
  useChatSubmission: vi.fn().mockReturnValue(vi.fn())
}));

describe('useChat', () => {
  const mockHandleSubmitCallback = vi.fn();
  const mockEvent = {
    preventDefault: vi.fn()
  } as unknown as React.FormEvent;
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup the mock for useChatSubmission
    vi.mocked(require('../use-chat-submission').useChatSubmission).mockReturnValue(mockHandleSubmitCallback);
  });

  it('should initialize and expose all required properties', () => {
    const { result } = renderHook(() => useChat());
    
    expect(result.current).toHaveProperty('message');
    expect(result.current).toHaveProperty('messages');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('setMessage');
    expect(result.current).toHaveProperty('handleSubmit');
    expect(result.current).toHaveProperty('fetchChatHistory');
  });

  it('should initialize useChatHistory with the correct callback', () => {
    const mockSetMessages = vi.fn();
    
    // Need to override the mock for this specific test
    vi.mocked(require('../use-chat-messaging').useChatMessaging).mockReturnValue({
      message: 'Test message',
      messages: [],
      isLoading: false,
      setMessage: vi.fn(),
      addUserMessage: vi.fn(),
      addAIMessage: vi.fn(),
      addLoadingMessage: vi.fn(),
      removeLastMessage: vi.fn(),
      processMessage: vi.fn(),
      setIsLoading: vi.fn(),
      toast: vi.fn(),
      setMessages: mockSetMessages,
    });
    
    // Use a regular function instead of a constant for the mock
    let mockChatHistorySetMessagesFn = vi.fn();
    vi.mocked(require('../use-chat-history').useChatHistory).mockImplementation(callback => {
      // Store the callback so we can test it
      mockChatHistorySetMessagesFn = callback;
      return {
        fetchChatHistory: vi.fn()
      };
    });
    
    renderHook(() => useChat());
    
    // Now let's test the callback that was passed to useChatHistory
    const testMessages = [{ content: 'test', isUser: true }];
    mockChatHistorySetMessagesFn(testMessages);
    
    expect(mockSetMessages).toHaveBeenCalledWith(testMessages);
  });

  it('should call useChatSubmission with all required dependencies', () => {
    // Create spies for all the dependencies that should be passed
    const mockMessageState = {
      message: 'Test message',
      messages: [],
      setMessage: vi.fn(),
      addUserMessage: vi.fn(),
      addAIMessage: vi.fn(),
      addLoadingMessage: vi.fn(),
      removeLastMessage: vi.fn(),
      setMessages: vi.fn(),
    };
    
    const mockChatMessaging = {
      ...mockMessageState,
      isLoading: false,
      processMessage: vi.fn(),
      setIsLoading: vi.fn(),
      toast: vi.fn(),
    };
    
    const mockChatNotifications = {
      handleTimerResponse: vi.fn(),
      handleTimerRelatedResponse: vi.fn(),
      refreshLists: vi.fn()
    };
    
    // Override the mocks with our spies
    vi.mocked(require('../use-chat-messaging').useChatMessaging).mockReturnValue(mockChatMessaging);
    vi.mocked(require('../use-chat-notifications').useChatNotifications).mockReturnValue(mockChatNotifications);
    
    renderHook(() => useChat());
    
    // Check that useChatSubmission was called with all expected args
    expect(require('../use-chat-submission').useChatSubmission).toHaveBeenCalledWith(
      mockMessageState.addUserMessage,
      mockMessageState.setMessage,
      mockChatMessaging.setIsLoading,
      mockMessageState.addLoadingMessage,
      mockChatMessaging.processMessage,
      mockMessageState.removeLastMessage,
      mockMessageState.addAIMessage,
      mockChatNotifications.handleTimerResponse,
      mockChatNotifications.handleTimerRelatedResponse,
      mockChatNotifications.refreshLists,
      mockChatMessaging.toast
    );
  });

  it('should call the handleSubmit callback with the current message', () => {
    const { result } = renderHook(() => useChat());
    
    act(() => {
      result.current.handleSubmit(mockEvent);
    });
    
    expect(mockHandleSubmitCallback).toHaveBeenCalledWith(mockEvent, 'Test message');
  });
});
