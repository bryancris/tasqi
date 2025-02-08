
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { emotions } from "./constants";
import { EmotionalLog } from "./types";

interface EmotionalLogCardProps {
  log: EmotionalLog;
}

export function EmotionalLogCard({ log }: EmotionalLogCardProps) {
  const emotion = emotions.find((e) => e.name === log.emotion);
  const Icon = emotion?.icon || Heart;

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full bg-white dark:bg-gray-900 shadow-lg`}>
          <Icon className={`w-6 h-6 ${emotion?.color || "text-pink-500"}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {log.emotion}
            </h3>
            <span className="text-sm text-muted-foreground">
              Intensity: {log.intensity}/5
            </span>
          </div>
          {log.notes && (
            <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
          )}
          {log.coping_strategy && (
            <p className="text-sm text-muted-foreground mt-1">
              Coping Strategy: {log.coping_strategy}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
