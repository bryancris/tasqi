
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { usePositionCalculation } from '../use-position-calculation';
import { Task } from '@/components/dashboard/TaskBoard';

describe('usePositionCalculation', () => {
  // Create some mock tasks for testing
  const mockTasks: Task[] = [
    { id: 1, title: 'Task 1', description: 'Description 1', position: 123 },
    { id: 2, title: 'Task 2', description: 'Description 2', position: 456 },
    { id: 3, title: 'Task 3', description: 'Description 3', position: 789 }
  ];

  it('should calculate new positions with 1000 interval', () => {
    const { result } = renderHook(() => usePositionCalculation());
    
    const newPositions = result.current.calculateNewPositions(mockTasks);
    
    expect(newPositions).toHaveLength(3);
    
    // Check that positions are calculated with 1000 interval
    expect(newPositions[0]).toEqual({ task_id: 1, new_position: 1000 });
    expect(newPositions[1]).toEqual({ task_id: 2, new_position: 2000 });
    expect(newPositions[2]).toEqual({ task_id: 3, new_position: 3000 });
  });

  it('should handle empty task array', () => {
    const { result } = renderHook(() => usePositionCalculation());
    
    const newPositions = result.current.calculateNewPositions([]);
    
    expect(newPositions).toEqual([]);
  });

  it('should preserve task ID order when calculating positions', () => {
    const { result } = renderHook(() => usePositionCalculation());
    
    // Shuffle the task order
    const shuffledTasks = [
      { id: 3, title: 'Task 3', description: 'Description 3', position: 789 },
      { id: 1, title: 'Task 1', description: 'Description 1', position: 123 },
      { id: 2, title: 'Task 2', description: 'Description 2', position: 456 }
    ];
    
    const newPositions = result.current.calculateNewPositions(shuffledTasks);
    
    // Positions should match the new order of tasks
    expect(newPositions[0]).toEqual({ task_id: 3, new_position: 1000 });
    expect(newPositions[1]).toEqual({ task_id: 1, new_position: 2000 });
    expect(newPositions[2]).toEqual({ task_id: 2, new_position: 3000 });
  });
});
