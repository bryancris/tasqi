
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
        
        // We need to check the shared_tasks data to see who shared and who received
        if (task.shared_tasks && task.shared_tasks.length > 0) {
          // Find if current user shared this task with someone
          const sharedByMe = task.shared_tasks.some(
            st => st.shared_by_user_id === currentUserId
          );
          
          // Find if this task was shared with the current user
          const sharedWithMe = task.shared_tasks.some(
            st => st.shared_with_user_id === currentUserId
          );
          
          if (sharedByMe) {
            console.log("Current user shared this task with someone");
            setSharedByUser(true);
            
            // Get the name of who we shared with
            const sharedTask = task.shared_tasks.find(
              st => st.shared_by_user_id === currentUserId
            );
            if (sharedTask) {
              const name = await fetchUserName(sharedTask.shared_with_user_id);
              setSharedWithName(name);
            }
          } else if (sharedWithMe) {
            console.log("This task was shared with current user");
            setSharedWithUser(true);
            
            // Get the name of who shared with us
            const sharedTask = task.shared_tasks.find(
              st => st.shared_with_user_id === currentUserId
            );
            if (sharedTask) {
              const name = await fetchUserName(sharedTask.shared_by_user_id);
              setSharedByName(name);
            }
          } else {
            console.log("Task is shared but current user not directly involved");
          }
        } else {
          // Fallback to database query if shared_tasks not available
          console.log("No shared_tasks data, querying database");
          
          // Check if current user shared this task
          const { data: outgoing } = await supabase
            .from('shared_tasks')
            .select('shared_with_user_id')
            .eq('task_id', task.id)
            .eq('shared_by_user_id', currentUserId);
            
          if (outgoing && outgoing.length > 0) {
            console.log("Found outgoing shares from current user");
            setSharedByUser(true);
            const name = await fetchUserName(outgoing[0].shared_with_user_id);
            setSharedWithName(name);
          } else {
            // Check if task was shared with current user
            const { data: incoming } = await supabase
              .from('shared_tasks')
              .select('shared_by_user_id')
              .eq('task_id', task.id)
              .eq('shared_with_user_id', currentUserId);
              
            if (incoming && incoming.length > 0) {
              console.log("Found incoming shares to current user");
              setSharedWithUser(true);
              const name = await fetchUserName(incoming[0].shared_by_user_id);
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
