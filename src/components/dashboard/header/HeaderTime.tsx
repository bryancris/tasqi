
import { useClock } from "@/hooks/use-clock";

export function HeaderTime() {
  const { currentTime, currentDate } = useClock();

  return (
    <div className="flex flex-col">
      <h1 className="text-[#6366F1] font-semibold text-2xl">Tasqi</h1>
      <span className="text-xs text-[#333333]">{currentTime} {currentDate}</span>
    </div>
  );
}
