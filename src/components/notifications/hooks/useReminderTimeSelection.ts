
import { useState, useEffect } from "react";

interface UseReminderTimeSelectionProps {
  reminderTime: number;
  onReminderTimeChange: (value: number) => void;
}

export function useReminderTimeSelection({
  reminderTime,
  onReminderTimeChange,
}: UseReminderTimeSelectionProps) {
  // Internal state to track display value
  const [internalValue, setInternalValue] = useState<string>(String(reminderTime));
  
  // Log the current state for debugging
  console.log(`🚨 useReminderTimeSelection - reminderTime=${reminderTime} (${typeof reminderTime})`);
  console.log(`🚨 Is "At start time"? ${reminderTime === 0 ? 'YES' : 'NO'}`);
  console.log(`🚨 Current internalValue="${internalValue}"`);
  
  // Sync internal value with prop
  useEffect(() => {
    console.log(`🚨 Effect: syncing from prop reminderTime=${reminderTime} to internalValue`);
    
    // Special handling for exact 0 (At start time)
    if (reminderTime === 0) {
      console.log('🚨 Setting internalValue to "0" for "At start time"');
      setInternalValue("0");
    } else {
      setInternalValue(String(reminderTime));
    }
  }, [reminderTime]);
  
  // Improved handler to properly handle the "At start time" (0) case
  const handleTimeChange = (selectedValue: string) => {
    console.log(`🚨 Selected option value: "${selectedValue}"`);
    
    // Set internal value immediately for UI responsiveness
    setInternalValue(selectedValue);
    
    // Critical special case for "At start time" (0)
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
