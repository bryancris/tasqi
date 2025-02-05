
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
    <div className="flex items-center space-x-2">
      {isDay ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-blue-400" />
      )}
      <p className="text-sm text-gray-500">
        <span className="font-medium">{currentTime}</span>
        {" "}
        <span className="text-gray-400">{currentDate}</span>
      </p>
    </div>
  );
}
