
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
    throw membersError;
  }

  if (groupMembers && groupMembers.length > 0) {
    const memberPromises = groupMembers.map(async member => {
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
        console.error('Assignment error:', assignmentError);
        throw assignmentError;
      }

      // Create and show notification
      await createTaskAssignmentNotification(member.trusted_user_id, taskData, true);
    });

    await Promise.all(memberPromises);
  }

  return sharedTask;
}
