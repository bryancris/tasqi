
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
      ) : attachment.content_type === 'application/pdf' ? (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-8 h-8 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
            <span className="text-xs text-gray-600">Click to view PDF</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
