
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useChatNotifications } from '../use-chat-notifications';

// Mock the imported hooks
vi.mock('../use-debounced-refresh', () => ({
  useDebouncedRefresh: () => ({
    debouncedRefresh: vi.fn(),
    isMountedRef: { current: true }
  })
}));

vi.mock('../use-timer-management', () => ({
  useTimerManagement: () => ({
    handleTimerResponse: vi.fn(),
    timerPhrasesDetectedRef: { current: new Set() }
  })
}));

vi.mock('../use-response-handling', () => ({
  useResponseHandling: () => ({
    handleTimerRelatedResponse: vi.fn()
  })
}));

describe('useChatNotifications', () => {
  let debouncedRefreshMock: any;
  const originalTimeout = global.setTimeout;
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mock for debouncedRefresh
    debouncedRefreshMock = vi.fn();
    vi.mocked(require('../use-debounced-refresh').useDebouncedRefresh).mockReturnValue({
      debouncedRefresh: debouncedRefreshMock,
      isMountedRef: { current: true }
    });
    
    // Mock setTimeout to track calls but not actually delay
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any, _timeout?: number) => {
      if (typeof callback === 'function') callback();
      return 1 as any;
    });
  });
  
  afterEach(() => {
    global.setTimeout = originalTimeout;
  });

  it('should initialize properly', () => {
    const { result } = renderHook(() => useChatNotifications());
    
    expect(result.current).toHaveProperty('handleTimerResponse');
    expect(result.current).toHaveProperty('handleTimerRelatedResponse');
    expect(result.current).toHaveProperty('refreshLists');
  });

  it('should refresh lists when called', async () => {
    const { result } = renderHook(() => useChatNotifications());
    
    await result.current.refreshLists();
    
    // Should call debouncedRefresh for each list with different delays
    expect(debouncedRefreshMock).toHaveBeenCalledWith(['tasks'], 500);
    expect(debouncedRefreshMock).toHaveBeenCalledWith(['notifications'], 800);
    expect(debouncedRefreshMock).toHaveBeenCalledWith(['timers'], 1000);
  });

  it('should not refresh when component is unmounted', async () => {
    // Mock the isMountedRef as false (unmounted)
    vi.mocked(require('../use-debounced-refresh').useDebouncedRefresh).mockReturnValue({
      debouncedRefresh: debouncedRefreshMock,
      isMountedRef: { current: false }
    });
    
    const { result } = renderHook(() => useChatNotifications());
    
    await result.current.refreshLists();
    
    // Should not call debouncedRefresh when unmounted
    expect(debouncedRefreshMock).not.toHaveBeenCalled();
  });

  it('should expose the delegated methods from other hooks', () => {
    const mockHandleTimerResponse = vi.fn();
    const mockHandleTimerRelatedResponse = vi.fn();
    
    vi.mocked(require('../use-timer-management').useTimerManagement).mockReturnValue({
      handleTimerResponse: mockHandleTimerResponse,
      timerPhrasesDetectedRef: { current: new Set() }
    });
    
    vi.mocked(require('../use-response-handling').useResponseHandling).mockReturnValue({
      handleTimerRelatedResponse: mockHandleTimerRelatedResponse
    });
    
    const { result } = renderHook(() => useChatNotifications());
    
    // The hook should expose these methods directly
    expect(result.current.handleTimerResponse).toBe(mockHandleTimerResponse);
    expect(result.current.handleTimerRelatedResponse).toBe(mockHandleTimerRelatedResponse);
  });
});
