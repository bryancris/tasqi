
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Task } from "@/components/dashboard/TaskBoard";
import { useTasks } from "@/hooks/use-tasks";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditTaskDrawer } from "@/components/dashboard/EditTaskDrawer";

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
}

export function SearchDialog({ isOpen, onOpenChange }: SearchDialogProps) {
  const { tasks } = useTasks();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery, activeTab]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const filteredTasks = getFilteredTasks();
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredTasks.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredTasks[selectedIndex]) {
          handleTaskSelect(filteredTasks[selectedIndex]);
        }
        break;
      case "Escape":
        onOpenChange(false);
        break;
    }
  };

  const getFilteredTasks = () => {
    if (!debouncedQuery.trim()) return [];

    let filtered = [...tasks];

    // Filter by status
    if (activeTab === "active") {
      filtered = filtered.filter(
        task => task.status !== 'completed'
      );
    } else if (activeTab === "completed") {
      filtered = filtered.filter(task => task.status === 'completed');
    }

    // Filter by search query
    filtered = filtered.filter(task => {
      const titleMatch = task.title?.toLowerCase().includes(debouncedQuery.toLowerCase());
      const descriptionMatch = task.description?.toLowerCase().includes(debouncedQuery.toLowerCase());
      
      // Also search in subtasks if they exist
      const subtaskMatch = task.subtasks?.some(
        subtask => subtask.title.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      
      return titleMatch || descriptionMatch || subtaskMatch;
    });

    return filtered;
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDrawerOpen(true);
    onOpenChange(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unscheduled':
        return <ClipboardList className="h-4 w-4 text-blue-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'stuck':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFormattedDate = (task: Task) => {
    if (!task.date) return "";
    
    try {
      return format(parseISO(task.date), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return "High";
      case 'medium':
        return "Medium";
      case 'low':
        return "Low";
      default:
        return "";
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0" hideCloseButton>
          <div className="flex items-center p-4 border-b">
            <Search className="h-5 w-5 text-muted-foreground mr-2" />
            <Input
              ref={inputRef}
              className="flex-1 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              className="ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "all" | "active" | "completed")}
            className="w-full"
          >
            <div className="px-4 pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All Tasks</TabsTrigger>
                <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-0">
              <SearchResults 
                tasks={filteredTasks} 
                selectedIndex={selectedIndex}
                onTaskSelect={handleTaskSelect}
                getStatusIcon={getStatusIcon}
                getFormattedDate={getFormattedDate}
                getPriorityLabel={getPriorityLabel}
                searchQuery={debouncedQuery}
              />
            </TabsContent>
            
            <TabsContent value="active" className="mt-0">
              <SearchResults 
                tasks={filteredTasks} 
                selectedIndex={selectedIndex}
                onTaskSelect={handleTaskSelect}
                getStatusIcon={getStatusIcon}
                getFormattedDate={getFormattedDate}
                getPriorityLabel={getPriorityLabel}
                searchQuery={debouncedQuery}
              />
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              <SearchResults 
                tasks={filteredTasks} 
                selectedIndex={selectedIndex}
                onTaskSelect={handleTaskSelect}
                getStatusIcon={getStatusIcon}
                getFormattedDate={getFormattedDate}
                getPriorityLabel={getPriorityLabel}
                searchQuery={debouncedQuery}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {selectedTask && (
        <EditTaskDrawer
          task={selectedTask}
          open={isTaskDrawerOpen}
          onOpenChange={setIsTaskDrawerOpen}
        />
      )}
    </>
  );
}

interface SearchResultsProps {
  tasks: Task[];
  selectedIndex: number;
  onTaskSelect: (task: Task) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getFormattedDate: (task: Task) => string;
  getPriorityLabel: (priority: string) => string;
  searchQuery: string;
}

function SearchResults({
  tasks,
  selectedIndex,
  onTaskSelect,
  getStatusIcon,
  getFormattedDate,
  getPriorityLabel,
  searchQuery
}: SearchResultsProps) {
  if (searchQuery.trim() === "") {
    return (
      <div className="py-6 px-4 text-center text-muted-foreground">
        Start typing to search for tasks
      </div>
    );
  }
  
  if (tasks.length === 0) {
    return (
      <div className="py-6 px-4 text-center text-muted-foreground">
        No tasks found for "{searchQuery}"
      </div>
    );
  }
  
  return (
    <ScrollArea className="max-h-[50vh] overflow-y-auto">
      <div className="p-2">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={cn(
              "p-3 rounded-md cursor-pointer mb-1 hover:bg-accent",
              index === selectedIndex && "bg-accent"
            )}
            onClick={() => onTaskSelect(task)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                <div>
                  <h3 className={cn(
                    "text-sm font-medium", 
                    task.status === 'completed' && "line-through opacity-70"
                  )}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end text-xs">
                {task.date && (
                  <span className="text-muted-foreground">{getFormattedDate(task)}</span>
                )}
                
                {task.priority && (
                  <span 
                    className={cn(
                      "px-2 py-0.5 rounded-full text-white text-[10px] mt-1",
                      getPriorityColor(task.priority).replace('bg-', 'bg-').replace('hover:bg-', '')
                    )}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
