
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { startOfWeek, endOfWeek, format, eachDayOfInterval, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsContent() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["analytics-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const tasksByStatus = tasks?.reduce((acc: any, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = tasksByStatus ? Object.entries(tasksByStatus).map(([name, value]) => ({
    name,
    value,
  })) : [];

  const tasksByDay = daysInWeek.map(day => {
    const count = tasks?.filter(task => 
      task.date === format(day, 'yyyy-MM-dd')
    ).length || 0;
    
    return {
      name: format(day, 'EEE'),
      tasks: count
    };
  });

  // Calculate time spent per category for the current week
  const timeSpentByCategory = tasks?.reduce((acc: { [key: string]: number }, task) => {
    if (!task.date || !task.start_time || !task.end_time) return acc;
    
    const taskDate = parseISO(task.date);
    if (taskDate < weekStart || taskDate > weekEnd) return acc;

    const [startHour, startMinute] = task.start_time.split(':').map(Number);
    const [endHour, endMinute] = task.end_time.split(':').map(Number);
    
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const category = task.description?.includes('work') ? 'Work' :
                    task.description?.includes('meeting') ? 'Meetings' :
                    task.description?.includes('break') ? 'Breaks' :
                    'Other';

    acc[category] = (acc[category] || 0) + duration;
    return acc;
  }, {});

  const timeInsightsData = timeSpentByCategory ? 
    Object.entries(timeSpentByCategory).map(([category, minutes]) => ({
      category,
      hours: Math.round(minutes / 60 * 10) / 10 // Round to 1 decimal place
    })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Tasks by Status</h3>
          <div className="h-[300px]">
            <ChartContainer config={{}}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Tasks This Week</h3>
          <div className="h-[300px]">
            <ChartContainer config={{}}>
              <BarChart data={tasksByDay}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#8884d8" />
              </BarChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="p-4 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Time Insights (Hours per Category)</h3>
          <div className="h-[300px]">
            <ChartContainer config={{}}>
              <BarChart data={timeInsightsData}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#2ECC71">
                  {timeInsightsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
