
import { supabase } from "@/integrations/supabase/client";
import { createTaskAssignmentNotification } from "./notifications";
import { TaskData } from "./types";

export async function shareWithGroup(
  taskData: TaskData,
  groupId: string,
  currentUserId: string,
  initialStatus: string = 'pending'
) {
  const parsedGroupId = parseInt(groupId, 10);
  console.log(`Sharing task ${taskData.id} with group ${parsedGroupId}`);

  try {
    // Create shared task record for group
    const { data: sharedTask, error: shareError } = await supabase
      .from('shared_tasks')
      .insert({
        task_id: taskData.id,
        group_id: parsedGroupId,
        shared_by_user_id: currentUserId,
        sharing_type: 'group',
        status: initialStatus
      })
      .select()
      .single();

    if (shareError) {
      console.error('Share with group error:', shareError);
      throw shareError;
    }

    // Get group members
    const { data: groupMembers, error: membersError } = await supabase
      .from('task_group_members')
      .select('trusted_user_id')
      .eq('group_id', parsedGroupId);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      // Continue with the sharing process even if we can't get members
      return sharedTask;
    }

    if (groupMembers && groupMembers.length > 0) {
      console.log(`Found ${groupMembers.length} members in group ${parsedGroupId}`);
      
      // Process each member one by one to avoid all-or-nothing failures
      for (const member of groupMembers) {
        try {
          // Create task assignment for each member
          const { error: assignmentError } = await supabase
            .from('task_assignments')
            .insert({
              task_id: taskData.id,
              assignee_id: member.trusted_user_id,
              assigned_by_id: currentUserId,
              status: initialStatus
            });

          if (assignmentError) {
            console.error(`Assignment error for member ${member.trusted_user_id}:`, assignmentError);
            // Continue with other members
          }

          // Create and show notification
          try {
            await createTaskAssignmentNotification(member.trusted_user_id, taskData, true);
          } catch (notificationError) {
            console.error(`Notification error for member ${member.trusted_user_id}:`, notificationError);
            // Continue with other members
          }
        } catch (memberError) {
          console.error(`Error processing group member ${member.trusted_user_id}:`, memberError);
          // Continue with other members
        }
      }
    } else {
      console.log(`No members found in group ${parsedGroupId}`);
    }

    return sharedTask;
  } catch (error) {
    console.error(`Error in shareWithGroup for group ${parsedGroupId}:`, error);
    throw error;
  }
}
