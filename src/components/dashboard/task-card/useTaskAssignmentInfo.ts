
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
        // IMPORTANT FIX: Check if the current user is the owner of the task
        // This is the key change - we use task.user_id to determine ownership
        const isOwner = task.user_id === currentUserId;
        
        if (isOwner) {
          setSharedByUser(true);
          console.log("Current user is task owner, should show arrow icon");
          
          const { data: sharedTasks } = await supabase
            .from('shared_tasks')
            .select('shared_with_user_id')
            .eq('task_id', task.id)
            .limit(1);
          
          if (sharedTasks && sharedTasks.length > 0) {
            const sharedWithUserId = sharedTasks[0].shared_with_user_id;
            const name = await fetchUserName(sharedWithUserId);
            setSharedWithName(name);
          }
        } else {
          console.log("Current user is not task owner, checking if shared with them");
          // If not the owner, check if the task was shared with the current user
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
