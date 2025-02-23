
import { Label } from "@/components/ui/label";
import { FileAttachmentInput } from "./FileAttachmentInput";
import { TaskAttachments } from "./TaskAttachments";
import { Task } from "../TaskBoard";
import { useState } from "react";
import { VoiceNoteRecorder } from "./voice-note/VoiceNoteRecorder";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskAttachmentFieldsProps {
  task?: Task;
  isEditing?: boolean;
}

export function TaskAttachmentFields({ task, isEditing }: TaskAttachmentFieldsProps) {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const handleVoiceNoteComplete = async (audioBlob: Blob) => {
    if (!task?.id) {
      toast.error('Please save the task first to attach voice notes');
      return;
    }

    try {
      // Generate a unique filename
      const filename = `voice-note-${Date.now()}.webm`;
      const filePath = `${task.id}/${filename}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm'
        });

      if (uploadError) throw uploadError;

      // Save attachment metadata
      const { error: dbError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: task.id,
          file_name: filename,
          file_path: filePath,
          content_type: 'audio/webm',
          size: audioBlob.size
        });

      if (dbError) throw dbError;

      toast.success('Voice note added successfully');
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error saving voice note:', error);
      toast.error('Failed to save voice note');
    }
  };

  return (
    <div className="space-y-2">
      <Label>Attachments</Label>
      <div className="flex gap-2 mb-4">
        <FileAttachmentInput 
          taskId={task?.id} 
          isDisabled={!isEditing && !task?.id}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowVoiceRecorder(true)}
          disabled={!isEditing && !task?.id}
        >
          <Mic className="h-4 w-4 mr-2" />
          Voice Note
        </Button>
      </div>

      {showVoiceRecorder && (
        <VoiceNoteRecorder
          onRecordingComplete={handleVoiceNoteComplete}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}

      {!isEditing && !task?.id && (
        <p className="text-sm text-muted-foreground">
          Save the task first to add attachments
        </p>
      )}
      
      <TaskAttachments taskId={task?.id} isEditing={isEditing} />
    </div>
  );
}
