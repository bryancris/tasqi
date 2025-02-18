
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { toast } from "sonner";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";

export function MobileHeader() {
  const handleTestNotifications = async () => {
    try {
      console.log('Testing notifications setup...');
      
      // Test sound playback with more detailed logging
      console.log('Creating Audio object...');
      const audio = new Audio('/notification-sound.mp3');
      
      // Add event listeners for debugging
      audio.addEventListener('canplaythrough', () => {
        console.log('✅ Audio file loaded and ready to play');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('❌ Audio error:', e);
        toast.error('Error loading notification sound');
      });

      audio.addEventListener('playing', () => {
        console.log('✅ Audio is now playing');
      });

      audio.addEventListener('ended', () => {
        console.log('✅ Audio finished playing');
      });

      console.log('Setting volume to 0.5...');
      audio.volume = 0.5;
      
      // First, check if we can play audio
      if (document.documentElement.requestFullscreen) {
        try {
          // Try to play sound immediately after a user interaction
          console.log('Attempting to play sound...');
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Play promise resolved successfully');
                toast.success('Notification sound played');
              })
              .catch(error => {
                console.error('❌ Error playing notification sound:', error);
                // This might happen if the user hasn't interacted with the page yet
                toast.error('Please click somewhere on the page first to enable sound');
              });
          }
        } catch (error) {
          console.error('Audio playback error:', error);
          toast.error('Please enable sound in your browser settings');
        }
      }

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
