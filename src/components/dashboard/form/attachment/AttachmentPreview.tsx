
import { TaskAttachment } from "../types";

interface AttachmentPreviewProps {
  attachment: TaskAttachment;
  previewUrl: string;
  onClick?: () => void;
}

export function AttachmentPreview({ attachment, previewUrl, onClick }: AttachmentPreviewProps) {
  return (
    <div 
      className="relative w-full h-32 bg-gray-100 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
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
  );
}
