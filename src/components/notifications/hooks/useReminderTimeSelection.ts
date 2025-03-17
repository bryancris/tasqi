
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
  console.log(`🚨 Is "At start time"? ${reminderTime === 0 ? 'YES' : 'NO'}`);
  console.log(`🚨 Current internalValue="${internalValue}"`);
  
  // Sync internal value with prop - CRITICAL: special handling for exactly 0
  useEffect(() => {
    console.log(`🚨 Effect: syncing from prop reminderTime=${reminderTime} to internalValue`);
    
    // Use our utility function to format the value correctly
    setInternalValue(formatReminderTime(reminderTime));
  }, [reminderTime]);
  
  // Improved handler to properly handle the "At start time" (0) case
  const handleTimeChange = (selectedValue: string) => {
    console.log(`🚨 Selected option value: "${selectedValue}"`);
    
    // Set internal value immediately for UI responsiveness
    setInternalValue(selectedValue);
    
    // Special handling for "At start time" (0)
    if (selectedValue === "0") {
      console.log('🚨 Processing special "At start time" (0) value');
      onReminderTimeChange(0);
      return;
    }
    
    // For all other values, parse as number
    const numValue = parseInt(selectedValue, 10);
    if (isNaN(numValue)) {
      console.error(`❌ Failed to parse "${selectedValue}" as a number`);
      onReminderTimeChange(15); // Default fallback
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
