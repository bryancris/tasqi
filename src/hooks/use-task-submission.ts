
import { useTaskSubmissionCore } from './task-submission/use-task-submission-core';

interface UseTaskSubmissionProps {
  onSuccess: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function useTaskSubmission(props: UseTaskSubmissionProps) {
  // Simply pass through to the core implementation
  return useTaskSubmissionCore(props);
}
