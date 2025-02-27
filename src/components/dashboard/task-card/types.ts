
import { Task } from "../TaskBoard";

export interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
  extraButton?: React.ReactNode;
}

export interface TaskAssignmentInfo {
  assignerName: string;
  assigneeName: string;
  sharedWithUser: boolean;
  sharedByUser: boolean;
  sharedWithName: string;
  sharedByName: string;
  currentUserId?: string;
}
