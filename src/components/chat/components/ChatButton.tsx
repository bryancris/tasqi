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
    >
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-blue-600 text-xl">AI</span>
      </div>
    </Button>
  );
}