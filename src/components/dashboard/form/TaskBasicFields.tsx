
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TaskBasicFieldsProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function TaskBasicFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: TaskBasicFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-[#8B5CF6] font-medium">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Task title"
          required
          className="border-[#9b87f5]/20 focus:border-[#8B5CF6] transition-colors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[#8B5CF6] font-medium">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Task description"
          className="border-[#9b87f5]/20 focus:border-[#8B5CF6] transition-colors min-h-[100px]"
        />
      </div>
    </div>
  );
}
