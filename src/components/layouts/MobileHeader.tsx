
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { SearchDialog } from "@/components/search/SearchDialog";

export function MobileHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between gap-4">
          <HeaderTime />
          <div className="flex items-center gap-2">
            <AddTaskDrawer>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 hover:border-purple-500"
              >
                <Plus className="h-5 w-5 text-purple-600" />
              </Button>
            </AddTaskDrawer>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <SearchDialog isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
            <HeaderNotifications />
            <HeaderUserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
