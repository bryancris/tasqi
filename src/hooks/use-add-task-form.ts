
import { useState } from "react";
import { format } from "date-fns";
import { TaskPriority } from "@/components/dashboard/TaskBoard";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";

interface UseAddTaskFormProps {
  initialDate?: Date;
}

export function useAddTaskForm({ initialDate }: UseAddTaskFormProps = {}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isScheduled, setIsScheduled] = useState(!!initialDate);
  const [isEvent, setIsEvent] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [date, setDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  // Default is already correctly set to 0 (At start time)
  const [reminderTime, setReminderTime] = useState(0);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIsScheduled(!!initialDate);
    setIsEvent(false);
    setIsAllDay(false);
    setDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : "");
    setStartTime("");
    setEndTime("");
    setPriority("medium");
    setReminderEnabled(false);
    setReminderTime(0); // Reset to "At start time"
    setSubtasks([]);
  };

  return {
    formState: {
      title,
      description,
      isScheduled,
      isEvent,
      isAllDay,
      date,
      startTime,
      endTime,
      priority,
      reminderEnabled,
      reminderTime,
      subtasks,
      isLoading
    },
    formActions: {
      setTitle,
      setDescription,
      setIsScheduled,
      setIsEvent,
      setIsAllDay,
      setDate,
      setStartTime,
      setEndTime,
      setPriority,
      setReminderEnabled,
      setReminderTime,
      setSubtasks,
      setIsLoading,
      resetForm
    }
  };
}
