
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TaskAttachment } from "./types";
import { AttachmentPreview } from "./attachment/AttachmentPreview";
import { AttachmentActions } from "./attachment/AttachmentActions";
import { AttachmentDialog } from "./attachment/AttachmentDialog";

interface TaskAttachmentsProps {
  taskId?: number;
  isEditing?: boolean;
}

export function TaskAttachments({ taskId, isEditing }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [selectedFile, setSelectedFile] = useState<TaskAttachment | null>(null);

  useEffect(() => {
    if (taskId) {
      loadAttachments();
    }
    // Cleanup preview URLs on unmount
    return () => {
      Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [taskId]);

  const loadAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId);

      if (error) throw error;
      
      setAttachments(data || []);

      // Load previews for image and PDF attachments
      data?.forEach(async (attachment) => {
        if (attachment.content_type.startsWith('image/') || attachment.content_type === 'application/pdf') {
          loadFilePreview(attachment);
        }
      });
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error('Failed to load attachments');
    }
  };

  const loadFilePreview = async (attachment: TaskAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrls(prev => ({ ...prev, [attachment.id]: url }));
    } catch (error) {
      console.error('Error loading file preview:', error);
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (attachment: TaskAttachment) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      // Clean up preview URL if it exists
      if (previewUrls[attachment.id]) {
        URL.revokeObjectURL(previewUrls[attachment.id]);
        setPreviewUrls(prev => {
          const { [attachment.id]: _, ...rest } = prev;
          return rest;
        });
      }

      loadAttachments();
      toast.success('Attachment deleted successfully');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  if (!taskId || attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex flex-col border rounded-md bg-background overflow-hidden"
          >
            {(attachment.content_type.startsWith('image/') || 
              attachment.content_type === 'application/pdf') && 
              previewUrls[attachment.id] && (
              <AttachmentPreview
                attachment={attachment}
                previewUrl={previewUrls[attachment.id]}
                onClick={() => setSelectedFile(attachment)}
              />
            )}
            <AttachmentActions
              attachment={attachment}
              isEditing={isEditing}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>

      <AttachmentDialog
        attachment={selectedFile}
        previewUrl={selectedFile ? previewUrls[selectedFile.id] : undefined}
        onClose={() => setSelectedFile(null)}
        onDownload={handleDownload}
      />
    </>
  );
}
