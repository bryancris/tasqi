
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
  const isDisabled = isLoading || processingAIResponse;
  const buttonText = isLoading ? 
    "Saving..." : 
    processingAIResponse ? 
      "Processing..." : 
      isEditing ? 
        "Update Task" : 
        "Create Task";

  return (
    <div className={`${isMobile ? 'sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-[#9b87f5]/20 z-50' : 'p-4'}`}>
      <Button
        id="task-form-submit-button"
        type="submit"
        className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white shadow-sm transition-all duration-200"
        disabled={isDisabled}
        onClick={() => {
          console.log("Submit button clicked");
          console.log("Button state:", { isLoading, processingAIResponse, isEditing, isDisabled });
        }}
      >
        {buttonText}
      </Button>
    </div>
  );
}
