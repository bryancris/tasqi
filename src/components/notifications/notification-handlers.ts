
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addMinutes, setHours, setMinutes, startOfTomorrow } from "date-fns";
import { QueryClient } from "@tanstack/react-query";

export const handleSnooze = async (
  reference_id: number | null,
  minutes: number,
  queryClient: QueryClient,
  onDismiss: () => void
) => {
  if (!reference_id) {
    console.error('No task ID found');
    return;
  }

  // First, get the current task data
  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select('reschedule_count')
    .eq('id', reference_id)
    .single();

  if (fetchError) throw fetchError;

  const now = new Date();
  let newReminderTime: Date;

  if (minutes === 24 * 60) { // Tomorrow
    newReminderTime = startOfTomorrow();
    newReminderTime = setHours(newReminderTime, 9); // Set to 9 AM tomorrow
    newReminderTime = setMinutes(newReminderTime, 0);
  } else {
    newReminderTime = addMinutes(now, minutes);
  }

  const { error: taskError } = await supabase
    .from('tasks')
    .update({
      reminder_time: minutes,
      reschedule_count: (currentTask?.reschedule_count ?? 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', reference_id);

  if (taskError) throw taskError;

  toast.success(`Task snoozed for ${minutes} minutes`);
  await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  onDismiss();
};

export const handleEdit = async (
  reference_id: number | null,
  queryClient: QueryClient,
  onDismiss: () => void
) => {
  if (!reference_id) {
    console.error('No task ID found');
    return;
  }

  onDismiss();
  queryClient.setQueryData(['editTaskId'], reference_id);
};

export const handleStart = async (
  reference_id: number | null,
  queryClient: QueryClient,
  onDismiss: () => void
) => {
  if (!reference_id) {
    console.error('No task ID found');
    return;
  }

  const { error: taskError } = await supabase
    .from('tasks')
    .update({
      status: 'in_progress',
      is_tracking: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', reference_id);

  if (taskError) throw taskError;

  toast.success('Task started');
  await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  onDismiss();
};
