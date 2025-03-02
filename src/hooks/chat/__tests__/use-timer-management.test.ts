
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useTimerManagement } from '../use-timer-management';
import { NotificationsContextType } from '@/components/notifications/types';

// Mock the notifications context
vi.mock('@/components/notifications/NotificationsManager', () => ({
  useNotifications: () => ({
    showNotification: vi.fn(),
    notifications: [],
    dismissNotification: vi.fn(),
    dismissGroup: vi.fn(),
    isSubscribed: true,
    hasPermission: true,
    subscribe: vi.fn(),
    isLoading: false,
    enableNotifications: vi.fn()
  })
}));

describe('useTimerManagement', () => {
  const isMountedRef = { current: true };
  const debouncedRefreshMock = vi.fn();
  const showNotificationMock = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Reset the timerPhrasesDetectedRef before each test
    vi.mocked(require('@/components/notifications/NotificationsManager').useNotifications).mockReturnValue({
      showNotification: showNotificationMock,
      notifications: [],
      dismissNotification: vi.fn(),
      dismissGroup: vi.fn(),
      isSubscribed: true,
      hasPermission: true,
      subscribe: vi.fn(),
      isLoading: false,
      enableNotifications: vi.fn()
    });
  });

  it('should initialize properly', () => {
    const { result } = renderHook(() => useTimerManagement(debouncedRefreshMock, isMountedRef));
    
    expect(result.current).toHaveProperty('handleTimerResponse');
    expect(result.current).toHaveProperty('timerPhrasesDetectedRef');
  });

  it('should handle timer response and show notification', async () => {
    const { result } = renderHook(() => useTimerManagement(debouncedRefreshMock, isMountedRef));
    
    const timerData = {
      action: 'created',
      label: '5 minutes',
      duration: 5,
      unit: 'minutes',
      milliseconds: 300000
    };
    
    await result.current.handleTimerResponse(timerData);
    
    // Should show a notification
    expect(showNotificationMock).toHaveBeenCalledWith({
      title: 'Timer Set',
      message: 'A timer for 5 minutes has been set.',
      groupId: 'timer-notifications'
    });
    
    // Should call debouncedRefresh
    expect(debouncedRefreshMock).toHaveBeenCalledWith(['timers'], 300);
  });

  it('should not show notification if component is unmounted', async () => {
    const isMountedRefLocal = { current: false };
    const { result } = renderHook(() => useTimerManagement(debouncedRefreshMock, isMountedRefLocal));
    
    const timerData = {
      action: 'created',
      label: '5 minutes',
      duration: 5,
      unit: 'minutes',
      milliseconds: 300000
    };
    
    await result.current.handleTimerResponse(timerData);
    
    // Should not show a notification
    expect(showNotificationMock).not.toHaveBeenCalled();
    
    // Should not call debouncedRefresh
    expect(debouncedRefreshMock).not.toHaveBeenCalled();
  });
});
