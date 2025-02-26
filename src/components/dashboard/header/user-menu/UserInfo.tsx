
interface UserInfoProps {
  displayName: string;
  email?: string;
}

export function UserInfo({ displayName, email }: UserInfoProps) {
  return (
    <div className="flex flex-col">
      <span className="font-medium text-sm">{displayName}</span>
      <span className="text-xs text-muted-foreground">{email}</span>
    </div>
  );
}
