
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Share2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "./TaskForm";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskPriority } from "./TaskBoard";
import { DeleteTaskAlert } from "./DeleteTaskAlert";
import { ShareTaskDialog } from "./ShareTaskDialog";

interface EditTaskDrawerProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDrawer({ task, open, onOpenChange }: EditTaskDrawerProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [isScheduled, setIsScheduled] = useState(task.status === "scheduled");
  const [date, setDate] = useState(task.date || "");
  const [startTime, setStartTime] = useState(task.start_time || "");
  const [endTime, setEndTime] = useState(task.end_time || "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority || "low");
  const [reminderEnabled, setReminderEnabled] = useState(task.reminder_enabled || false);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("tasks")
        .update({
          title,
          description,
          date: isScheduled ? date : null,
          status: isScheduled ? "scheduled" : "unscheduled",
          start_time: isScheduled && startTime ? startTime : null,
          end_time: isScheduled && endTime ? endTime : null,
          priority,
          reminder_enabled: reminderEnabled,
        })
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-[400px] left-0 right-auto">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DrawerTitle>Edit Task</DrawerTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="h-4 w-4 text-[#0EA5E9]" />
                </Button>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="p-4 space-y-4">
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
              isEditing={true}
              task={task}
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
            
            <DeleteTaskAlert 
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </DrawerContent>
      <ShareTaskDialog
        task={task}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </Drawer>
  );
}
