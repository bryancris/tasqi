
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function MeasurementsHistory() {
  const [timeRange, setTimeRange] = useState(7); // Default to 7 days

  // Query to get measurement history
  const { data: measurementHistory, isLoading } = useQuery({
    queryKey: ['body-measurements-history', timeRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Calculate date range
      const endDate = new Date();
      const startDate = subDays(endDate, timeRange);

      // Get activities of type body_measurement
      const { data: activities, error: activitiesError } = await supabase
        .from('physical_wellness_activities')
        .select('id, activity_name, measurement_unit')
        .eq('user_id', user.id)
        .eq('activity_type', 'body_measurement');
      
      if (activitiesError) throw activitiesError;
      
      if (!activities || activities.length === 0) {
        return { activities: [], logs: [] };
      }
      
      // Get logs for these activities within date range
      const activityIds = activities.map(a => a.id);
      
      const { data: logs, error: logsError } = await supabase
        .from('physical_wellness_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('activity_id', activityIds)
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', endDate.toISOString())
        .order('logged_at', { ascending: false });
      
      if (logsError) throw logsError;
      
      return { activities, logs: logs || [] };
    }
  });

  // Group logs by date
  const groupedLogs = measurementHistory?.logs.reduce((acc, log) => {
    const date = format(new Date(log.logged_at), 'yyyy-MM-dd');
    
    if (!acc[date]) {
      acc[date] = [];
    }
    
    acc[date].push(log);
    return acc;
  }, {}) || {};

  // Get dates in descending order
  const dates = Object.keys(groupedLogs).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Helper function to find log value by activity name
  const findLogValue = (date, activityName) => {
    if (!measurementHistory?.activities || !groupedLogs[date]) return null;
    
    const activity = measurementHistory.activities.find(a => 
      a.activity_name === activityName
    );
    
    if (!activity) return null;
    
    const log = groupedLogs[date].find(l => l.activity_id === activity.id);
    return log ? log.value : null;
  };

  // Compare values to previous day to show trend
  const getTrend = (date, activityName) => {
    const dateIndex = dates.indexOf(date);
    if (dateIndex >= dates.length - 1) return null; // No previous day to compare
    
    const currentValue = findLogValue(date, activityName);
    const previousValue = findLogValue(dates[dateIndex + 1], activityName);
    
    if (currentValue === null || previousValue === null) return null;
    
    if (currentValue > previousValue) return 'up';
    if (currentValue < previousValue) return 'down';
    return 'same';
  };

  // Render trend icon
  const renderTrendIcon = (trend, activityName) => {
    if (trend === null) return <Minus className="h-4 w-4 text-gray-400" />;
    
    // For most metrics, up is good except for BMI and Body Fat
    const isUpGood = !['BMI', 'Body Fat'].includes(activityName);
    
    if (trend === 'up') {
      return <TrendingUp className={`h-4 w-4 ${isUpGood ? 'text-green-500' : 'text-red-500'}`} />;
    }
    
    if (trend === 'down') {
      return <TrendingDown className={`h-4 w-4 ${isUpGood ? 'text-red-500' : 'text-green-500'}`} />;
    }
    
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  // Get unit for activity
  const getUnit = (activityName) => {
    if (!measurementHistory?.activities) return '';
    
    const activity = measurementHistory.activities.find(a => 
      a.activity_name === activityName
    );
    
    if (!activity) return '';
    
    switch (activity.measurement_unit) {
      case 'kilograms':
        return 'kg';
      case 'percentage':
        return '%';
      default:
        return '';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 flex items-center bg-gradient-to-r from-[#FF719A] to-[#FF9F9F] bg-clip-text text-transparent">
            <Scale className="mr-2 h-5 w-5 text-[#FF719A]" />
            Measurement History
          </h2>
          <p className="text-sm text-muted-foreground">
            Track changes in your body measurements
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={timeRange === 7 ? "default" : "outline"} 
            size="sm"
            onClick={() => setTimeRange(7)}
          >
            7 Days
          </Button>
          <Button 
            variant={timeRange === 30 ? "default" : "outline"} 
            size="sm"
            onClick={() => setTimeRange(30)}
          >
            30 Days
          </Button>
          <Button 
            variant={timeRange === 90 ? "default" : "outline"} 
            size="sm"
            onClick={() => setTimeRange(90)}
          >
            90 Days
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading measurement history...</div>
      ) : dates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No measurements recorded in the last {timeRange} days.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>BMI</TableHead>
                <TableHead>Body Fat</TableHead>
                <TableHead>Muscle Mass</TableHead>
                <TableHead>Water %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dates.map(date => (
                <TableRow key={date}>
                  <TableCell>
                    {format(new Date(date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {findLogValue(date, 'Weight') !== null ? (
                      <div className="flex items-center gap-1">
                        {findLogValue(date, 'Weight')}{getUnit('Weight')}
                        {renderTrendIcon(getTrend(date, 'Weight'), 'Weight')}
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {findLogValue(date, 'BMI') !== null ? (
                      <div className="flex items-center gap-1">
                        {findLogValue(date, 'BMI')}{getUnit('BMI')}
                        {renderTrendIcon(getTrend(date, 'BMI'), 'BMI')}
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {findLogValue(date, 'Body Fat') !== null ? (
                      <div className="flex items-center gap-1">
                        {findLogValue(date, 'Body Fat')}{getUnit('Body Fat')}
                        {renderTrendIcon(getTrend(date, 'Body Fat'), 'Body Fat')}
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {findLogValue(date, 'Muscle Mass') !== null ? (
                      <div className="flex items-center gap-1">
                        {findLogValue(date, 'Muscle Mass')}{getUnit('Muscle Mass')}
                        {renderTrendIcon(getTrend(date, 'Muscle Mass'), 'Muscle Mass')}
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {findLogValue(date, 'Water Percentage') !== null ? (
                      <div className="flex items-center gap-1">
                        {findLogValue(date, 'Water Percentage')}{getUnit('Water Percentage')}
                        {renderTrendIcon(getTrend(date, 'Water Percentage'), 'Water Percentage')}
                      </div>
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
