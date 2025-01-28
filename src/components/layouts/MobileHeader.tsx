import { format } from "date-fns";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";

export function MobileHeader() {
  const currentTime = format(new Date(), 'HH:mm');
  const currentDate = format(new Date(), 'EEE, MMM d');

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b p-4 z-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#6366F1] font-medium">TasqiAI</h1>
          <p className="text-sm text-gray-500">{currentTime} {currentDate}</p>
        </div>
        <HeaderUserMenu />
      </div>
    </div>
  );
}