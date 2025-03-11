
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface UpdatePromptUIProps {
  onUpdate: () => void;
}

export function UpdatePromptUI({ onUpdate }: UpdatePromptUIProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow-lg border border-blue-200 dark:border-blue-700">
      <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          New version available
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Reload to update the application
        </p>
      </div>
      <Button 
        size="sm" 
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
        onClick={onUpdate}
      >
        <RefreshCw className="w-4 h-4" />
        Update
      </Button>
    </div>
  );
}
