
import { cn } from "@/lib/utils";
import { Check, CheckCircle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskStatusIndicatorProps {
  status: string;
  time?: string | null;
  rescheduleCount?: number;
  onClick?: (e: React.MouseEvent) => void;
}

export function TaskStatusIndicator({ status, time, rescheduleCount = 0, onClick }: TaskStatusIndicatorProps) {
  const renderIcon = () => {
    if (status === 'completed') {
      return (
        <div 
          onClick={onClick}
          className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      );
    }

    if (status === 'unscheduled') {
      return (
        <div 
          onClick={onClick}
          className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer text-white/80 hover:text-white transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div 
        onClick={onClick}
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center cursor-pointer",
          "text-white/80 hover:text-white transition-colors"
        )}
      >
        <Clock className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center">
      {rescheduleCount > 0 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                {renderIcon()}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-amber-900">{rescheduleCount > 9 ? '9+' : rescheduleCount}</span>
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white border-slate-700">
              <p>Rescheduled {rescheduleCount} {rescheduleCount === 1 ? 'time' : 'times'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        renderIcon()
      )}
    </div>
  );
}
