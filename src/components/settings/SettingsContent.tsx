import { ThemeToggle } from "./ThemeToggle";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SettingsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how the app looks and feels
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Theme</Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark mode
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}