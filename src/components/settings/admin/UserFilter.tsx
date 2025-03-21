
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UserFilterProps {
  onFilterChange: (filter: string) => void;
  isLoading?: boolean;
}

export function UserFilter({ onFilterChange, isLoading = false }: UserFilterProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  
  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [inputValue]);
  
  // Apply filter when debounced value changes
  useEffect(() => {
    onFilterChange(debouncedValue);
  }, [debouncedValue, onFilterChange]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="relative">
      {isLoading ? (
        <div className="absolute left-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
      ) : (
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      )}
      <Input
        type="text"
        placeholder="Search users by email or name..."
        className="pl-8 w-full"
        value={inputValue}
        onChange={handleInputChange}
      />
    </div>
  );
}
