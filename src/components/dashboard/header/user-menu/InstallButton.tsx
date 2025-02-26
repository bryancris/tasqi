
import { Download } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface InstallButtonProps {
  isStandalone: boolean;
  installable: boolean;
  deferredPrompt: any;
  setDeferredPrompt: (prompt: any) => void;
}

export function InstallButton({ isStandalone, installable, deferredPrompt, setDeferredPrompt }: InstallButtonProps) {
  const handleInstall = async () => {
    if (isStandalone) {
      toast.info('App is already installed');
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      toast.info(
        'To install on iOS: tap the share button and select "Add to Home Screen"',
        { duration: 5000 }
      );
      return;
    }

    if (!deferredPrompt) {
      console.log('❌ No installation prompt available');
      toast.info(
        'Installation not available. Try opening the app in a supported browser like Chrome.',
        { duration: 5000 }
      );
      return;
    }

    try {
      console.log('🚀 Triggering install prompt...');
      toast.loading('Opening install prompt...');

      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('👆 User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        toast.success('Installing app...');
      } else {
        toast.info('Installation cancelled');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('❌ Error installing app:', error);
      toast.error('Failed to install app');
    }
  };

  return (
    <DropdownMenuItem 
      onClick={handleInstall}
      disabled={isStandalone || (!installable && !(/iPad|iPhone|iPod/.test(navigator.userAgent)))}
    >
      <Download className="mr-2 h-4 w-4" />
      {isStandalone ? 'Already Installed' : 'Install App'}
    </DropdownMenuItem>
  );
}
