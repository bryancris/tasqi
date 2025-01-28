import { useState, useEffect } from "react";
import { format } from "date-fns";

export function useClock() {
  const [currentTime, setCurrentTime] = useState(format(new Date(), 'HH:mm'));
  const [currentDate] = useState(format(new Date(), 'EEE, MMM d'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'HH:mm'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return { currentTime, currentDate };
}