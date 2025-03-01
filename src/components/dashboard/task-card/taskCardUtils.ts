
import { Task } from "../TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";

export function getTimeDisplay(task: Task): string {
  if (task.start_time && task.end_time) {
    const startTime = task.start_time.split(':').slice(0, 2).join(':');
    const endTime = task.end_time.split(':').slice(0, 2).join(':');
    return `${startTime} - ${endTime}`;
  }
  return '';
}

export function getCardColor(task: Task): string {
  if (task.status === 'completed') {
    return 'bg-[#8E9196]'; // Dark gray for completed tasks
  }
  if (task.status === 'unscheduled') {
    return 'bg-[#2196F3]';
  }
  if (task.status === 'event') {
    return 'bg-[rgb(5,242,222)]'; // Event color
  }
  return getPriorityColor(task.priority);
}

export function hasVoiceNote(task: Task): boolean {
  return !!task.task_attachments?.some(
    attachment => attachment.content_type === 'audio/webm'
  );
}

export function hasFileAttachments(task: Task): boolean {
  return !!task.task_attachments?.some(
    attachment => attachment.content_type !== 'audio/webm'
  );
}
