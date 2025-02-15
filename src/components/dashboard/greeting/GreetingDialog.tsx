
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task } from "@/components/dashboard/TaskBoard";
import { Button } from "@/components/ui/button";
import { Check, CalendarRange, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Message {
  content: string;
  isUser: boolean;
}

interface GreetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  greetingMessage: string;
  todaysTaskDetails: Task[];
  unscheduledTasks: Task[];
}

export function GreetingDialog({
  open,
  onOpenChange,
  greetingMessage,
  todaysTaskDetails,
  unscheduledTasks,
}: GreetingDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showTasks, setShowTasks] = useState(true);

  // Initialize chat with AI greeting
  useState(() => {
    if (greetingMessage && messages.length === 0) {
      setMessages([{ content: greetingMessage, isUser: false }]);
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = { content: inputMessage, isUser: true };
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response based on user input
    const aiResponse = { 
      content: "I'll help you with that right away. Would you like me to help you adjust your schedule or is there something specific you'd like to focus on?", 
      isUser: false 
    };
    
    setTimeout(() => {
      setMessages(prev => [...prev, aiResponse]);
      setShowTasks(false);
    }, 1000);

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-r from-violet-500 to-fuchsia-500 max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <CalendarRange className="h-6 w-6" />
            Daily Briefing
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Chat Messages */}
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg p-3 flex items-start gap-2
                ${message.isUser 
                  ? 'bg-white text-violet-600 ml-auto' 
                  : 'bg-white/10 text-white'}`}
              >
                {!message.isUser && <MessageCircle className="h-5 w-5 mt-1 flex-shrink-0" />}
                <p className="leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Task Lists */}
          {showTasks && (
            <div className="space-y-4">
              {todaysTaskDetails.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Today's Schedule:</h3>
                  <div className="space-y-2">
                    {todaysTaskDetails.map((task) => (
                      <div 
                        key={task.id} 
                        className="bg-white/10 rounded-lg p-3 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        <div className="text-white font-medium flex items-center gap-2">
                          <Check className="h-4 w-4 text-white/70" />
                          {task.title}
                        </div>
                        <div className="text-white/80 text-sm ml-6">
                          {task.start_time ? format(new Date(`2000-01-01 ${task.start_time}`), 'h:mm a') : 'Anytime'} 
                          {task.end_time && ` - ${format(new Date(`2000-01-01 ${task.end_time}`), 'h:mm a')}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {unscheduledTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Unscheduled Tasks:</h3>
                  <div className="space-y-2">
                    {unscheduledTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border-l-4 border-yellow-400 hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        <div className="text-white font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-white/80 text-sm">{task.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="mt-4 flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="bg-white/20 border-white/20 text-white placeholder:text-white/60"
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-white text-violet-600 hover:bg-white/90 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
