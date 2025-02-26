
import { RefreshCw } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface UpdateButtonProps {
  isChecking: boolean;
  setIsChecking: (checking: boolean) => void;
}

export function UpdateButton({ isChecking, setIsChecking }: UpdateButtonProps) {
  const handleUpdate = async () => {
    if (isChecking) {
      toast.info('Already checking for updates...');
      return;
    }

    try {
      setIsChecking(true);
      toast.loading('Checking for updates...');

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        
        if (registration.waiting) {
          toast.success('Update found! Installing...', {
            duration: 3000,
          });

          localStorage.setItem('app_update_status', 'updating');

          setTimeout(() => {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            toast.success('Update complete! Restarting app...', {
              duration: 2000,
            });
            
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }, 1000);
        } else {
          toast.success('Your app is up to date!');
        }
      }
    } catch (error) {
      console.error('Error updating app:', error);
      toast.error('Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <DropdownMenuItem onClick={handleUpdate} disabled={isChecking}>
      <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
      {isChecking ? 'Checking for Updates...' : 'Check for Updates'}
    </DropdownMenuItem>
  );
}
