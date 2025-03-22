
import { SettingsContent } from "@/components/settings/SettingsContent";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Settings() {
  const isMobile = useIsMobile();

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? 'pb-4' : ''}`}>
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>
      <SettingsContent />
    </div>
  );
}
