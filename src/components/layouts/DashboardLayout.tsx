
import { Sidebar } from "@/components/dashboard/Sidebar";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { TestTube, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { toast } from "sonner";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onViewChange?: (view: 'tasks' | 'calendar' | 'yearly' | 'weekly') => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DashboardLayout({ children, onViewChange, selectedDate, onDateChange }: DashboardLayoutProps) {
  const playSound = async () => {
    console.log('🔊 Starting sound test...');
    
    try {
      const response = await fetch('/notification-sound.mp3');
      if (!response.ok) {
        throw new Error(`Audio file not found: ${response.status}`);
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      
      toast.success('Playing notification sound');
    } catch (error) {
      console.error('❌ Sound playback failed:', error);
      toast.error(`Failed to play sound: ${error.message}`);
    }
  };

  const handleTestNotifications = async () => {
    try {
      console.log('Testing notifications setup...');
      await setupPushSubscription();
      toast.success('Push notifications test completed');
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('Failed to test notifications');
    }
  };

  return (
    <div className="h-screen flex">
      <Sidebar onViewChange={onViewChange} selectedDate={selectedDate} onDateChange={onDateChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[72px] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container h-full">
            <div className="flex h-full items-center justify-end gap-2">
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
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
