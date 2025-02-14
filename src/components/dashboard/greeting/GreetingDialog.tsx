
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task } from "@/components/dashboard/TaskBoard";
import { Button } from "@/components/ui/button";
import { Check, CalendarRange } from "lucide-react";

interface GreetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  greetingMessage: string;
  todaysTaskDetails: Task[];
  unscheduledTasks: Task[];
}

export function GreetingDialog({
  open,
  onOpenChange,
  greetingMessage,
  todaysTaskDetails,
  unscheduledTasks,
}: GreetingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <CalendarRange className="h-6 w-6" />
            Daily Briefing
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-white text-lg py-2 leading-relaxed">
            {greetingMessage}
          </div>
          
          {todaysTaskDetails.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-medium">Today's Schedule:</h3>
              <div className="space-y-2">
                {todaysTaskDetails.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-white/10 rounded-lg p-3 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <div className="text-white font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 text-white/70" />
                      {task.title}
                    </div>
                    <div className="text-white/80 text-sm ml-6">
                      {task.start_time ? format(new Date(`2000-01-01 ${task.start_time}`), 'h:mm a') : 'Anytime'} 
                      {task.end_time && ` - ${format(new Date(`2000-01-01 ${task.end_time}`), 'h:mm a')}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {unscheduledTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-medium">Unscheduled Tasks:</h3>
              <div className="space-y-2">
                {unscheduledTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border-l-4 border-yellow-400 hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <div className="text-white font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-white/80 text-sm">{task.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              onClick={() => onOpenChange(false)}
            >
              I'll review later
            </Button>
            <Button 
              className="bg-white text-violet-600 hover:bg-white/90"
              onClick={() => onOpenChange(false)}
            >
              Looks good, thanks!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
