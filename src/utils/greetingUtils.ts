
import { format } from "date-fns";
import { Task } from "@/components/dashboard/TaskBoard";

export function generateGreetingMessage(todayTasks: Task[], unscheduledTasks: Task[]) {
  const hour = new Date().getHours();
  let timeGreeting = "Hello";
  if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 18) timeGreeting = "Good afternoon";
  else timeGreeting = "Good evening";

  let message = `${timeGreeting}! `;
  const totalTasks = todayTasks.length + unscheduledTasks.length;
  
  if (totalTasks > 0) {
    message += `You have ${totalTasks} task${totalTasks === 1 ? '' : 's'} to manage `;
    if (todayTasks.length > 0) {
      message += `(${todayTasks.length} scheduled for today`;
      if (unscheduledTasks.length > 0) {
        message += ` and ${unscheduledTasks.length} unscheduled)`;
      } else {
        message += ")";
      }
    } else if (unscheduledTasks.length > 0) {
      message += `(all ${unscheduledTasks.length} unscheduled)`;
    }
    message += ".";
  } else {
    message += "You don't have any tasks to manage yet.";
  }

  return message;
}
