
import { Button } from "@/components/ui/button";
import { File, Trash2 } from "lucide-react";
import { TaskAttachment } from "../types";

interface AttachmentActionsProps {
  attachment: TaskAttachment;
  isEditing?: boolean;
  onDownload: (attachment: TaskAttachment) => void;
  onDelete: (attachment: TaskAttachment) => void;
}

export function AttachmentActions({ 
  attachment, 
  isEditing, 
  onDownload, 
  onDelete 
}: AttachmentActionsProps) {
  return (
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
          onClick={() => onDownload(attachment)}
        >
          Download
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(attachment)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}
