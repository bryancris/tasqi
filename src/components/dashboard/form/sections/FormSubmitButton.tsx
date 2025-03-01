
import { Button } from "@/components/ui/button";

interface FormSubmitButtonProps {
  isLoading: boolean;
  processingAIResponse: boolean;
  isEditing: boolean;
  isMobile: boolean;
}

export function FormSubmitButton({ 
  isLoading, 
  processingAIResponse, 
  isEditing, 
  isMobile 
}: FormSubmitButtonProps) {
  return (
    <div className={`${isMobile ? 'sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-[#9b87f5]/20 z-50' : 'p-4'}`}>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white shadow-sm transition-all duration-200"
        disabled={isLoading || processingAIResponse}
        onClick={() => {
          console.log("Submit button clicked");
        }}
      >
        {isLoading || processingAIResponse ? "Loading..." : isEditing ? "Update Task" : "Create Task"}
      </Button>
    </div>
  );
}
