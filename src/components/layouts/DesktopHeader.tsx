
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { SearchDialog } from "@/components/search/SearchDialog";

export function DesktopHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="absolute top-0 right-0 p-4 flex items-center gap-2 z-10">
      <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
        <Search className="h-5 w-5" />
      </Button>
      <SearchDialog isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <HeaderNotifications />
      <HeaderUserMenu />
    </div>
  );
}
