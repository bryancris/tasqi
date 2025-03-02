
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { useSupabaseReorder } from '../use-supabase-reorder';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null })
  }
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}));

describe('useSupabaseReorder', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should call supabase rpc with task positions', async () => {
    const { result } = renderHook(() => useSupabaseReorder());
    
    const positions = [
      { task_id: 1, new_position: 1000 },
      { task_id: 2, new_position: 2000 }
    ];
    
    const success = await result.current.reorderTasksInDatabase(positions);
    
    expect(supabase.rpc).toHaveBeenCalledWith('reorder_tasks', {
      task_positions: positions
    });
    
    expect(success).toBe(true);
  });

  it('should show an error toast when reordering fails', async () => {
    // Mock Supabase to return an error
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error('Failed to reorder tasks')
    });
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useSupabaseReorder());
    
    const positions = [
      { task_id: 1, new_position: 1000 },
      { task_id: 2, new_position: 2000 }
    ];
    
    const success = await result.current.reorderTasksInDatabase(positions);
    
    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error reordering tasks in database:',
      expect.any(Error)
    );
    
    // Should show error toast
    expect(toast.error).toHaveBeenCalledWith('Failed to reorder tasks. Please try again.');
    
    // Should return false to indicate failure
    expect(success).toBe(false);
    
    consoleSpy.mockRestore();
  });

  it('should handle network errors', async () => {
    // Mock Supabase to throw a network error
    vi.mocked(supabase.rpc).mockRejectedValue(new Error('Network error'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useSupabaseReorder());
    
    const positions = [
      { task_id: 1, new_position: 1000 }
    ];
    
    const success = await result.current.reorderTasksInDatabase(positions);
    
    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error reordering tasks in database:',
      expect.any(Error)
    );
    
    // Should show error toast
    expect(toast.error).toHaveBeenCalledWith('Failed to reorder tasks. Please try again.');
    
    // Should return false to indicate failure
    expect(success).toBe(false);
    
    consoleSpy.mockRestore();
  });
});
