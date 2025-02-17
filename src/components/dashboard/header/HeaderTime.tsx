
import { useClock } from "@/hooks/use-clock";
import { useEffect, useState } from "react";

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
      <span className="text-sm text-[#333333] whitespace-nowrap">{currentTime} {currentDate}</span>
    </div>
  );
}
