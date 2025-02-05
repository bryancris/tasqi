
import { useClock } from "@/hooks/use-clock";
import { Sun, Moon } from "lucide-react";
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
    <div className="flex flex-col items-start space-y-1">
      <div className="flex items-center space-x-2">
        {isDay ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-blue-400" />
        )}
        <h1 className="text-[#6366F1] font-semibold text-2xl">TasqiAI</h1>
      </div>
      <p className="text-sm text-[#333333] pl-7">
        {currentTime} {currentDate}
      </p>
    </div>
  );
}
