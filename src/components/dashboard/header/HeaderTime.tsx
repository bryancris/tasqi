
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
    <div className="flex flex-col items-start">
      <h1 className="text-[#6366F1] font-semibold text-2xl">Tasqi</h1>
      <p className="text-sm text-[#333333]">
        {currentTime} {currentDate}
      </p>
    </div>
  );
}
