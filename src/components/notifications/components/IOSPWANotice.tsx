
interface IOSPWANoticeProps {
  show: boolean;
}

export function IOSPWANotice({ show }: IOSPWANoticeProps) {
  if (!show) return null;
  
  return (
    <div className="text-xs text-amber-600 mt-1">
      Note: iOS notifications work best when the app is open or in recent background apps
    </div>
  );
}
