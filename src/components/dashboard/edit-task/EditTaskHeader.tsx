import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
interface EditTaskHeaderProps {
  onShareClick: () => void;
}
export function EditTaskHeader({
  onShareClick
}: EditTaskHeaderProps) {
  return <SheetHeader className="sticky top-0 bg-background z-50 border-b py-[5px] px-[10px] mx-[15px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SheetTitle>Edit Task</SheetTitle>
          <Button size="sm" variant="outline" className="bg-blue-500 text-white hover:bg-blue-600" onClick={onShareClick}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </SheetHeader>;
}