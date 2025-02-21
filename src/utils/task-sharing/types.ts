
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
  status: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  priority: string | null;
}
