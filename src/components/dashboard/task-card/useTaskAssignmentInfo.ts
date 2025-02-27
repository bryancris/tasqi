
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
      if (!userId) return 'Unknown';
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (profile) {
        // Use first name if available, otherwise use email username
        if (profile.first_name) {
          return profile.first_name;
        } else {
          return profile?.email?.split('@')[0] || 'Unknown';
        }
      }
      
      return 'Unknown';
    };

    const loadAssignmentNames = async () => {
      if (task.assignments?.length) {
        const assignment = task.assignments[0];
        if (assignment.assigned_by_id) {
          const assignerName = await fetchUserName(assignment.assigned_by_id);
          setAssignerName(assignerName);
        }
        if (assignment.assignee_id) {
          const assigneeName = await fetchUserName(assignment.assignee_id);
          setAssigneeName(assigneeName);
        }
      }
    };

    const checkSharedTaskInfo = async () => {
      if (task.shared) {
        console.log("Checking shared task info for task:", task.id, task.title);
        
        // First check if shared_tasks is available in the task object
        if (task.shared_tasks && task.shared_tasks.length > 0) {
          console.log("Using shared_tasks from task object:", task.shared_tasks);
          
          // Check if current user shared this task with someone
          const sharedByMe = task.shared_tasks.find(
            st => st.shared_by_user_id === currentUserId
          );
          
          // Check if task was shared with current user
          const sharedWithMe = task.shared_tasks.find(
            st => st.shared_with_user_id === currentUserId
          );
          
          if (sharedByMe) {
            console.log("Current user shared this task with someone");
            setSharedByUser(true);
            
            const sharedWithUserId = sharedByMe.shared_with_user_id;
            if (sharedWithUserId) {
              const name = await fetchUserName(sharedWithUserId);
              setSharedWithName(name);
            }
          } else if (sharedWithMe) {
            console.log("This task was shared with current user");
            setSharedWithUser(true);
            
            const sharedByUserId = sharedWithMe.shared_by_user_id;
            if (sharedByUserId) {
              const name = await fetchUserName(sharedByUserId);
              setSharedByName(name);
            }
          }
        } else {
          // If shared_tasks not available in the task object, query the database
          console.log("shared_tasks not in task object, querying database");
          
          const { data: sharedTasks } = await supabase
            .from('shared_tasks')
            .select('*')
            .eq('task_id', task.id);
            
          console.log("Shared tasks from query:", sharedTasks);
          
          if (sharedTasks && sharedTasks.length > 0) {
            // Check if current user shared this task
            const sharedByMe = sharedTasks.find(
              st => st.shared_by_user_id === currentUserId
            );
              
            if (sharedByMe) {
              console.log("Found task shared by current user");
              setSharedByUser(true);
              
              const sharedWithUserId = sharedByMe.shared_with_user_id;
              if (sharedWithUserId) {
                const name = await fetchUserName(sharedWithUserId);
                setSharedWithName(name);
              }
            } else {
              // Check if task was shared with current user
              const sharedWithMe = sharedTasks.find(
                st => st.shared_with_user_id === currentUserId
              );
                
              if (sharedWithMe) {
                console.log("Found task shared with current user");
                setSharedWithUser(true);
                
                const sharedByUserId = sharedWithMe.shared_by_user_id;
                if (sharedByUserId) {
                  const name = await fetchUserName(sharedByUserId);
                  setSharedByName(name);
                }
              }
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
