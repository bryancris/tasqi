
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Check } from "lucide-react";

export interface Subtask {
  id?: number;
  title: string;
  status: 'pending' | 'completed';
  position: number;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
}

export function SubtaskList({ subtasks, onSubtasksChange }: SubtaskListProps) {
  const [newSubtask, setNewSubtask] = useState("");

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const newSubtasks = [
      ...subtasks,
      {
        title: newSubtask.trim(),
        status: 'pending',
        position: subtasks.length,
      }
    ];
    onSubtasksChange(newSubtasks);
    setNewSubtask("");
  };

  const removeSubtask = (index: number) => {
    const newSubtasks = subtasks.filter((_, i) => i !== index);
    onSubtasksChange(newSubtasks);
  };

  const toggleSubtask = (index: number) => {
    const newSubtasks = subtasks.map((subtask, i) => {
      if (i === index) {
        return {
          ...subtask,
          status: subtask.status === 'pending' ? 'completed' : 'pending'
        };
      }
      return subtask;
    });
    onSubtasksChange(newSubtasks);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Add a subtask"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSubtask();
            }
          }}
        />
        <Button 
          type="button"
          variant="outline"
          onClick={addSubtask}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {subtasks.map((subtask, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSubtask(index)}
              className={subtask.status === 'completed' ? 'text-green-600' : ''}
            >
              <Check className="h-4 w-4" />
            </Button>
            <span className={`flex-1 ${subtask.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
              {subtask.title}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeSubtask(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
