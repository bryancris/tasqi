
import { supabase } from "@/integrations/supabase/client";

export const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const getVapidPublicKey = async () => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('vapid_public_key')
    .single();

  if (error) {
    console.error('Error fetching VAPID key:', error);
    throw error;
  }

  return data.vapid_public_key;
};
