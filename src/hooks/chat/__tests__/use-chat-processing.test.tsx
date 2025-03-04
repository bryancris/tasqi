
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { act } from '../../../test/test-utils';
import { useChatProcessing } from '../use-chat-processing';
import { supabase } from '@/integrations/supabase/client';

// Create mocks for dependencies
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

vi.mock('../use-task-detection', () => ({
  useTaskDetection: () => ({
    isTaskRelated: vi.fn().mockReturnValue(false),
    processAsTask: vi.fn().mockResolvedValue({ success: false }),
    hasTaskConfirmation: vi.fn().mockReturnValue(false),
    tryExtractTaskFromResponse: vi.fn().mockResolvedValue({ success: false })
  })
}));

vi.mock('../use-server-communication', () => ({
  useServerCommunication: () => ({
    invokeProcessChat: vi.fn().mockResolvedValue({ response: 'AI response' })
  })
}));

vi.mock('../use-message-error-handling', () => ({
  useMessageErrorHandling: () => ({
    handleNetworkError: vi.fn().mockImplementation(error => error)
  })
}));

vi.mock('@tanstack/react-query', () => ({
  ...vi.importActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}));

describe('useChatProcessing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default auth response
    vi.mocked(supabase.auth).getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
  });

  it('should process a regular message', async () => {
    const mockInvokeProcessChat = vi.fn().mockResolvedValue({ response: 'AI response' });
    vi.mocked(require('../use-server-communication').useServerCommunication).mockReturnValue({
      invokeProcessChat: mockInvokeProcessChat
    });
    
    const { result } = renderHook(() => useChatProcessing());
    
    const response = await result.current.processMessage({ content: 'Hello AI', isUser: true });
    
    expect(mockInvokeProcessChat).toHaveBeenCalledWith('Hello AI', 'test-user-id');
    expect(response).toEqual({ response: 'AI response' });
  });

  it('should throw an error when no user is authenticated', async () => {
    vi.mocked(supabase.auth).getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null
    });
    
    const { result } = renderHook(() => useChatProcessing());
    
    await expect(result.current.processMessage({ content: 'Hello AI', isUser: true }))
      .rejects.toThrow('Authentication required');
  });
});
