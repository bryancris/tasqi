
import { Task } from "../../../TaskBoard";
import { TaskAssignmentInfo } from "../../types";
import { getSharingDetails } from "../utils/sharingDetailsUtils";

/**
 * SharingDetailsContent
 * 
 * This component displays the main content of the sharing info sheet, including
 * the description of the sharing relationship and the timestamp of when the sharing
 * occurred.
 */

interface SharingDetailsContentProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
}

export function SharingDetailsContent({ task, assignmentInfo }: SharingDetailsContentProps) {
  const sharingDetails = getSharingDetails(task, assignmentInfo);
  
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <p className="text-base">{sharingDetails.description}</p>
      {sharingDetails.time && (
        <p className="text-sm text-gray-500 mt-2">
          {sharingDetails.time}
        </p>
      )}
    </div>
  );
}
