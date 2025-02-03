import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { NotesContent } from "@/components/notes/NotesContent";
import { useState } from "react";

const Notes = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <NotesContent />
    </DashboardLayout>
  );
};

export default Notes;