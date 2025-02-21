import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { X, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { createTask } from "@/utils/taskUtils";
import { TaskPriority } from "./TaskBoard";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShareTaskDialog } from "./ShareTaskDialog";
import { Subtask } from "./subtasks/SubtaskList";
import { AddTaskContent } from "./add-task/AddTaskContent";

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
  const [reminderTime, setReminderTime] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const keyBuffer = useRef<string>("");
  const keyTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isMobile) return; // Only add keyboard shortcuts on desktop

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Prevent multiple triggers from key being held down
      
      // Clear the key buffer after 500ms of no keypress
      if (keyTimeout.current) {
        clearTimeout(keyTimeout.current);
      }
      keyTimeout.current = setTimeout(() => {
        keyBuffer.current = "";
      }, 500);

      // Add the current key to the buffer
      keyBuffer.current += e.key;

      // Check if the buffer ends with `t and drawer is not already open
      if (keyBuffer.current.endsWith("`t") && !isOpen) {
        e.preventDefault(); // Prevent the key from being typed
        keyBuffer.current = ""; // Reset the buffer
        setIsOpen(true);
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (keyTimeout.current) {
        clearTimeout(keyTimeout.current);
      }
    };
  }, [isMobile, isOpen]); // Keep isOpen in dependencies

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
        reminderTime,
        subtasks
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
      setReminderTime(15);
      setSubtasks([]);
      setIsOpen(false);

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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild ref={triggerRef}>
        {children || (
          <Button className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white text-base font-semibold py-6">
            + Add a task
          </Button>
        )}
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[400px] sm:max-w-[540px]"
      >
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle>Add New Task</SheetTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-4 w-4 text-[#0EA5E9]" />
              </Button>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        
        <AddTaskContent
          title={title}
          description={description}
          isScheduled={isScheduled}
          date={date}
          startTime={startTime}
          endTime={endTime}
          priority={priority}
          reminderEnabled={reminderEnabled}
          reminderTime={reminderTime}
          subtasks={subtasks}
          isLoading={isLoading}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onIsScheduledChange={setIsScheduled}
          onDateChange={setDate}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onPriorityChange={setPriority}
          onReminderEnabledChange={setReminderEnabled}
          onReminderTimeChange={setReminderTime}
          onSubtasksChange={setSubtasks}
          onSubmit={handleSubmit}
        />
      </SheetContent>
      <ShareTaskDialog
        task={null}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </Sheet>
  );
}
