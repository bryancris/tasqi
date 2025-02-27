
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
