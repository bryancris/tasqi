
import { SubtaskList, Subtask } from "../../subtasks/SubtaskList";
import { FormSection } from "./FormSection";

interface SubtasksSectionProps {
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
}

export function SubtasksSection({ subtasks, onSubtasksChange }: SubtasksSectionProps) {
  return (
    <FormSection title="Subtasks">
      <div className="space-y-2">
        <SubtaskList 
          subtasks={subtasks} 
          onSubtasksChange={onSubtasksChange}
        />
      </div>
    </FormSection>
  );
}
