interface MobileTaskContentProps {
  title: string;
  time?: string;
  status: 'scheduled' | 'unscheduled' | 'completed';
}

export function MobileTaskContent({ title, time, status }: MobileTaskContentProps) {
  return (
    <div>
      <h3 className={`font-medium ${status === 'completed' ? 'line-through' : ''}`}>{title}</h3>
      {status === 'scheduled' && time && (
        <p className={`text-sm opacity-90 ${status === 'completed' ? 'line-through' : ''}`}>{time}</p>
      )}
    </div>
  );
}