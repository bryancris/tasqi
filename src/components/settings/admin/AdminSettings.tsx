
import { Shield } from "lucide-react";

export function AdminSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-[#8B5CF6]" />
        <h3 className="text-lg font-medium">Admin Settings</h3>
      </div>
      
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Admin configuration options will be added here.
        </p>
      </div>
    </div>
  );
}
