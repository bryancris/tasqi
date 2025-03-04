import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { playNotificationSound, trackUserInteraction } from "@/utils/notifications/soundUtils";

interface TimerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimerDialog({ isOpen, onOpenChange }: TimerDialogProps) {
  const isMobile = useIsMobile();
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("25");
  const [seconds, setSeconds] = useState("00");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [label, setLabel] = useState("");
  
  useEffect(() => {
    if (isOpen) {
      trackUserInteraction();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        console.log('🍎 Timer complete on iOS device, trying multiple sound approaches');
        
        try {
          await playNotificationSound();
        } catch (soundError) {
          console.warn('🍎 Primary sound method failed on iOS:', soundError);
          
          try {
            const audio = new Audio('/notification-sound.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.warn('🍎 Fallback iOS sound also failed:', e));
          } catch (fallbackError) {
            console.warn('🍎 All iOS sound methods failed:', fallbackError);
          }
        }
      } else {
        await playNotificationSound();
      }
      
      toast.success("Timer Complete!", {
        description: label ? `${label} timer finished` : "Your timer has finished",
      });
      
      if (Notification.permission === "granted") {
        new Notification("Timer Complete!", {
          body: label ? `${label} timer finished` : "Your timer has finished",
          icon: "/favicon.ico",
        });
      }
      
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (error) {
      console.error("Error handling timer completion:", error);
    }
  };

  const startTimer = () => {
    trackUserInteraction();
    
    const totalSeconds = 
      parseInt(hours) * 3600 + 
      parseInt(minutes) * 60 + 
      parseInt(seconds);
    
    if (totalSeconds <= 0) {
      toast.error("Please set a valid time");
      return;
    }
    
    setTimeLeft(totalSeconds);
    setIsRunning(true);
  };

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = time % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handlePresetClick = (mins: number) => {
    trackUserInteraction();
    
    setHours("00");
    setMinutes(mins.toString().padStart(2, "0"));
    setSeconds("00");
  };

  const resetTimer = () => {
    trackUserInteraction();
    
    setIsRunning(false);
    setTimeLeft(0);
    setHours("00");
    setMinutes("25");
    setSeconds("00");
    setLabel("");
  };

  const TimerContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="hours">Hours</Label>
          <Input
            id="hours"
            value={hours}
            onChange={(e) => {
              trackUserInteraction();
              setHours(e.target.value.padStart(2, "0"));
            }}
            maxLength={2}
            disabled={isRunning}
          />
        </div>
        <div>
          <Label htmlFor="minutes">Minutes</Label>
          <Input
            id="minutes"
            value={minutes}
            onChange={(e) => {
              trackUserInteraction();
              setMinutes(e.target.value.padStart(2, "0"));
            }}
            maxLength={2}
            disabled={isRunning}
          />
        </div>
        <div>
          <Label htmlFor="seconds">Seconds</Label>
          <Input
            id="seconds"
            value={seconds}
            onChange={(e) => {
              trackUserInteraction();
              setSeconds(e.target.value.padStart(2, "0"));
            }}
            maxLength={2}
            disabled={isRunning}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Quick Presets</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handlePresetClick(5)}
            disabled={isRunning}
          >
            5 min
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePresetClick(10)}
            disabled={isRunning}
          >
            10 min
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePresetClick(25)}
            disabled={isRunning}
          >
            25 min
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Label (optional)</Label>
        <Input
          id="label"
          placeholder="Focus Session"
          value={label}
          onChange={(e) => {
            trackUserInteraction();
            setLabel(e.target.value);
          }}
          disabled={isRunning}
        />
      </div>

      {isRunning ? (
        <div className="space-y-4">
          <div className="text-center text-2xl font-bold">
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => {
              trackUserInteraction();
              setIsRunning(false);
            }} variant="outline">
              Pause
            </Button>
            <Button onClick={resetTimer} variant="destructive">
              Reset
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 justify-end">
          <Button onClick={resetTimer} variant="outline">
            Reset
          </Button>
          <Button onClick={startTimer}>Start Timer</Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => {
        if (open) trackUserInteraction();
        onOpenChange(open);
      }}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Set Timer</SheetTitle>
          </SheetHeader>
          <TimerContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (open) trackUserInteraction();
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Timer</DialogTitle>
        </DialogHeader>
        <TimerContent />
      </DialogContent>
    </Dialog>
  );
}
