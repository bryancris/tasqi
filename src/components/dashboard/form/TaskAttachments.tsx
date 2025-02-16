
import { useEffect, useState } from "react";
import { File, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface TaskAttachment {
  id: number;
  file_name: string;
  file_path: string;
  content_type: string;
}

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

  const renderPreview = (attachment: TaskAttachment) => {
    if (attachment.content_type.startsWith('image/')) {
      return (
        <img
          src={previewUrls[attachment.id]}
          alt={attachment.file_name}
          className="w-full h-full object-contain"
        />
      );
    } else if (attachment.content_type === 'application/pdf') {
      return (
        <iframe
          src={`${previewUrls[attachment.id]}#toolbar=0&navpanes=0`}
          className="w-full h-full"
          title={attachment.file_name}
        />
      );
    }
    return null;
  };

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
              <div 
                className="relative w-full h-32 bg-gray-100 cursor-pointer"
                onClick={() => setSelectedFile(attachment)}
              >
                {renderPreview(attachment)}
              </div>
            )}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <span className="text-sm">{attachment.file_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                >
                  Download
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedFile && previewUrls[selectedFile.id] && (
            <div className="relative">
              <div className="w-full h-[80vh]">
                {renderPreview(selectedFile)}
              </div>
              <Button
                className="absolute bottom-4 right-4"
                onClick={() => handleDownload(selectedFile)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
