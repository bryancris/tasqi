
import { SettingsContent } from "@/components/settings/SettingsContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardViewWrapper } from "@/components/dashboard/DashboardViewWrapper";

export default function Settings() {
  const isMobile = useIsMobile();

  return (
    <DashboardViewWrapper>
      <div className={`max-w-4xl mx-auto ${isMobile ? 'pb-4' : ''}`}>
        <h2 className="text-2xl font-semibold mb-6">Settings</h2>
        <SettingsContent />
      </div>
    </DashboardViewWrapper>
  );
}
