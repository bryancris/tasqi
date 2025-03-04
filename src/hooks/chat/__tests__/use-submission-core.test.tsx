
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { SubmissionHelpers } from '../submission/types';
import { useSubmissionCore } from '../submission/use-submission-core';
import { supabase } from '@/integrations/supabase/client';

// Create a mock for showNotification
vi.mock('@/components/notifications/NotificationsManager', () => ({
  useNotifications: () => ({
    showNotification: vi.fn()
  })
}));

// Create mocks for our specialized hooks
vi.mock('../submission/use-task-creation', () => ({
  useTaskCreation: () => vi.fn().mockResolvedValue({ success: false })
}));

vi.mock('../submission/use-timer-handling', () => ({
  useTimerHandling: () => vi.fn().mockResolvedValue({ handled: false })
}));

vi.mock('../submission/use-error-handling', () => ({
  useErrorHandling: () => vi.fn().mockReturnValue({ errorMessage: 'Mock error' })
}));

describe('useSubmissionCore', () => {
  // Create all necessary mocks
  const mockHelpers: SubmissionHelpers = {
    addUserMessage: vi.fn().mockReturnValue({ content: 'User message', isUser: true }),
    setMessage: vi.fn(),
    setIsLoading: vi.fn(),
    addLoadingMessage: vi.fn(),
    processMessage: vi.fn().mockResolvedValue({ response: 'AI response' }),
    removeLastMessage: vi.fn(),
    addAIMessage: vi.fn(),
    handleTimerResponse: vi.fn().mockResolvedValue(undefined),
    handleTimerRelatedResponse: vi.fn().mockResolvedValue(undefined),
    refreshLists: vi.fn().mockResolvedValue(undefined),
    toast: { error: vi.fn() }
  };
  
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
    
    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => true
    });
  });

  it('should call preventDefault on the event', async () => {
    const { result } = renderHook(() => useSubmissionCore(mockHelpers));
    
    await result.current(mockEvent, 'Test message');
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not proceed if the message is empty', async () => {
    const { result } = renderHook(() => useSubmissionCore(mockHelpers));
    
    await result.current(mockEvent, '   ');
    
    expect(mockHelpers.addUserMessage).not.toHaveBeenCalled();
  });

  it('should process a regular message successfully', async () => {
    const { result } = renderHook(() => useSubmissionCore(mockHelpers));
    
    await result.current(mockEvent, 'Test message');
    
    expect(mockHelpers.addUserMessage).toHaveBeenCalledWith('Test message');
    expect(mockHelpers.setMessage).toHaveBeenCalledWith('');
    expect(mockHelpers.addLoadingMessage).toHaveBeenCalled();
    expect(mockHelpers.processMessage).toHaveBeenCalledWith({ content: 'User message', isUser: true });
    expect(mockHelpers.removeLastMessage).toHaveBeenCalled();
    expect(mockHelpers.addAIMessage).toHaveBeenCalledWith('AI response');
  });

  it('should check for user authentication', async () => {
    // Mock auth failure
    vi.mocked(supabase.auth).getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null
    });
    
    const { result } = renderHook(() => useSubmissionCore(mockHelpers));
    
    await result.current(mockEvent, 'Test message');
    
    expect(mockHelpers.setIsLoading).toHaveBeenCalledWith(false);
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ 
        detail: expect.objectContaining({ error: expect.stringContaining('sign in') }) 
      })
    );
  });

  it('should handle offline mode', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => false
    });
    
    const { result } = renderHook(() => useSubmissionCore(mockHelpers));
    
    await result.current(mockEvent, 'Test message');
    
    expect(mockHelpers.removeLastMessage).toHaveBeenCalled();
    expect(mockHelpers.addAIMessage).toHaveBeenCalledWith(
      expect.stringContaining('internet connection')
    );
  });
});
