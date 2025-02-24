
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { CalendarViewProvider } from "@/contexts/CalendarViewContext";

export default function Settings() {
  const isMobile = useIsMobile();
  console.log("Is Mobile in Settings:", isMobile); // Added for debugging

  if (isMobile) {
    return (
      <CalendarViewProvider>
        <div className="flex flex-col h-screen bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto scrollbar-hide p-4 mt-[72px] mb-[64px]">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6">Settings</h2>
              <SettingsContent />
            </div>
          </main>
          <MobileFooter />
        </div>
      </CalendarViewProvider>
    );
  }

  return (
    <CalendarViewProvider>
      <div className="flex h-screen bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
        <Sidebar 
          selectedDate={new Date()} 
          onDateChange={() => {}} 
        />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Settings</h2>
            <SettingsContent />
          </div>
        </div>
      </div>
    </CalendarViewProvider>
  );
}
