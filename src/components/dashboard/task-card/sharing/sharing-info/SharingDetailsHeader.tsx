
import { Share2, ArrowRight, Users } from "lucide-react";
import { Task } from "../../../TaskBoard";
import { TaskAssignmentInfo } from "../../types";
import { getSharingDetails } from "../utils/sharingDetailsUtils";

/**
 * SharingDetailsHeader
 * 
 * This component displays the appropriate icon and title for the sharing info sheet.
 * It uses the sharing details utility to determine what icon and title to show based
 * on the task's sharing status.
 */

interface SharingDetailsHeaderProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
}

export function SharingDetailsHeader({ task, assignmentInfo }: SharingDetailsHeaderProps) {
  const sharingDetails = getSharingDetails(task, assignmentInfo);
  
  return (
    <>
      {sharingDetails.icon}
      {sharingDetails.title}
    </>
  );
}
