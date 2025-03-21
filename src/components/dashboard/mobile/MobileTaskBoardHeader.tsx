
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { isIOSPWA } from "@/utils/platform-detection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";

interface MobileTaskBoardHeaderProps {
  view: 'board' | 'timeline';
  onViewChange: (view: 'board' | 'timeline') => void;
}

export function MobileTaskBoardHeader({ view, onViewChange }: MobileTaskBoardHeaderProps) {
  const isIOSPwaApp = isIOSPWA();
  const isMobile = useIsMobile();
  
  // Log mobile status for debugging
  useEffect(() => {
    console.log("MobileTaskBoardHeader - isMobile:", isMobile);
  }, [isMobile]);
  
  return (
    <CardHeader className={`pb-3 px-4 ${isIOSPwaApp ? 'pt-1' : ''}`}>
      <div className="flex items-center justify-between">
        <CardTitle className="text-2xl font-semibold">
          {view === 'board' ? (
            <span className="text-gradient">Task Board</span>
          ) : (
            <span className="text-gradient">Timeline</span>
          )}
        </CardTitle>
        <Button
          variant="rainbow"
          onClick={() => onViewChange(view === 'board' ? 'timeline' : 'board')}
          className="text-base font-medium"
        >
          Switch to {view === 'board' ? 'Timeline' : 'Board'}
        </Button>
      </div>
    </CardHeader>
  );
}
