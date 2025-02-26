
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  avatarUrl?: string;
  fallbackText: string;
}

export function UserAvatar({ avatarUrl, fallbackText }: UserAvatarProps) {
  return (
    <Avatar>
      <AvatarImage src={avatarUrl || "https://github.com/shadcn.png"} />
      <AvatarFallback>
        {fallbackText.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
