
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useLoadingState } from '../use-loading-state';

describe('useLoadingState', () => {
  it('should initialize with isLoading set to false', () => {
    const { result } = renderHook(() => useLoadingState());
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should update isLoading state when setIsLoading is called', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.setIsLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
    
    act(() => {
      result.current.setIsLoading(false);
    });
    
    expect(result.current.isLoading).toBe(false);
  });
});
