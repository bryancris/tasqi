interface MobileTaskContentProps {
  title: string;
  time?: string;
  status: 'scheduled' | 'unscheduled' | 'completed';
}

export function MobileTaskContent({ title, time, status }: MobileTaskContentProps) {
  return (
    <div>
      <h3 className="font-medium">{title}</h3>
      {status === 'scheduled' && time && (
        <p className="text-sm opacity-90">{time}</p>
      )}
    </div>
  );
}