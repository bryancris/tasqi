import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { MobileWeeklyView } from "@/components/dashboard/mobile/MobileWeeklyView";
import { useLocation } from "react-router-dom";
import { useCalendarView } from "@/hooks/use-calendar-view";
import { useTaskNotifications } from "@/hooks/use-notifications";

const Dashboard = () => {
  const { view, changeView } = useCalendarView('tasks');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Use the task notifications hook
  useTaskNotifications();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
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

  if (isMobile) {
    const currentPath = location.pathname;
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 mt-[72px] mb-[64px]">
          {currentPath === '/dashboard' && (
            <TaskBoard 
              selectedDate={selectedDate} 
              onDateChange={handleDateChange} 
            />
          )}
          {currentPath === '/dashboard/weekly' && (
            <MobileWeeklyView />
          )}
        </main>
        <MobileFooter />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF] min-h-screen">
      <DashboardLayout 
        onViewChange={changeView} 
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
        {view === 'calendar' && (
          <Calendar 
            initialDate={selectedDate}
            onDateSelect={handleDateChange}
          />
        )}
        {view === 'yearly' && (
          <YearlyCalendar 
            onDateSelect={handleDateChange}
          />
        )}
      </DashboardLayout>
    </div>
  );
};

export default Dashboard;