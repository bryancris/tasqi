
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareTaskParams {
  taskId: number;
  selectedUserIds: string[];
  selectedGroupId: string;
  sharingType: "individual" | "group";
  currentUserId: string;
}

interface TaskGroupMember {
  trusted_user_id: string;
  group_id: number;
  role: 'admin' | 'member';
}

export async function shareTask({
  taskId,
  selectedUserIds,
  selectedGroupId,
  sharingType,
  currentUserId,
}: ShareTaskParams) {
  try {
    // First get the task's current status to preserve it
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('Error fetching task:', taskError);
      throw taskError;
    }

    if (sharingType === 'individual') {
      // Create shared task records and task assignments for each selected user
      const promises = selectedUserIds.map(async (userId) => {
        // 1. Create shared task record
        const { data: sharedTask, error: shareError } = await supabase
          .from('shared_tasks')
          .insert({
            task_id: taskId,
            shared_with_user_id: userId,
            shared_by_user_id: currentUserId,
            sharing_type: 'individual',
            status: taskData.status === 'completed' ? 'completed' : 'pending'
          })
          .select()
          .single();

        if (shareError) {
          console.error('Share task error:', shareError);
          throw shareError;
        }

        // 2. Create task assignment record
        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert({
            task_id: taskId,
            assignee_id: userId,
            assigned_by: currentUserId,
            status: taskData.status === 'completed' ? 'completed' : 'pending'
          });

        if (assignmentError) {
          console.error('Assignment error:', assignmentError);
          throw assignmentError;
        }

        // 3. Create notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'New Task Assignment',
            message: `You have been assigned to: ${taskData.title}`,
            type: 'task_assignment',
            reference_id: taskId.toString(),
            reference_type: 'task'
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          throw notificationError;
        }

        return sharedTask;
      });

      const results = await Promise.all(promises);
      const errors = results.filter(result => !result);

      if (errors.length > 0) {
        console.error('Share task errors:', errors);
        throw new Error('Failed to share task with some users');
      }

      // Show success toast
      if (selectedUserIds.length === 1) {
        toast.success('Task shared successfully');
      } else {
        toast.success(`Task shared with ${selectedUserIds.length} users`);
      }

    } else {
      // Share with group
      const groupId = parseInt(selectedGroupId, 10);
      
      // 1. Create shared task record for group
      const { data: sharedTask, error: shareError } = await supabase
        .from('shared_tasks')
        .insert({
          task_id: taskId,
          group_id: groupId,
          shared_by_user_id: currentUserId,
          sharing_type: 'group',
          status: taskData.status === 'completed' ? 'completed' : 'pending'
        })
        .select()
        .single();

      if (shareError) {
        console.error('Share with group error:', shareError);
        throw shareError;
      }

      // 2. Get group members and create assignments and notifications for each
      const { data: groupMembers, error: membersError } = await supabase
        .from('task_group_members')
        .select('trusted_user_id')
        .eq('group_id', groupId);

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
              task_id: taskId,
              assignee_id: member.trusted_user_id,
              assigned_by: currentUserId,
              status: taskData.status === 'completed' ? 'completed' : 'pending'
            });

          if (assignmentError) {
            console.error('Assignment error:', assignmentError);
            throw assignmentError;
          }

          // Create notification for each member
          return supabase
            .from('notifications')
            .insert({
              user_id: member.trusted_user_id,
              title: 'New Group Task Assignment',
              message: `A new task has been shared with your group: ${taskData.title}`,
              type: 'task_assignment',
              reference_id: taskId.toString(),
              reference_type: 'task'
            });
        });

        await Promise.all(memberPromises);
      }

      // Show success toast
      toast.success('Task shared with group successfully');
    }

    // Update the task's shared status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        shared: true,
        // Ensure we preserve the original status and scheduling
        status: taskData.status,
        date: taskData.date,
        start_time: taskData.start_time,
        end_time: taskData.end_time,
        priority: taskData.priority
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Update task shared status error:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Share task error:', error);
    toast.error('Failed to share task. Please try again.');
    throw error;
  }
}
