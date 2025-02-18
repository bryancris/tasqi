
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { TestTube, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { toast } from "sonner";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";

export function MobileHeader() {
  const playSound = async () => {
    console.log('🔊 Starting sound test...');
    
    try {
      // First check if the audio file exists
      const response = await fetch('/notification-sound.mp3');
      if (!response.ok) {
        throw new Error(`Audio file not found: ${response.status}`);
      }
      console.log('✅ Audio file exists');
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('✅ Audio context created');
      
      // Fetch and decode the audio file
      const arrayBuffer = await response.arrayBuffer();
      console.log('✅ Audio file loaded into buffer');
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('✅ Audio buffer decoded');
      
      // Create a buffer source node
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect to destination (speakers)
      source.connect(audioContext.destination);
      console.log('✅ Audio source connected to speakers');
      
      // Start playing
      source.start(0);
      console.log('✅ Audio playback started');
      
      toast.success('Playing notification sound');
    } catch (error) {
      console.error('❌ Sound playback failed:', error);
      toast.error(`Failed to play sound: ${error.message}`);
    }
  };

  const handleTestNotifications = async () => {
    try {
      console.log('Testing notifications setup...');
      
      // First test push subscription
      await setupPushSubscription();
      console.log('✅ Push subscription completed');
      
      // Then try to play sound
      await playSound();
      
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
              onClick={playSound}
              className="h-8 w-8 flex items-center justify-center"
              title="Test Sound"
            >
              <Volume2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTestNotifications}
              className="h-8 w-8 flex items-center justify-center"
              title="Test Notifications"
            >
              <TestTube className="h-5 w-5" />
            </Button>
            <HeaderNotifications />
            <HeaderUserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
