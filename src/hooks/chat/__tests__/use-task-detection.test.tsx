
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { act } from '../../../test/test-utils';
import { useTaskDetection } from '../use-task-detection';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@tanstack/react-query', () => ({
  ...vi.importActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('useTaskDetection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default supabase mock
    vi.mocked(supabase.functions).invoke = vi.fn().mockResolvedValue({
      data: null,
      error: null
    });
    
    // Setup window event listener mock
    global.window.dispatchEvent = vi.fn();
  });

  it('should detect task-related messages', () => {
    const { result } = renderHook(() => useTaskDetection());
    
    expect(result.current.isTaskRelated('create a task to buy milk')).toBe(true);
    expect(result.current.isTaskRelated('remind me to call mom')).toBe(true);
    expect(result.current.isTaskRelated('meeting with John tomorrow')).toBe(true);
    expect(result.current.isTaskRelated('hello how are you')).toBe(false);
  });

  it('should process a message as a task successfully', async () => {
    const mockTask = { id: 1, title: 'Buy milk', due_date: '2023-01-01' };
    
    vi.mocked(supabase.functions).invoke = vi.fn().mockResolvedValue({
      data: {
        success: true,
        task: mockTask,
        response: 'I created a task to buy milk'
      },
      error: null
    });
    
    const { result } = renderHook(() => useTaskDetection());
    
    const response = await result.current.processAsTask('create a task to buy milk', 'user-123');
    
    expect(supabase.functions.invoke).toHaveBeenCalledWith('process-task', {
      body: { message: 'create a task to buy milk', userId: 'user-123' }
    });
    
    expect(response.success).toBe(true);
    expect(response.taskCreated).toBe(true);
    expect(response.task).toEqual(mockTask);
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it('should detect task confirmation in response', () => {
    const { result } = renderHook(() => useTaskDetection());
    
    expect(result.current.hasTaskConfirmation('I have created a task for you')).toBe(true);
    expect(result.current.hasTaskConfirmation('I\'ve scheduled a task for tomorrow')).toBe(true);
    expect(result.current.hasTaskConfirmation('Hello how are you')).toBe(false);
  });
});
