
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { toast } from "sonner";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";

export function MobileHeader() {
  const playSound = async () => {
    console.log('Attempting to play sound...');
    try {
      const audio = new Audio();
      audio.src = '/notification-sound.mp3';
      audio.volume = 1.0; // Set to full volume for testing
      
      // Load the audio file
      await audio.load();
      console.log('Audio loaded, attempting to play...');
      
      const playResult = await audio.play();
      console.log('Play initiated:', playResult);
      toast.success('Sound should play now');
    } catch (error) {
      console.error('Sound playback failed:', error);
      toast.error('Failed to play sound - check console');
    }
  };

  const handleTestNotifications = async () => {
    try {
      console.log('Testing notifications setup...');
      
      // Try to play sound first
      await playSound();
      
      // Then handle push subscription
      await setupPushSubscription();
      toast.success('Push notifications test completed');
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('Failed to test notifications');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between gap-4">
          <HeaderTime />
          <div className="flex items-center gap-2">
            <AddTaskDrawer>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <span className="text-lg font-semibold">+</span>
              </Button>
            </AddTaskDrawer>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTestNotifications}
              className="h-8 w-8"
            >
              <TestTube className="h-4 w-4" />
            </Button>
            <HeaderNotifications />
            <HeaderUserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
