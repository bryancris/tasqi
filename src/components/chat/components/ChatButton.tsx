import { Button } from "@/components/ui/button";

interface ChatButtonProps {
  onClick: () => void;
}

export function ChatButton({ onClick }: ChatButtonProps) {
  return (
    <Button
      size="icon"
      className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
      onClick={onClick}
    />
  );
}