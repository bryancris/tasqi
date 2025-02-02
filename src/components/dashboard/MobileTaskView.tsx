import { Task } from "./TaskBoard";

export interface MobileTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MobileTaskView({ tasks, selectedDate, onDateChange }: MobileTaskViewProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Tasks for {selectedDate.toDateString()}</h2>
      <ul className="space-y-4">
        {tasks.map((task) => (
          <li key={task.id} className="p-4 border rounded-md">
            <h3 className="font-medium">{task.title}</h3>
            <p>{task.description}</p>
            <p className="text-sm text-gray-500">Priority: {task.priority}</p>
            <p className="text-sm text-gray-500">Status: {task.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
