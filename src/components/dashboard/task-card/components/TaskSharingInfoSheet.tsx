
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Share2, ArrowRight, Users } from "lucide-react";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { useEffect, useRef } from "react";

interface TaskSharingInfoSheetProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskSharingInfoSheet({ 
  task, 
  assignmentInfo, 
  open, 
  onOpenChange 
}: TaskSharingInfoSheetProps) {
  const ignoreClickRef = useRef(false);
  
  // Use effect to set a flag that will prevent the task edit drawer from opening
  // when this sheet is closed
  useEffect(() => {
    if (!open && ignoreClickRef.current) {
      // This runs after the sheet is closed
      // Set a timeout to reset the flag after all event handlers have run
      const timeout = setTimeout(() => {
        ignoreClickRef.current = false;
      }, 100);
      
      return () => clearTimeout(timeout);
    }
    
    if (open) {
      // When sheet is opened, set the flag to true
      ignoreClickRef.current = true;
    }
  }, [open]);

  // Create a custom handler for the onOpenChange event
  const handleOpenChange = (newOpen: boolean) => {
    // Prevent click events from bubbling when sheet is being closed
    if (!newOpen) {
      // Intercept and prevent other click/touch events for a short period
      document.body.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
      }, { capture: true, once: true });
    }
    
    onOpenChange(newOpen);
  };

  const {
    assignerName,
    assigneeName,
    sharedWithUser,
    sharedByUser,
    sharedWithName,
    sharedByName,
    currentUserId
  } = assignmentInfo;

  // Check if it's a group task
  const isGroupTask = task.shared_tasks?.some(st => st.sharing_type === 'group');
  
  // Get sharing message based on task info
  const getSharingDetails = () => {
    // For assignments
    if (task.assignments?.length) {
      const assignment = task.assignments[0];
      
      // If current user assigned this task to someone else
      if (assignment.assigned_by_id === currentUserId) {
        return {
          icon: <ArrowRight className="h-5 w-5 text-blue-500" />,
          title: "Task Assigned",
          description: assigneeName ? `You assigned this task to ${assigneeName}` : "You assigned this task",
          time: assignment.created_at ? new Date(assignment.created_at).toLocaleString() : undefined
        };
      }
      
      // If someone assigned this task to me
      if (assignment.assignee_id === currentUserId) {
        return {
          icon: <Share2 className="h-5 w-5 text-purple-500" />,
          title: "Task Received",
          description: assignerName ? `${assignerName} assigned this task to you` : "Someone assigned this task to you",
          time: assignment.created_at ? new Date(assignment.created_at).toLocaleString() : undefined
        };
      }
    }
    
    // For group tasks
    if (isGroupTask) {
      return {
        icon: <Users className="h-5 w-5 text-green-500" />,
        title: "Group Task",
        description: "This task is shared with your group",
        time: task.shared_tasks?.[0]?.created_at 
          ? new Date(task.shared_tasks[0].created_at).toLocaleString() 
          : undefined
      };
    }
    
    // If current user shared this task with someone
    if (sharedByUser) {
      return {
        icon: <ArrowRight className="h-5 w-5 text-blue-500" />,
        title: "Task Shared",
        description: sharedWithName ? `You shared this task with ${sharedWithName}` : "You shared this task",
        time: task.shared_tasks?.[0]?.created_at 
          ? new Date(task.shared_tasks[0].created_at).toLocaleString() 
          : undefined
      };
    }
    
    // If this task was shared with current user
    if (sharedWithUser) {
      return {
        icon: <Share2 className="h-5 w-5 text-purple-500" />,
        title: "Task Shared With You",
        description: sharedByName ? `${sharedByName} shared this task with you` : "Someone shared this task with you",
        time: task.shared_tasks?.[0]?.created_at 
          ? new Date(task.shared_tasks[0].created_at).toLocaleString() 
          : undefined
      };
    }
    
    // Generic fallback
    return {
      icon: <Share2 className="h-5 w-5 text-purple-500" />,
      title: "Shared Task",
      description: "This task is shared",
      time: undefined
    };
  };

  const sharingDetails = getSharingDetails();

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-96 rounded-t-xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            {sharingDetails.icon}
            {sharingDetails.title}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-base">{sharingDetails.description}</p>
            {sharingDetails.time && (
              <p className="text-sm text-gray-500 mt-2">
                {sharingDetails.time}
              </p>
            )}
          </div>
          
          {task.shared && task.shared_tasks && task.shared_tasks.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Sharing Details</h3>
              <ul className="space-y-2">
                {task.shared_tasks.map((sharedTask, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span>
                      {sharedTask.sharing_type === 'group' 
                        ? 'Shared with group' 
                        : sharedTask.shared_with_user_id === currentUserId
                          ? 'Shared with you'
                          : 'Shared with user'}
                    </span>
                    {sharedTask.created_at && (
                      <span className="text-gray-500">
                        {new Date(sharedTask.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
