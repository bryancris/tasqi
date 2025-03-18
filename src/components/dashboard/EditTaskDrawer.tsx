
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Task } from "./TaskBoard";
import { ShareTaskDialog } from "./ShareTaskDialog";
import { EditTaskHeader } from "./edit-task/EditTaskHeader";
import { EditTaskContent } from "./edit-task/EditTaskContent";
import { useEditTaskState } from "./edit-task/useEditTaskState";

interface EditTaskDrawerProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDrawer({
  task,
  open,
  onOpenChange
}: EditTaskDrawerProps) {
  const {
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
    isLoading,
    isDeletingTask,
    showShareDialog,
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
    setShowShareDialog,
    handleDateChange,
    handleSubmit,
    handleDelete
  } = useEditTaskState(task, () => onOpenChange(false));

  console.log("EditTaskDrawer rendered, open state:", open);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="left" 
          className="w-[400px] sm:max-w-[540px] p-0 pt-4 flex flex-col h-[100dvh]"
          onOpenAutoFocus={e => e.preventDefault()}
          onPointerDownOutside={e => e.preventDefault()}
          onOpenChange={onOpenChange}
        >
          <div className="px-6 mb-2">
            <EditTaskHeader onShareClick={() => setShowShareDialog(true)} />
          </div>
          <div className="flex-1 overflow-hidden">
            <EditTaskContent
              task={task}
              title={title}
              description={description}
              isScheduled={isScheduled}
              isEvent={isEvent}
              isAllDay={isAllDay}
              date={date}
              startTime={startTime}
              endTime={endTime}
              priority={priority}
              reminderEnabled={reminderEnabled}
              reminderTime={reminderTime}
              subtasks={subtasks}
              isLoading={isLoading}
              isDeletingTask={isDeletingTask}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onIsScheduledChange={setIsScheduled}
              onIsEventChange={setIsEvent}
              onIsAllDayChange={setIsAllDay}
              onDateChange={handleDateChange}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onPriorityChange={setPriority}
              onReminderEnabledChange={setReminderEnabled}
              onReminderTimeChange={setReminderTime}
              onSubtasksChange={setSubtasks}
              onSubmit={handleSubmit}
              onDelete={handleDelete}
            />
          </div>
        </SheetContent>
      </Sheet>
      <ShareTaskDialog
        task={task}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </>
  );
}
