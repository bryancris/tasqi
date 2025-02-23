
export interface TaskAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  content_type: string;
  size: number;
  created_at: string;
}
