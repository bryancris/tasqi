
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { Button } from "@/components/ui/button";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";

export function MobileHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between gap-4">
          <HeaderTime />
          <div className="flex items-center gap-2">
            <AddTaskDrawer>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <span className="text-lg font-semibold">+</span>
              </Button>
            </AddTaskDrawer>
            <HeaderNotifications />
            <HeaderUserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
