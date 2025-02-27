
import { memo, useEffect, useState } from "react";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";
import { Bell, Share2, ArrowRight, Mic } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
  extraButton?: React.ReactNode;
}

function DailyTaskCardComponent({ task, onComplete, onClick, dragHandleProps, extraButton }: DailyTaskCardProps) {
  const [assignerName, setAssignerName] = useState<string>("");
  const [assigneeName, setAssigneeName] = useState<string>("");
  const [sharedWithUser, setSharedWithUser] = useState<boolean>(false);
  const [sharedByUser, setSharedByUser] = useState<boolean>(false);
  const [sharedWithName, setSharedWithName] = useState<string>("");
  const [sharedByName, setSharedByName] = useState<string>("");
  const { session } = useAuth();
  const currentUserId = session?.user.id;

  useEffect(() => {
    const fetchUserName = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      return profile?.email?.split('@')[0] || 'Unknown';
    };

    const loadAssignmentNames = async () => {
      if (task.assignments?.length) {
        const assignment = task.assignments[0];
        const assignerName = await fetchUserName(assignment.assigned_by_id);
        const assigneeName = await fetchUserName(assignment.assignee_id);
        setAssignerName(assignerName);
        setAssigneeName(assigneeName);
      }
    };

    const checkSharedTaskInfo = async () => {
      if (task.shared) {
        // Check if this user shared the task
        if (task.user_id === currentUserId) {
          setSharedByUser(true);
          
          // Fetch who the task was shared with
          const { data: sharedTasks } = await supabase
            .from('shared_tasks')
            .select('shared_with_user_id')
            .eq('task_id', task.id)
            .eq('shared_by_user_id', currentUserId)
            .limit(1);
          
          if (sharedTasks && sharedTasks.length > 0) {
            const sharedWithUserId = sharedTasks[0].shared_with_user_id;
            const name = await fetchUserName(sharedWithUserId);
            setSharedWithName(name);
          }
        } else {
          // Check if task was shared with this user
          const { data: sharedTasks } = await supabase
            .from('shared_tasks')
            .select('shared_by_user_id')
            .eq('task_id', task.id)
            .eq('shared_with_user_id', currentUserId)
            .limit(1);
          
          if (sharedTasks && sharedTasks.length > 0) {
            setSharedWithUser(true);
            const sharedByUserId = sharedTasks[0].shared_by_user_id;
            const name = await fetchUserName(sharedByUserId);
            setSharedByName(name);
          }
        }
      }
    };

    loadAssignmentNames();
    checkSharedTaskInfo();
  }, [task, currentUserId]);

  const getTimeDisplay = () => {
    if (task.start_time && task.end_time) {
      const startTime = task.start_time.split(':').slice(0, 2).join(':');
      const endTime = task.end_time.split(':').slice(0, 2).join(':');
      return `${startTime} - ${endTime}`;
    }
    return '';
  };

  const hasVoiceNote = task.task_attachments?.some(
    attachment => attachment.content_type === 'audio/webm'
  );

  const renderAssignmentInfo = () => {
    // Check for assignments first
    if (task.assignments?.length) {
      const assignment = task.assignments[0];
      
      // If I assigned this task to someone else
      if (assignment.assigned_by_id === currentUserId) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-white/80 cursor-help">
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-xs truncate">Assigned</span>
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                align="center"
                className="bg-gray-800 text-white border-gray-700 text-xs z-50"
                sideOffset={5}
              >
                {assigneeName ? `Assigned to ${assigneeName}` : "Loading..."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      
      // If someone assigned this task to me
      if (assignment.assignee_id === currentUserId) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-white/80 cursor-help">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs truncate">From</span>
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                align="center"
                className="bg-gray-800 text-white border-gray-700 text-xs z-50"
                sideOffset={5}
              >
                {assignerName ? `From ${assignerName}` : "Loading..."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    }

    // Check for shared tasks when there are no assignments
    // If I shared this task with someone (I'm the owner)
    if (sharedByUser) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-white/80 cursor-help">
                <ArrowRight className="w-4 h-4" />
                <span className="text-xs truncate">Assigned</span>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              align="center"
              className="bg-gray-800 text-white border-gray-700 text-xs z-50"
              sideOffset={5}
            >
              {sharedWithName ? `Assigned to ${sharedWithName}` : "Shared task"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // If this task was shared with me
    if (sharedWithUser) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-white/80 cursor-help">
                <Share2 className="w-4 h-4" />
                <span className="text-xs truncate">From</span>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              align="center"
              className="bg-gray-800 text-white border-gray-700 text-xs z-50"
              sideOffset={5}
            >
              {sharedByName ? `From ${sharedByName}` : "Received task"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return null;
  };

  const getCardColor = () => {
    if (task.status === 'completed') {
      return 'bg-[#8E9196]'; // Dark gray for completed tasks
    }
    if (task.status === 'unscheduled') {
      return 'bg-[#2196F3]';
    }
    return getPriorityColor(task.priority);
  };

  const timeDisplay = getTimeDisplay();

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl relative",
        "transition-all duration-300",
        "shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        "hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
        "hover:-translate-y-1",
        "cursor-pointer",
        getCardColor(),
        "text-white",
        "before:content-[''] before:absolute before:inset-0",
        "before:bg-gradient-to-br before:from-white/10 before:to-transparent",
        "before:pointer-events-none",
        "border border-white/20"
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <TaskStatusIndicator 
        status={task.status} 
        time={getTimeDisplay()}
        rescheduleCount={task.reschedule_count}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }} 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-medium truncate flex-1 text-white",
            task.status === 'completed' && "line-through opacity-80"
          )}>{task.title}</h3>
          <div className="flex items-center gap-2">
            {task.reminder_enabled && (
              <Bell className="w-4 h-4 text-white/80 shrink-0" />
            )}
            {hasVoiceNote && (
              <Mic className="w-4 h-4 text-white/80" />
            )}
            {renderAssignmentInfo()}
            {extraButton}
          </div>
        </div>
        {timeDisplay && (
          <p className="text-sm mt-1 text-white/80">{timeDisplay}</p>
        )}
      </div>
      {task.shared && (
        <div className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0" />
      )}
    </div>
  );
}

export const DailyTaskCard = memo(DailyTaskCardComponent);
