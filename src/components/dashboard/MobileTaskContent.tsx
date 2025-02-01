interface MobileTaskContentProps {
  title: string;
  time?: string;
  status: 'scheduled' | 'unscheduled' | 'completed';
}

export function MobileTaskContent({ title, time, status }: MobileTaskContentProps) {
  return (
    <div className="flex items-center space-x-3">
      <div className="grid grid-cols-2 gap-0.5">
        <div className="w-1 h-1 bg-white/50 rounded-full" />
        <div className="w-1 h-1 bg-white/50 rounded-full" />
        <div className="w-1 h-1 bg-white/50 rounded-full" />
        <div className="w-1 h-1 bg-white/50 rounded-full" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        {status === 'scheduled' && time && (
          <p className="text-sm opacity-90">{time}</p>
        )}
      </div>
    </div>
  );
}