
export type TaskPriority = "low" | "medium" | "high";

export interface ShareTaskParams {
  taskId: number;
  selectedUserIds: string[];
  selectedGroupId: string;
  sharingType: "individual" | "group";
  currentUserId: string;
}

export interface TaskGroupMember {
  trusted_user_id: string;
  group_id: number;
  role: 'admin' | 'member';
}

export interface TaskData {
  id: number;
  title: string;
  description: string | null;
  status: 'completed' | 'scheduled' | 'unscheduled' | 'in_progress' | 'stuck';
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  priority: TaskPriority | null;
  position: number;
  user_id: string;
  owner_id: string;
}
