import { Task } from "@/components/dashboard/TaskBoard";
import { isSameDay, parseISO, startOfDay } from "date-fns";

export const filterScheduledTasks = (tasks: Task[] = []) => 
  tasks.filter(task => task.status === 'scheduled' && task.date && task.start_time);

export const filterUnscheduledTasks = (tasks: Task[] = []) => 
  tasks.filter(task => task.status === 'unscheduled');

export const calculateVisitsPerDay = (weekDays: Date[], scheduledTasks: Task[]) => {
  return weekDays.map(day => {
    const dayTasks = scheduledTasks.filter(task => {
      if (!task.date) return false;
      const taskDate = startOfDay(parseISO(task.date));
      const currentDay = startOfDay(day);
      return isSameDay(taskDate, currentDay);
    });
    return `${dayTasks.length} ${dayTasks.length === 1 ? 'Visit' : 'Visits'}`;
  });
};