import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "./TaskForm";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskPriority } from "./TaskBoard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isLoading, setIsLoading] = useState(false);
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
          start_time: isScheduled ? startTime : null,
          end_time: isScheduled ? endTime : null,
          priority,
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
              <DrawerTitle>Edit Task</DrawerTitle>
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
              isLoading={isLoading}
              isEditing={true}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onIsScheduledChange={setIsScheduled}
              onDateChange={setDate}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onPriorityChange={setPriority}
              onSubmit={handleSubmit}
            />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the task.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}