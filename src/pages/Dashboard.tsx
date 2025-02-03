import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Dashboard = () => {
  const [view, setView] = useState<'tasks' | 'calendar' | 'yearly' | 'weekly'>('tasks');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Add a small delay to prevent ResizeObserver issues
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (session) {
          console.log("Session found, initializing dashboard");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Dashboard initialization error:", error);
        toast.error("Error loading dashboard. Please try refreshing the page.");
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [session]);

  const handleDateChange = (date: Date) => {
    console.log('Date changed in Dashboard:', date);
    setSelectedDate(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-4 w-[80%] max-w-[800px]">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[150px]" />
            <Skeleton className="h-[150px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      onViewChange={setView} 
      selectedDate={selectedDate} 
      onDateChange={handleDateChange}
    >
      {view === 'tasks' && (
        <TaskBoard 
          selectedDate={selectedDate} 
          onDateChange={handleDateChange} 
        />
      )}
      {view === 'weekly' && (
        <WeeklyCalendar initialDate={selectedDate} />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;