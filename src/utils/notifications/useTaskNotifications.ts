
import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { setupPushSubscription } from './subscriptionUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useTaskNotifications = () => {
  const { session } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const initializationAttemptedRef = useRef(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      // Prevent multiple initialization attempts
      if (initializationAttemptedRef.current || isInitializing || !session?.user?.id) {
        return;
      }

      try {
        setIsInitializing(true);
        initializationAttemptedRef.current = true;

        // Set up FCM subscription
        await setupPushSubscription();
        
        console.log('✅ Push notifications initialized successfully');
      } catch (error) {
        console.error('Error initializing push notifications:', error);
        if (error instanceof Error) {
          toast.error(error.message);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    if (session?.user?.id) {
      void initializeNotifications();
    }
  }, [session?.user?.id, isInitializing]);
};
