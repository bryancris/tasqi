
import { useTaskSubmissionCore } from './task-submission';

interface UseTaskSubmissionProps {
  onSuccess: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function useTaskSubmission(props: UseTaskSubmissionProps) {
  return useTaskSubmissionCore(props);
}
