
import { base64ToUint8Array } from '@/lib/utils';

export const generateVapidKeys = async () => {
  try {
    const response = await fetch('/api/notifications/vapid-keys');
    if (!response.ok) throw new Error('Failed to fetch VAPID keys');
    const { publicKey } = await response.json();
    return publicKey;
  } catch (error) {
    console.error('Error fetching VAPID keys:', error);
    throw error;
  }
};

export const getVapidPublicKey = async () => {
  const vapidPublicKey = await generateVapidKeys();
  return base64ToUint8Array(vapidPublicKey);
};
