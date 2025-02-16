
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileAttachmentInputProps {
  taskId?: number;
  isDisabled?: boolean;
}

export function FileAttachmentInput({ taskId, isDisabled }: FileAttachmentInputProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !taskId) return;

    try {
      setIsUploading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to upload files');
        return;
      }

      // Upload file to storage with user ID in path
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save attachment metadata
      const { error: dbError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: filePath,
          content_type: file.type,
          size: file.size,
        });

      if (dbError) throw dbError;

      toast.success('File uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
        disabled={isDisabled || isUploading}
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      <input
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        id="camera-upload"
        disabled={isDisabled || isUploading}
        accept="image/*"
        capture="environment"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById('file-upload')?.click()}
        disabled={isDisabled || isUploading}
        className="flex-1"
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? 'Uploading...' : 'Attach File'}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById('camera-upload')?.click()}
        disabled={isDisabled || isUploading}
      >
        <Camera className="h-4 w-4" />
      </Button>
    </div>
  );
}
