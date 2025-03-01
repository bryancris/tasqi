
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export interface AddTaskHeaderProps {
  onShareClick?: () => void;
}

export function AddTaskHeader({
  onShareClick
}: AddTaskHeaderProps) {
  return (
    <SheetHeader className="sticky top-0 bg-background z-50 border-b py-[5px] px-[10px] mx-[15px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SheetTitle>Add New Task</SheetTitle>
          {onShareClick && (
            <Button size="sm" variant="outline" className="bg-blue-500 text-white hover:bg-blue-600" onClick={onShareClick}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          )}
        </div>
      </div>
    </SheetHeader>
  );
}
