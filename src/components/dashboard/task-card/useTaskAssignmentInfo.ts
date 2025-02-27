
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

        // Check if we have the shared_tasks data directly from the task
        if (task.shared_tasks && task.shared_tasks.length > 0) {
          console.log("Using shared_tasks from task data:", task.shared_tasks);
          
          // Find a shared task record where current user is the sharer
          const sharedByMeRecord = task.shared_tasks.find(
            st => st.shared_by_user_id === currentUserId
          );
          
          // Find a shared task record where current user is the receiver
          const sharedWithMeRecord = task.shared_tasks.find(
            st => st.shared_with_user_id === currentUserId
          );
          
          if (sharedByMeRecord) {
            console.log("Current user shared this task");
            setSharedByUser(true);
            const sharedWithUserId = sharedByMeRecord.shared_with_user_id;
            const name = await fetchUserName(sharedWithUserId);
            setSharedWithName(name);
          } else if (sharedWithMeRecord) {
            console.log("This task was shared with current user");
            setSharedWithUser(true);
            const sharedByUserId = sharedWithMeRecord.shared_by_user_id;
            const name = await fetchUserName(sharedByUserId);
            setSharedByName(name);
          } else {
            console.log("Task is shared but current user not involved directly");
          }
        } else {
          console.log("No shared_tasks data in task object, falling back to database query");
          // Fallback to querying if task.shared_tasks is not available
          // Check if current user shared this task
          const { data: outgoingShares } = await supabase
            .from('shared_tasks')
            .select('shared_with_user_id')
            .eq('task_id', task.id)
            .eq('shared_by_user_id', currentUserId)
            .limit(1);
            
          if (outgoingShares && outgoingShares.length > 0) {
            setSharedByUser(true);
            const sharedWithUserId = outgoingShares[0].shared_with_user_id;
            const name = await fetchUserName(sharedWithUserId);
            setSharedWithName(name);
          } else {
            // Check if task was shared with current user
            const { data: incomingShares } = await supabase
              .from('shared_tasks')
              .select('shared_by_user_id')
              .eq('task_id', task.id)
              .eq('shared_with_user_id', currentUserId)
              .limit(1);
              
            if (incomingShares && incomingShares.length > 0) {
              setSharedWithUser(true);
              const sharedByUserId = incomingShares[0].shared_by_user_id;
              const name = await fetchUserName(sharedByUserId);
              setSharedByName(name);
            }
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
