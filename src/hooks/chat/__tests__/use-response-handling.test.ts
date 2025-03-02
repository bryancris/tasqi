import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useResponseHandling } from '../use-response-handling';
import { NotificationsContextType } from '@/components/notifications/context/NotificationsContext';

// Mock the notifications context
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

describe('useResponseHandling', () => {
  const isMountedRef = { current: true };
  const timerPhrasesDetectedRef = { current: new Set<string>() };
  
  beforeEach(() => {
    vi.resetAllMocks();
    timerPhrasesDetectedRef.current.clear();
  });

  it('should show a notification when a timer phrase is detected', async () => {
    const showNotificationMock = vi.fn();
    vi.mocked(require('@/components/notifications/NotificationsManager').useNotifications).mockReturnValue({
      showNotification: showNotificationMock,
      notifications: [],
      dismissNotification: vi.fn(),
      dismissGroup: vi.fn(),
      isSubscribed: true,
      hasPermission: true,
      subscribe: vi.fn()
    });
    
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    const response = "Okay, I'll remind you in 5 minutes.";
    await result.current.handleTimerRelatedResponse(response);
    
    expect(showNotificationMock).toHaveBeenCalledWith({
      title: 'Timer Alert',
      body: expect.stringContaining('5 minutes'),
    });
  });

  it('should not show a notification if the component is unmounted', async () => {
    const showNotificationMock = vi.fn();
    vi.mocked(require('@/components/notifications/NotificationsManager').useNotifications).mockReturnValue({
      showNotification: showNotificationMock,
      notifications: [],
      dismissNotification: vi.fn(),
      dismissGroup: vi.fn(),
      isSubscribed: true,
      hasPermission: true,
      subscribe: vi.fn()
    });
    
    const isMountedRef = { current: false }; // Simulate unmounted component
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    const response = "Okay, I'll remind you in 5 minutes.";
    await result.current.handleTimerRelatedResponse(response);
    
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  it('should not show a notification if the phrase has already been detected', async () => {
    const showNotificationMock = vi.fn();
    vi.mocked(require('@/components/notifications/NotificationsManager').useNotifications).mockReturnValue({
      showNotification: showNotificationMock,
      notifications: [],
      dismissNotification: vi.fn(),
      dismissGroup: vi.fn(),
      isSubscribed: true,
      hasPermission: true,
      subscribe: vi.fn()
    });
    
    timerPhrasesDetectedRef.current.add("Okay, I'll remind you in 5 minutes.");
    
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    const response = "Okay, I'll remind you in 5 minutes.";
    await result.current.handleTimerRelatedResponse(response);
    
    expect(showNotificationMock).not.toHaveBeenCalled();
  });
});
