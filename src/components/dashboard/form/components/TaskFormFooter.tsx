
import { Button } from "@/components/ui/button";

interface TaskFormFooterProps {
  isLoading: boolean;
  processingAIResponse: boolean;
  isEditing?: boolean;
  isMobile: boolean;
}

export function TaskFormFooter({
  isLoading,
  processingAIResponse,
  isEditing = false,
  isMobile,
}: TaskFormFooterProps) {
  return (
    <div className={`${isMobile ? 'sticky bottom-0 left-0 right-0 p-4 bg-white border-t z-50' : 'p-4'}`}>
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || processingAIResponse}
      >
        {isLoading || processingAIResponse ? "Loading..." : isEditing ? "Update Task" : "Create Task"}
      </Button>
    </div>
  );
}
