
import { Label } from "@/components/ui/label";
import { FileAttachmentInput } from "./FileAttachmentInput";
import { TaskAttachments } from "./TaskAttachments";
import { Task } from "../TaskBoard";

interface TaskAttachmentFieldsProps {
  task?: Task;
  isEditing?: boolean;
}

export function TaskAttachmentFields({ task, isEditing }: TaskAttachmentFieldsProps) {
  return (
    <div className="space-y-2">
      <Label>Attachments</Label>
      <FileAttachmentInput 
        taskId={task?.id} 
        isDisabled={!isEditing && !task?.id}
      />
      {!isEditing && !task?.id && (
        <p className="text-sm text-muted-foreground">
          Save the task first to add attachments
        </p>
      )}
      <TaskAttachments taskId={task?.id} isEditing={isEditing} />
    </div>
  );
}
