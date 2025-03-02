
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { useDragEventHandler } from '../use-drag-event-handler';
import { Task } from '@/components/dashboard/TaskBoard';

describe('useDragEventHandler', () => {
  // Create some mock tasks for testing with all required properties
  const mockTasks: Task[] = [
    { id: 1, title: 'Task 1', description: 'Description 1', position: 1000, status: 'scheduled', date: null, start_time: null, end_time: null, user_id: 'test-user', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, title: 'Task 2', description: 'Description 2', position: 2000, status: 'scheduled', date: null, start_time: null, end_time: null, user_id: 'test-user', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, title: 'Task 3', description: 'Description 3', position: 3000, status: 'scheduled', date: null, start_time: null, end_time: null, user_id: 'test-user', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ];

  it('should return null if active and over are the same', () => {
    const { result } = renderHook(() => useDragEventHandler(mockTasks));
    
    const dragEvent = {
      active: { id: 1 },
      over: { id: 1 }
    };
    
    const updatedTasks = result.current.processDragEnd(dragEvent as any);
    expect(updatedTasks).toBeNull();
  });

  it('should return null if over is null', () => {
    const { result } = renderHook(() => useDragEventHandler(mockTasks));
    
    const dragEvent = {
      active: { id: 1 },
      over: null
    };
    
    const updatedTasks = result.current.processDragEnd(dragEvent as any);
    expect(updatedTasks).toBeNull();
  });

  it('should reorder tasks correctly when dragging down', () => {
    const { result } = renderHook(() => useDragEventHandler(mockTasks));
    
    // Dragging task 1 to position 3
    const dragEvent = {
      active: { id: 1 },
      over: { id: 3 }
    };
    
    const updatedTasks = result.current.processDragEnd(dragEvent as any);
    
    expect(updatedTasks).toHaveLength(3);
    
    // Task 1 should now be at index 2
    expect(updatedTasks![2].id).toBe(1);
    expect(updatedTasks![0].id).toBe(2);
    expect(updatedTasks![1].id).toBe(3);
  });

  it('should reorder tasks correctly when dragging up', () => {
    const { result } = renderHook(() => useDragEventHandler(mockTasks));
    
    // Dragging task 3 to position 1
    const dragEvent = {
      active: { id: 3 },
      over: { id: 1 }
    };
    
    const updatedTasks = result.current.processDragEnd(dragEvent as any);
    
    expect(updatedTasks).toHaveLength(3);
    
    // Task 3 should now be at index 0
    expect(updatedTasks![0].id).toBe(3);
    expect(updatedTasks![1].id).toBe(1);
    expect(updatedTasks![2].id).toBe(2);
  });

  it('should handle middle drag operations', () => {
    const { result } = renderHook(() => useDragEventHandler(mockTasks));
    
    // Dragging task 3 to position 2
    const dragEvent = {
      active: { id: 3 },
      over: { id: 2 }
    };
    
    const updatedTasks = result.current.processDragEnd(dragEvent as any);
    
    expect(updatedTasks).toHaveLength(3);
    
    // Task 3 should now be at index 1
    expect(updatedTasks![0].id).toBe(1);
    expect(updatedTasks![1].id).toBe(3);
    expect(updatedTasks![2].id).toBe(2);
  });

  it('should maintain task properties when reordering', () => {
    const { result } = renderHook(() => useDragEventHandler(mockTasks));
    
    // Dragging task 1 to position 2
    const dragEvent = {
      active: { id: 1 },
      over: { id: 2 }
    };
    
    const updatedTasks = result.current.processDragEnd(dragEvent as any);
    
    expect(updatedTasks![0].id).toBe(2);
    expect(updatedTasks![1].id).toBe(1);
    
    // Ensure all properties are maintained
    expect(updatedTasks![1].title).toBe('Task 1');
    expect(updatedTasks![1].description).toBe('Description 1');
    expect(updatedTasks![1].position).toBe(1000);
  });
});
