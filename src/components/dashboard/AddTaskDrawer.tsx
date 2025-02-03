import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "./TaskForm";
import { createTask } from "@/utils/taskUtils";
import { TaskPriority } from "./TaskBoard";

interface AddTaskDrawerProps {
  children?: React.ReactNode;
}

export function AddTaskDrawer({ children }: AddTaskDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("low");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      const taskData = {
        title,
        description,
        isScheduled,
        date: isScheduled && date ? date : null,
        startTime: isScheduled && startTime ? startTime : null,
        endTime: isScheduled && endTime ? endTime : null,
        priority,
        reminderEnabled,
      };

      await createTask(taskData);

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      setTitle("");
      setDescription("");
      setIsScheduled(false);
      setDate("");
      setStartTime("");
      setEndTime("");
      setPriority("low");
      setReminderEnabled(false);

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children || (
          <Button className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white text-base font-semibold py-6">
            + Add a task
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="w-[400px] left-0 right-auto">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle>Add New Task</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <TaskForm
            title={title}
            description={description}
            isScheduled={isScheduled}
            date={date}
            startTime={startTime}
            endTime={endTime}
            priority={priority}
            reminderEnabled={reminderEnabled}
            isLoading={isLoading}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onIsScheduledChange={setIsScheduled}
            onDateChange={setDate}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onPriorityChange={setPriority}
            onReminderEnabledChange={setReminderEnabled}
            onSubmit={handleSubmit}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}