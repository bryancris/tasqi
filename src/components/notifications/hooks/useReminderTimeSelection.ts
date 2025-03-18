
import { useState, useEffect } from "react";
import { formatReminderTime } from "@/utils/notifications/debug-utils";

interface UseReminderTimeSelectionProps {
  reminderTime: number;
  onReminderTimeChange: (value: number) => void;
}

export function useReminderTimeSelection({
  reminderTime,
  onReminderTimeChange,
}: UseReminderTimeSelectionProps) {
  // Internal state to track display value
  const [internalValue, setInternalValue] = useState<string>(formatReminderTime(reminderTime));
  
  // Enhanced logging for debugging
  console.log(`🚨 useReminderTimeSelection - reminderTime=${reminderTime} (${typeof reminderTime})`);
  
  // Sync internal value with prop
  useEffect(() => {
    console.log(`🚨 Effect: syncing from prop reminderTime=${reminderTime} to internalValue`);
    
    // Handle legacy data - if we get 0, convert to 5 minutes
    if (reminderTime === 0) {
      console.log(`🚨 Legacy data: reminderTime is 0, converting to 5 minutes`);
      setInternalValue("5");
      onReminderTimeChange(5);
    } else {
      // Use our utility function to format the value correctly for non-zero values
      setInternalValue(formatReminderTime(reminderTime));
    }
  }, [reminderTime, onReminderTimeChange]);
  
  // Handler for time selection changes
  const handleTimeChange = (selectedValue: string) => {
    console.log(`🚨 Selected option value: "${selectedValue}"`);
    
    // Set internal value immediately for UI responsiveness
    setInternalValue(selectedValue);
    
    // Parse as number
    const numValue = parseInt(selectedValue, 10);
    if (isNaN(numValue)) {
      console.error(`❌ Failed to parse "${selectedValue}" as a number`);
      onReminderTimeChange(5); // Default fallback
      return;
    }
    
    console.log(`🚨 Setting parent reminderTime to ${numValue}`);
    onReminderTimeChange(numValue);
  };

  return {
    internalValue,
    handleTimeChange
  };
}
