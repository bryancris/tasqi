
import { useState } from "react";

export function useEditTaskUIState() {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleDateChange = (newDate: string) => {
    console.log("Date changed in EditTaskDrawer:", newDate);
    return newDate;
  };

  return {
    showShareDialog,
    setShowShareDialog,
    handleDateChange
  };
}
