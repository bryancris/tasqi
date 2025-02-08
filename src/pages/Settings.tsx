
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SettingsContent } from "@/components/settings/SettingsContent";

const Settings = () => {
  // These props are required by DashboardLayout but not used in settings
  const dummyDate = new Date();
  const dummyDateChange = () => {};

  return (
    <div className="bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF] min-h-screen">
      <DashboardLayout 
        selectedDate={dummyDate}
        onDateChange={dummyDateChange}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Settings</h2>
          <SettingsContent />
        </div>
      </DashboardLayout>
    </div>
  );
};

export default Settings;
