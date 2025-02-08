
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function TaskSharingSettings() {
  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Task Sharing</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you share and collaborate on tasks with others
        </p>
      </div>
      <Separator className="my-6" />
    </div>
  );
}
