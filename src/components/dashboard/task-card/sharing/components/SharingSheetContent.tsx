
import { Task } from "../../../TaskBoard";
import { TaskAssignmentInfo } from "../../types";
import { SharingDetailsContent } from "../sharing-info/SharingDetailsContent";
import { SharingDetailsList } from "../sharing-info/SharingDetailsList";

interface SharingSheetContentProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
}

export function SharingSheetContent({ task, assignmentInfo }: SharingSheetContentProps) {
  return (
    <div className="mt-4 space-y-4">
      <SharingDetailsContent task={task} assignmentInfo={assignmentInfo} />
      
      {task.shared && task.shared_tasks && task.shared_tasks.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Sharing Details</h3>
          <SharingDetailsList 
            sharedTasks={task.shared_tasks} 
            currentUserId={assignmentInfo.currentUserId} 
          />
        </div>
      )}
    </div>
  );
}
