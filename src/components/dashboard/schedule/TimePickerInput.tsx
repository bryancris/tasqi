
import { Input, InputProps } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface TimePickerInputProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  includeSeconds?: boolean;
}

export function TimePickerInput({ 
  value, 
  onChange, 
  includeSeconds = true,
  ...props 
}: TimePickerInputProps) {
  // Handle the displayed value in HH:MM format
  const [displayValue, setDisplayValue] = useState("");
  
  // Update the displayed value whenever the value prop changes
  useEffect(() => {
    // Format the time for display (remove seconds)
    if (value && value.includes(':')) {
      const parts = value.split(':');
      if (parts.length >= 2) {
        setDisplayValue(`${parts[0]}:${parts[1]}`);
      } else {
        setDisplayValue(value);
      }
    } else {
      setDisplayValue(value);
    }
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    
    // Pass the complete time value with seconds to the parent component
    if (newValue && newValue.includes(':')) {
      if (includeSeconds && newValue.split(':').length === 2) {
        onChange(`${newValue}:00`);
      } else {
        onChange(newValue);
      }
    } else {
      onChange(newValue);
    }
  };
  
  return (
    <Input
      type="time"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
}
