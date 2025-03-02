
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useTaskReorder } from '../index';
import { Task } from '@/components/dashboard/TaskBoard';
import { DragEndEvent } from '@dnd-kit/core';

// Mock all dependencies
vi.mock('../use-drag-event-handler', () => ({
  useDragEventHandler: () => ({
    processDragEnd: vi.fn()
  })
}));

vi.mock('../use-position-calculation', () => ({
  usePositionCalculation: () => ({
    calculateNewPositions: vi.fn()
  })
}));

vi.mock('../use-supabase-reorder', () => ({
  useSupabaseReorder: () => ({
    reorderTasksInDatabase: vi.fn()
  })
}));

describe('useTaskReorder', () => {
  // Create mock tasks for testing with all required properties
  const mockTasks: Task[] = [
    { id: 1, title: 'Task 1', description: 'Description 1', position: 1000, status: 'scheduled', date: null, start_time: null, end_time: null, user_id: 'test-user', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, title: 'Task 2', description: 'Description 2', position: 2000, status: 'scheduled', date: null, start_time: null, end_time: null, user_id: 'test-user', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ];

  // Mock functions
  let mockProcessDragEnd: any;
  let mockCalculateNewPositions: any;
  let mockReorderTasksInDatabase: any;
  let mockOnTasksReordered: any;
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup the mocks
    mockProcessDragEnd = vi.fn().mockReturnValue([
      { id: 2, title: 'Task 2', description: 'Description 2', position: 2000 },
      { id: 1, title: 'Task 1', description: 'Description 1', position: 1000 }
    ]);
    
    mockCalculateNewPositions = vi.fn().mockReturnValue([
      { task_id: 2, new_position: 1000 },
      { task_id: 1, new_position: 2000 }
    ]);
    
    mockReorderTasksInDatabase = vi.fn().mockResolvedValue(true);
    
    mockOnTasksReordered = vi.fn();
    
    // Override the module mocks
    vi.mocked(require('../use-drag-event-handler').useDragEventHandler).mockReturnValue({
      processDragEnd: mockProcessDragEnd
    });
    
    vi.mocked(require('../use-position-calculation').usePositionCalculation).mockReturnValue({
      calculateNewPositions: mockCalculateNewPositions
    });
    
    vi.mocked(require('../use-supabase-reorder').useSupabaseReorder).mockReturnValue({
      reorderTasksInDatabase: mockReorderTasksInDatabase
    });
  });

  it('should process a drag event and update task order', async () => {
    const { result } = renderHook(() => useTaskReorder(mockTasks, mockOnTasksReordered));
    
    const mockDragEvent = {
      active: { id: 1 },
      over: { id: 2 }
    } as DragEndEvent;
    
    await act(async () => {
      await result.current.handleDragEnd(mockDragEvent);
    });
    
    // Check that all functions were called in the correct order
    expect(mockProcessDragEnd).toHaveBeenCalledWith(mockDragEvent);
    expect(mockCalculateNewPositions).toHaveBeenCalledWith([
      { id: 2, title: 'Task 2', description: 'Description 2', position: 2000 },
      { id: 1, title: 'Task 1', description: 'Description 1', position: 1000 }
    ]);
    expect(mockReorderTasksInDatabase).toHaveBeenCalledWith([
      { task_id: 2, new_position: 1000 },
      { task_id: 1, new_position: 2000 }
    ]);
    expect(mockOnTasksReordered).toHaveBeenCalledWith([
      { id: 2, title: 'Task 2', description: 'Description 2', position: 2000 },
      { id: 1, title: 'Task 1', description: 'Description 1', position: 1000 }
    ]);
  });

  it('should not update tasks if processDragEnd returns null', async () => {
    // Override to return null (no change)
    mockProcessDragEnd.mockReturnValue(null);
    
    const { result } = renderHook(() => useTaskReorder(mockTasks, mockOnTasksReordered));
    
    const mockDragEvent = {
      active: { id: 1 },
      over: { id: 1 } // Same ID, should result in no changes
    } as DragEndEvent;
    
    await act(async () => {
      await result.current.handleDragEnd(mockDragEvent);
    });
    
    // processDragEnd should be called
    expect(mockProcessDragEnd).toHaveBeenCalledWith(mockDragEvent);
    
    // But none of the other functions should be called
    expect(mockCalculateNewPositions).not.toHaveBeenCalled();
    expect(mockReorderTasksInDatabase).not.toHaveBeenCalled();
    expect(mockOnTasksReordered).not.toHaveBeenCalled();
  });

  it('should not call onTasksReordered if database update fails', async () => {
    // Mock the database update to fail
    mockReorderTasksInDatabase.mockResolvedValue(false);
    
    const { result } = renderHook(() => useTaskReorder(mockTasks, mockOnTasksReordered));
    
    const mockDragEvent = {
      active: { id: 1 },
      over: { id: 2 }
    } as DragEndEvent;
    
    await act(async () => {
      await result.current.handleDragEnd(mockDragEvent);
    });
    
    // processDragEnd and calculateNewPositions should be called
    expect(mockProcessDragEnd).toHaveBeenCalledWith(mockDragEvent);
    expect(mockCalculateNewPositions).toHaveBeenCalled();
    expect(mockReorderTasksInDatabase).toHaveBeenCalled();
    
    // But onTasksReordered should not be called due to the database error
    expect(mockOnTasksReordered).not.toHaveBeenCalled();
  });

  it('should work without an onTasksReordered callback', async () => {
    const { result } = renderHook(() => useTaskReorder(mockTasks, undefined));
    
    const mockDragEvent = {
      active: { id: 1 },
      over: { id: 2 }
    } as DragEndEvent;
    
    // This should not throw any errors even without a callback
    await act(async () => {
      await result.current.handleDragEnd(mockDragEvent);
    });
    
    // All operations should complete successfully
    expect(mockProcessDragEnd).toHaveBeenCalledWith(mockDragEvent);
    expect(mockCalculateNewPositions).toHaveBeenCalled();
    expect(mockReorderTasksInDatabase).toHaveBeenCalled();
  });
});
