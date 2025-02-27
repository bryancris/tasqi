
import { useState, useEffect } from "react";
import { Task } from "../TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TaskAssignmentInfo } from "./types";

export function useTaskAssignmentInfo(task: Task): TaskAssignmentInfo {
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
        console.log("Checking shared task info for task:", task.id, task.title);
        
        // Simplified logic: If I'm the task owner and it's shared, I shared it
        if (task.user_id === currentUserId) {
          console.log("Current user is task owner of shared task");
          setSharedByUser(true);
          
          // Get the first shared_task record to find who it's shared with
          if (task.shared_tasks && task.shared_tasks.length > 0) {
            const sharedTask = task.shared_tasks[0];
            const name = await fetchUserName(sharedTask.shared_with_user_id);
            setSharedWithName(name);
          }
        } 
        // If I'm not the owner but the task is shared, it was shared with me
        else {
          console.log("Current user is not task owner of shared task");
          setSharedWithUser(true);
          const name = await fetchUserName(task.user_id);
          setSharedByName(name);
        }
      }
    };

    loadAssignmentNames();
    checkSharedTaskInfo();
  }, [task, currentUserId]);

  return {
    assignerName,
    assigneeName,
    sharedWithUser,
    sharedByUser,
    sharedWithName,
    sharedByName,
    currentUserId
  };
}
