
import { SettingsContent } from "@/components/settings/SettingsContent";
import { CalendarViewProvider } from "@/contexts/CalendarViewContext";

export default function Settings() {
  return (
    <CalendarViewProvider>
      <SettingsContent />
    </CalendarViewProvider>
  );
}
