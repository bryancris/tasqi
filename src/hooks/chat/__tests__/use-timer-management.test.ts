
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useTimerManagement } from '../use-timer-management';
import { useNotifications } from '@/components/notifications/NotificationsManager';
import { playNotificationSound } from '@/utils/notifications/soundUtils';

// Mock dependencies
vi.mock('@/components/notifications/NotificationsManager', () => ({
  useNotifications: vi.fn().mockReturnValue({
    showNotification: vi.fn().mockResolvedValue(undefined)
  })
}));

vi.mock('@/utils/notifications/soundUtils', () => ({
  playNotificationSound: vi.fn().mockResolvedValue(undefined)
}));

describe('useTimerManagement', () => {
  const mockShowNotification = vi.fn().mockResolvedValue(undefined);
  const mockPlaySound = vi.fn().mockResolvedValue(undefined);
  const mockDebouncedRefresh = vi.fn();
  const isMountedRef = { current: true };
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mocks for each test
    vi.mocked(useNotifications).mockReturnValue({
      showNotification: mockShowNotification
    });
    
    vi.mocked(playNotificationSound).mockImplementation(mockPlaySound);
  });

  it('should initialize properly', () => {
    const { result } = renderHook(() => useTimerManagement(mockDebouncedRefresh, isMountedRef));
    
    expect(result.current).toHaveProperty('handleTimerResponse');
    expect(result.current).toHaveProperty('timerPhrasesDetectedRef');
    expect(result.current.timerPhrasesDetectedRef.current).toBeInstanceOf(Set);
  });

  it('should handle created timer response', async () => {
    const { result } = renderHook(() => useTimerManagement(mockDebouncedRefresh, isMountedRef));
    
    const timerData = {
      action: 'created',
      label: '5 minutes',
      duration: 5,
      unit: 'min'
    };
    
    await result.current.handleTimerResponse(timerData);
    
    expect(mockPlaySound).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: "Timer Started",
      message: expect.stringContaining("Timer for 5 minutes has been started"),
      type: "info",
      persistent: false
    });
    
    // Should call debouncedRefresh with a delay
    expect(mockDebouncedRefresh).toHaveBeenCalledWith(['timers'], expect.any(Number));
  });

  it('should handle completed timer response', async () => {
    const { result } = renderHook(() => useTimerManagement(mockDebouncedRefresh, isMountedRef));
    
    const timerData = {
      action: 'completed',
      label: '5 minutes'
    };
    
    await result.current.handleTimerResponse(timerData);
    
    expect(mockPlaySound).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: "Timer Complete",
      message: expect.stringContaining("Your timer for 5 minutes is complete"),
      type: "success",
      persistent: true
    });
    
    // Should call debouncedRefresh twice (timers and notifications)
    expect(mockDebouncedRefresh).toHaveBeenCalledWith(['timers'], expect.any(Number));
  });

  it('should handle cancelled timer response', async () => {
    const { result } = renderHook(() => useTimerManagement(mockDebouncedRefresh, isMountedRef));
    
    const timerData = {
      action: 'cancelled',
      label: '5 minutes'
    };
    
    await result.current.handleTimerResponse(timerData);
    
    expect(mockPlaySound).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: "Timer Cancelled",
      message: expect.stringContaining("Your timer for 5 minutes has been cancelled"),
      type: "info",
      persistent: false
    });
    
    // Should call debouncedRefresh twice (timers and notifications)
    expect(mockDebouncedRefresh).toHaveBeenCalledWith(['timers'], expect.any(Number));
  });

  it('should ignore null/undefined timer data', async () => {
    const { result } = renderHook(() => useTimerManagement(mockDebouncedRefresh, isMountedRef));
    
    await result.current.handleTimerResponse(null as any);
    
    expect(mockPlaySound).not.toHaveBeenCalled();
    expect(mockShowNotification).not.toHaveBeenCalled();
    expect(mockDebouncedRefresh).not.toHaveBeenCalled();
  });

  it('should handle component unmount', async () => {
    const unmountedRef = { current: false };
    const { result } = renderHook(() => useTimerManagement(mockDebouncedRefresh, unmountedRef));
    
    const timerData = {
      action: 'created',
      label: '5 minutes'
    };
    
    await result.current.handleTimerResponse(timerData);
    
    expect(mockPlaySound).not.toHaveBeenCalled();
    expect(mockShowNotification).not.toHaveBeenCalled();
    expect(mockDebouncedRefresh).not.toHaveBeenCalled();
  });

  it('should handle errors in notification functions', async () => {
    mockShowNotification.mockRejectedValue(new Error('Failed to show notification'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useTimerManagement(mockDebouncedRefresh, isMountedRef));
    
    const timerData = {
      action: 'created',
      label: '5 minutes'
    };
    
    await result.current.handleTimerResponse(timerData);
    
    expect(mockPlaySound).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to show timer notification'),
      expect.any(Error)
    );
    
    // Should still try to refresh timers
    expect(mockDebouncedRefresh).toHaveBeenCalledWith(['timers'], expect.any(Number));
    
    consoleSpy.mockRestore();
  });
});
