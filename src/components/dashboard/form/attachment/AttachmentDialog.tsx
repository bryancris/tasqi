
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { TaskAttachment } from "../types";

interface AttachmentDialogProps {
  attachment: TaskAttachment | null;
  previewUrl?: string;
  onClose: () => void;
  onDownload: (attachment: TaskAttachment) => void;
}

export function AttachmentDialog({ 
  attachment, 
  previewUrl, 
  onClose, 
  onDownload 
}: AttachmentDialogProps) {
  if (!attachment || !previewUrl) return null;

  return (
    <Dialog open={!!attachment} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0">
        <div className="relative">
          <div className="w-full h-[80vh]">
            {attachment.content_type.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt={attachment.file_name}
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full"
                title={attachment.file_name}
                style={{ border: 'none' }}
              />
            )}
          </div>
          <Button
            className="absolute bottom-4 right-4"
            onClick={() => onDownload(attachment)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
