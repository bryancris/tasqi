import { Button } from "@/components/ui/button";

interface DatePickerControlsProps {
  onSet: () => void;
  onCancel: () => void;
}

export function DatePickerControls({ onSet, onCancel }: DatePickerControlsProps) {
  return (
    <div className="flex justify-between mt-4 gap-4">
      <Button
        type="button"
        variant="default"
        className="flex-1 bg-[#1e1b4b] hover:bg-[#1e1b4b]/90"
        onClick={onSet}
      >
        Set
      </Button>
      <Button
        type="button"
        variant="default"
        className="flex-1 bg-[#1e1b4b] hover:bg-[#1e1b4b]/90"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}