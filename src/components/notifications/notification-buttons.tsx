
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NotificationButtonsProps {
  isLoading: string | null;
  referenceId: number | null | undefined;
  onDismiss: () => void;
  onDone: () => void;
}

export function NotificationButtons({
  isLoading,
  referenceId,
  onDismiss,
  onDone
}: NotificationButtonsProps) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={onDismiss}
        disabled={!!isLoading}
        className="text-[#1A1F2C]"
      >
        Dismiss
      </Button>
      {referenceId && (
        <Button
          variant="default"
          size="sm"
          onClick={onDone}
          disabled={!!isLoading}
          className="bg-[#6D4AFF] hover:bg-[#5B3DF5] text-white"
        >
          {isLoading === 'done' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            'Done'
          )}
        </Button>
      )}
    </>
  );
}
