
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { emotions } from "./constants";
import { EmotionalLogFormData } from "./types";

interface EmotionalLogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newLog: EmotionalLogFormData;
  onLogChange: (log: EmotionalLogFormData) => void;
  onSubmit: () => Promise<void>;
}

export function EmotionalLogDialog({
  isOpen,
  onOpenChange,
  newLog,
  onLogChange,
  onSubmit,
}: EmotionalLogDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Emotional Care Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="emotion">Emotion</Label>
            <Select
              value={newLog.emotion}
              onValueChange={(value) =>
                onLogChange({ ...newLog, emotion: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select emotion" />
              </SelectTrigger>
              <SelectContent>
                {emotions.map((emotion) => (
                  <SelectItem key={emotion.name} value={emotion.name}>
                    {emotion.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="intensity">Intensity (1-5)</Label>
            <Select
              value={newLog.intensity}
              onValueChange={(value) =>
                onLogChange({ ...newLog, intensity: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select intensity" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newLog.notes}
              onChange={(e) =>
                onLogChange({ ...newLog, notes: e.target.value })
              }
              placeholder="How are you feeling?"
            />
          </div>
          <div>
            <Label htmlFor="coping">Coping Strategy</Label>
            <Input
              id="coping"
              value={newLog.coping_strategy}
              onChange={(e) =>
                onLogChange({ ...newLog, coping_strategy: e.target.value })
              }
              placeholder="What helps you cope?"
            />
          </div>
          <Button onClick={onSubmit} className="w-full">
            Save Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
