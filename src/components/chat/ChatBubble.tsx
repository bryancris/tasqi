
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4 w-[300px] border border-gray-200 animate-in fade-in slide-in-from-bottom-5">
          <h3 className="font-bold text-lg mb-2">Need assistance?</h3>
          <p className="text-gray-700 mb-4">
            Chat with TASQI-AI to get help with your tasks or ask any questions about the app.
          </p>
          <div className="flex justify-end">
            <Link to="/chat">
              <Button>
                Start Chatting
              </Button>
            </Link>
          </div>
        </div>
      )}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  );
};
