import { useClock } from "@/hooks/use-clock";

export function HeaderTime() {
  const { currentTime, currentDate } = useClock();
  
  return (
    <p className="text-sm text-gray-500">{currentTime} {currentDate}</p>
  );
}