import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useChatHistory } from '../use-chat-history';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/components/chat/types';

// Create a mock for toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useChatHistory', () => {
  const mockSetMessages = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default auth response using vi.mocked
    vi.mocked(supabase.auth).getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    // Setup default chat messages response
    vi.mocked(supabase).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback => callback({
        data: [
          { content: 'User message', is_ai: false },
          { content: 'AI response', is_ai: true }
        ],
        error: null
      }))
    } as any);
  });

  it('should fetch and format chat history', async () => {
    const { result } = renderHook(() => useChatHistory(mockSetMessages));
    
    await result.current.fetchChatHistory();
    
    // Check that supabase calls were made correctly
    expect(vi.mocked(supabase).from).toHaveBeenCalledWith('chat_messages');
    // No need to check individual method calls since we've mocked the chain
    
    // Check that setMessages was called with the formatted messages
    expect(mockSetMessages).toHaveBeenCalledWith([
      { content: 'User message', isUser: true },
      { content: 'AI response', isUser: false }
    ]);
  });

  it('should handle authentication errors', async () => {
    // Override the auth mock for this specific test
    vi.mocked(supabase.auth).getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null
    });
    
    const mockToast = vi.fn();
    vi.mocked(require('@/components/ui/use-toast').useToast).mockReturnValue({
      toast: mockToast
    });
    
    const { result } = renderHook(() => useChatHistory(mockSetMessages));
    
    await result.current.fetchChatHistory();
    
    // Should not try to fetch messages
    expect(vi.mocked(supabase).from).not.toHaveBeenCalled();
    
    // Should show authentication error toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "Authentication Error",
      description: expect.stringContaining("sign in"),
      variant: "destructive",
    });
  });

  it('should handle supabase errors', async () => {
    vi.mocked(supabase).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback => callback({
        data: null,
        error: new Error('Supabase error')
      }))
    } as any);
    
    const mockToast = vi.fn();
    vi.mocked(require('@/components/ui/use-toast').useToast).mockReturnValue({
      toast: mockToast
    });
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useChatHistory(mockSetMessages));
    
    await result.current.fetchChatHistory();
    
    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching chat history:', expect.any(Error));
    
    // Should show error toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: expect.stringContaining("Failed to load chat history"),
      variant: "destructive",
    });
    
    consoleSpy.mockRestore();
  });
});
