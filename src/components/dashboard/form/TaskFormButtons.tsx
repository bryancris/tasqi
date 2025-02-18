
import { Button } from "@/components/ui/button";

interface TaskFormButtonsProps {
  isLoading: boolean;
  isEditing: boolean;
}

export function TaskFormButtons({ isLoading, isEditing }: TaskFormButtonsProps) {
  return (
    <Button
      type="submit"
      className="w-full"
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : isEditing ? "Update Task" : "Create Task"}
    </Button>
  );
}
