
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";

export function DesktopHeader() {
  return (
    <div className="absolute top-0 right-0 p-4 flex items-center gap-2 z-10">
      <HeaderNotifications />
      <HeaderUserMenu />
    </div>
  );
}
