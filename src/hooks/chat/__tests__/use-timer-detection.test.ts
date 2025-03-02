
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { useTimerDetection } from '../use-timer-detection';

describe('useTimerDetection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('detectTimerRequest', () => {
    it('should detect timer requests correctly', () => {
      const { result } = renderHook(() => useTimerDetection());
      
      // Test valid timer request
      let detection = result.current.detectTimerRequest('set a 5 minute timer');
      expect(detection).toEqual({
        timerMatch: true,
        duration: 5,
        unit: 'minute'
      });
      
      // Test different time units
      detection = result.current.detectTimerRequest('set a 10 sec timer');
      expect(detection).toEqual({
        timerMatch: true,
        duration: 10,
        unit: 'sec'
      });
      
      detection = result.current.detectTimerRequest('set a 1 hour timer');
      expect(detection).toEqual({
        timerMatch: true,
        duration: 1,
        unit: 'hour'
      });
      
      // Test with plural units
      detection = result.current.detectTimerRequest('set a 30 minutes timer');
      expect(detection).toEqual({
        timerMatch: true,
        duration: 30,
        unit: 'minute'
      });
      
      // Test with text before and after
      detection = result.current.detectTimerRequest('can you set a 2 minute timer for me please');
      expect(detection).toEqual({
        timerMatch: true,
        duration: 2,
        unit: 'minute'
      });
    });

    it('should return timerMatch: false for non-timer requests', () => {
      const { result } = renderHook(() => useTimerDetection());
      
      const detection = result.current.detectTimerRequest('what time is it');
      expect(detection).toEqual({
        timerMatch: false
      });
    });
  });

  describe('createClientSideTimerResponse', () => {
    it('should create correct timer response for seconds', () => {
      const { result } = renderHook(() => useTimerDetection());
      
      const response = result.current.createClientSideTimerResponse(30, 'sec');
      
      expect(response.response).toContain('30 second timer');
      expect(response.timer).toEqual({
        action: 'created',
        label: '30 secs',
        duration: 30,
        unit: 'sec',
        milliseconds: 30 * 1000
      });
    });

    it('should create correct timer response for minutes', () => {
      const { result } = renderHook(() => useTimerDetection());
      
      const response = result.current.createClientSideTimerResponse(5, 'min');
      
      expect(response.response).toContain('5 minute timer');
      expect(response.timer).toEqual({
        action: 'created',
        label: '5 mins',
        duration: 5,
        unit: 'min',
        milliseconds: 5 * 60 * 1000
      });
    });

    it('should create correct timer response for hours', () => {
      const { result } = renderHook(() => useTimerDetection());
      
      const response = result.current.createClientSideTimerResponse(1, 'hour');
      
      expect(response.response).toContain('1 hour timer');
      expect(response.timer).toEqual({
        action: 'created',
        label: '1 hour',
        duration: 1,
        unit: 'hour',
        milliseconds: 1 * 60 * 60 * 1000
      });
    });
  });

  describe('refreshTimerData', () => {
    it('should call invalidateQueries with the correct query key', () => {
      const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
      vi.mocked(require('@tanstack/react-query').useQueryClient).mockReturnValue({
        invalidateQueries: mockInvalidateQueries
      });
      
      const { result } = renderHook(() => useTimerDetection());
      
      result.current.refreshTimerData();
      
      // We've mocked setTimeout to call the callback immediately
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['timers'] });
    });
  });
});
