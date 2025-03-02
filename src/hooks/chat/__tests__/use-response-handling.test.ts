
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useResponseHandling } from '../use-response-handling';
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

describe('useResponseHandling', () => {
  const mockShowNotification = vi.fn().mockResolvedValue(undefined);
  const mockPlaySound = vi.fn().mockResolvedValue(undefined);
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mocks for each test
    vi.mocked(useNotifications).mockReturnValue({
      showNotification: mockShowNotification
    });
    
    vi.mocked(playNotificationSound).mockImplementation(mockPlaySound);
  });

  it('should initialize properly', () => {
    const isMountedRef = { current: true };
    const timerPhrasesDetectedRef = { current: new Set<string>() };
    
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    expect(result.current).toHaveProperty('handleTimerRelatedResponse');
  });

  it('should not process empty responses', async () => {
    const isMountedRef = { current: true };
    const timerPhrasesDetectedRef = { current: new Set<string>() };
    
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    await result.current.handleTimerRelatedResponse('');
    
    expect(mockShowNotification).not.toHaveBeenCalled();
    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it('should not process when component is unmounted', async () => {
    const isMountedRef = { current: false };
    const timerPhrasesDetectedRef = { current: new Set<string>() };
    
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    await result.current.handleTimerRelatedResponse('Your timer is complete');
    
    expect(mockShowNotification).not.toHaveBeenCalled();
    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it('should detect and process timer related responses', async () => {
    const isMountedRef = { current: true };
    const timerPhrasesDetectedRef = { current: new Set<string>() };
    
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    await result.current.handleTimerRelatedResponse('Your timer is complete');
    
    expect(mockPlaySound).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: "Timer Update",
      message: 'Your timer is complete',
      type: "info",
      persistent: false
    });
  });

  it('should skip timer creation responses', async () => {
    const isMountedRef = { current: true };
    const timerPhrasesDetectedRef = { current: new Set<string>() };
    
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    await result.current.handleTimerRelatedResponse('I\'ve set a timer for 5 minutes');
    
    expect(mockShowNotification).not.toHaveBeenCalled();
    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it('should handle errors in showNotification', async () => {
    const isMountedRef = { current: true };
    const timerPhrasesDetectedRef = { current: new Set<string>() };
    
    mockShowNotification.mockRejectedValue(new Error('Failed to show notification'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    await result.current.handleTimerRelatedResponse('Timer cancelled');
    
    expect(mockPlaySound).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to show timer update notification'),
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle errors in playNotificationSound', async () => {
    const isMountedRef = { current: true };
    const timerPhrasesDetectedRef = { current: new Set<string>() };
    
    mockPlaySound.mockRejectedValue(new Error('Failed to play sound'));
    
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useResponseHandling(isMountedRef, timerPhrasesDetectedRef));
    
    await result.current.handleTimerRelatedResponse('Timer cancelled');
    
    expect(mockPlaySound).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not play notification sound'),
      expect.any(Error)
    );
    
    consoleWarnSpy.mockRestore();
  });
});
