
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useAppUpdate() {
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkUpdateComplete = () => {
      const updateStatus = localStorage.getItem('app_update_status');
      if (updateStatus === 'updating') {
        toast.success('Update successfully installed!');
        localStorage.removeItem('app_update_status');
      }
    };
    
    checkUpdateComplete();
  }, []);

  return {
    isChecking,
    setIsChecking
  };
}
