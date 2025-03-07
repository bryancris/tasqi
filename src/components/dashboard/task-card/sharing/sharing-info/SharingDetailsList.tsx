
/**
 * SharingDetailsList
 * 
 * This component renders a list of all sharing relationships for a task.
 * It displays the sharing type, who it's shared with, and when it was shared.
 */

interface SharedTask {
  sharing_type: string;
  shared_with_user_id?: string;
  shared_by_user_id?: string;
  created_at?: string;
}

interface SharingDetailsListProps {
  sharedTasks: SharedTask[];
  currentUserId?: string;
}

export function SharingDetailsList({ sharedTasks, currentUserId }: SharingDetailsListProps) {
  return (
    <ul className="space-y-2">
      {sharedTasks.map((sharedTask, index) => (
        <li key={index} className="flex items-center justify-between text-sm">
          <span>
            {sharedTask.sharing_type === 'group' 
              ? 'Shared with group' 
              : sharedTask.shared_with_user_id === currentUserId
                ? 'Shared with you'
                : 'Shared with user'}
          </span>
          {sharedTask.created_at && (
            <span className="text-gray-500">
              {new Date(sharedTask.created_at).toLocaleDateString()}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
