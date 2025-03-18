
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackUserInteraction } from '@/utils/notifications/audio/audioCore';
import { useIOSPWANotifications as useModularImplementation } from './ios-pwa';

/**
 * iOS PWA specific notification handling
 * Provides functionality for iOS PWA devices where standard web push notifications
 * have limited support.
 * 
 * @deprecated Use the modular implementation from the ios-pwa directory instead
 */
export function useIOSPWANotifications() {
  // Import and use the new implementation to ensure compatibility
  return useModularImplementation();
}
