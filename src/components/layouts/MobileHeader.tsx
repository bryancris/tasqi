import { format } from "date-fns";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { Plus, AlarmClock, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";
import { toast } from "sonner";
import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/components/dashboard/TaskBoard";
import { generateGreetingMessage } from "@/utils/greetingUtils";
import { GreetingDialog } from "@/components/dashboard/greeting/GreetingDialog";

export function MobileHeader() {
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState("");
  const [todaysTaskDetails, setTodaysTaskDetails] = useState<Task[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([]);
  const { tasks } = useTasks();
  const currentTime = format(new Date(), 'HH:mm');
  const currentDate = format(new Date(), 'EEE, MMM d');

  const handleTestGreeting = () => {
    const now = new Date();
    // Get today's scheduled tasks
    const todayTasks = tasks.filter(task => 
      task.status === 'scheduled' && 
      task.date === format(now, 'yyyy-MM-dd')
    );
    setTodaysTaskDetails(todayTasks);

    // Get unscheduled tasks
    const unscheduled = tasks.filter(task => task.status === 'unscheduled');
    setUnscheduledTasks(unscheduled);

    // Generate greeting message
    const message = generateGreetingMessage(todayTasks, unscheduled);
    setGreetingMessage(message);
    setShowGreeting(true);
  };

  const handleTestNotification = async () => {
    try {
      console.log("Testing notification...");
      
      // First check if notifications are supported
      if (!("Notification" in window)) {
        toast.error("This browser does not support notifications");
        return;
      }

      // Get current permission state
      let permission = Notification.permission;
      console.log("Current notification permission:", permission);
      
      // Handle different permission states
      if (permission === "denied") {
        toast.error(
          "Notifications are blocked. Please enable them in your browser settings:",
          {
            description: "Settings → Privacy & Security → Site Settings → Notifications",
            duration: 5000
          }
        );
        return;
      }
      
      // If permission is not granted, request it
      if (permission !== "granted") {
        try {
          console.log("Requesting notification permission...");
          permission = await Notification.requestPermission();
          console.log("Permission response:", permission);
          
          if (permission !== "granted") {
            toast.error("Notification permission not granted");
            return;
          }
        } catch (error) {
          console.error("Error requesting permission:", error);
          toast.error("Failed to request notification permission");
          return;
        }
      }

      // Check service worker registration
      if (!('serviceWorker' in navigator)) {
        toast.error("Service Worker is not supported in this browser");
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log("Service worker ready state:", registration.active?.state);

      // Always use ServiceWorkerRegistration.showNotification() for consistency across platforms
      await registration.showNotification("Test Notification", {
        body: "This is a test notification from TasqiAI",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        vibrate: [200, 100, 200],
        data: {
          url: window.location.origin + '/dashboard'
        },
        tag: 'test-notification',
        renotify: true,
        requireInteraction: true,
        silent: false
      });

      // Play notification sound
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      await audio.play();

      console.log("Notification sent successfully");
      toast.success("Test notification sent!");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification: " + (error as Error).message);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#F2FCE2] via-[#E5DEFF] to-[#D3E4FD] border-b p-4 z-50 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#6366F1] text-2xl font-semibold">TasqiAI</h1>
          <p className="text-sm text-[#333333]">{currentTime} {currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#6366F1]"
            onClick={handleTestNotification}
          >
            <AlarmClock className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#9B87F5]"
            onClick={handleTestGreeting}
          >
            <Smile className="h-5 w-5" />
          </Button>
          <AddTaskDrawer>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-full opacity-75 group-hover:opacity-100 animate-spin"></div>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative h-10 w-10 bg-[#9B87F5] hover:bg-[#8B5CF6] transition-all duration-300 rounded-full transform hover:scale-110"
              >
                <Plus className="h-5 w-5 text-white" />
              </Button>
            </div>
          </AddTaskDrawer>
          <HeaderUserMenu />
        </div>
      </div>

      <GreetingDialog
        open={showGreeting}
        onOpenChange={setShowGreeting}
        greetingMessage={greetingMessage}
        todaysTaskDetails={todaysTaskDetails}
        unscheduledTasks={unscheduledTasks}
      />
    </div>
  );
}
