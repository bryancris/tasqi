import { format } from "date-fns";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";

export function MobileHeader() {
  const currentTime = format(new Date(), 'HH:mm');
  const currentDate = format(new Date(), 'EEE, MMM d');

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b p-4 z-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#6366F1] font-medium">TasqiAI</h1>
          <p className="text-sm text-gray-500">{currentTime} {currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <AddTaskDrawer>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors rounded-full"
            >
              <Plus className="h-5 w-5 text-white" />
            </Button>
          </AddTaskDrawer>
          <HeaderUserMenu />
        </div>
      </div>
    </div>
  );
}