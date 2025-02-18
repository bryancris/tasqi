
import { useClock } from "@/hooks/use-clock";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function HeaderTime() {
  const { currentTime, currentDate } = useClock();
  const [isDay, setIsDay] = useState(true);

  useEffect(() => {
    const checkDayTime = () => {
      const hour = new Date().getHours();
      setIsDay(hour >= 6 && hour < 18); // Day time between 6 AM and 6 PM
    };

    checkDayTime();
    const interval = setInterval(checkDayTime, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-[#6366F1] font-semibold text-2xl">Tasqi</h1>
      {isDay ? (
        <Sun className="h-4 w-4 text-yellow-500" />
      ) : (
        <Moon className="h-4 w-4 text-blue-500" />
      )}
      <span className="text-xs text-[#333333] whitespace-nowrap">{currentTime} {currentDate}</span>
    </div>
  );
}
