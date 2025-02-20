
import { supabase } from "@/integrations/supabase/client";
import { TokenResponse, isTwinrEnvironment, detectPlatform } from "./platformDetection";
import { getToken } from "firebase/messaging";
import { initializeMessaging } from "@/integrations/firebase/config";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export async function getFCMToken(): Promise<string | null> {
  try {
    console.log('🔄 Initializing Firebase Messaging...');
    const messaging = await initializeMessaging();
    if (!messaging) {
      console.error('❌ Failed to initialize Firebase Messaging');
      return null;
    }

    console.log('📱 Requesting FCM token...');
    const token = await getToken(messaging, {
      vapidKey: 'BDkZH-EjmuThUI1kagyO9Oi5kjR8Ake8joSnREFu7hUXQzZSSMYLcYZ_RAlTDk2l0F7Mq6avwAoGQOaFt9y5RaI'
    });

    if (!token) {
      console.error('❌ No FCM token received');
      return null;
    }

    console.log('✅ FCM token received successfully');
    return token;
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
}

export async function getTwinrToken(): Promise<string | null> {
  if (!isTwinrEnvironment()) {
    console.log('ℹ️ Not in Twinr environment, skipping Twinr token fetch');
    return null;
  }

  try {
    console.log('🔄 Fetching Twinr token...');
    const twinrToken = await (window as any).twinr_push_token_fetch();
    if (!twinrToken) {
      console.error('❌ No Twinr token received');
      return null;
    }
    console.log('✅ Twinr token received successfully');
    return twinrToken;
  } catch (error) {
    console.error('❌ Error getting Twinr token:', error);
    return null;
  }
}

export async function saveTokenToSupabase(tokenResponse: TokenResponse): Promise<void> {
  try {
    console.log('🔄 Saving token to Supabase:', {
      platform: tokenResponse.platform,
      source: tokenResponse.source
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be logged in to save token');
    }

    const { error } = await supabase
      .from('push_device_tokens')
      .upsert({
        user_id: session.user.id,
        platform: tokenResponse.platform,
        token_source: tokenResponse.source,
        platform_details: tokenResponse.platformDetails as Json,
        metadata: {
          userAgent: navigator.userAgent,
          language: navigator.language
        } as Json,
        notification_settings: {
          enabled: true,
          task_reminders: true,
          task_updates: true
        } as Json,
        token: tokenResponse.token,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'token'
      });

    if (error) throw error;
    console.log(`✅ ${tokenResponse.source.toUpperCase()} token saved successfully`);
  } catch (error) {
    console.error('❌ Error saving token to Supabase:', error);
    toast.error('Failed to save notification token');
    throw error;
  }
}

export async function getAndSaveToken(): Promise<TokenResponse | null> {
  const platform = detectPlatform();
  console.log('🔍 Detected platform:', platform);
  
  try {
    if (isTwinrEnvironment()) {
      console.log('📱 Using Twinr token system...');
      const twinrToken = await getTwinrToken();
      if (twinrToken) {
        const tokenResponse: TokenResponse = {
          token: twinrToken,
          platform,
          source: 'twinr',
          platformDetails: {
            userAgent: navigator.userAgent,
            language: navigator.language
          }
        };
        await saveTokenToSupabase(tokenResponse);
        return tokenResponse;
      }
    } else {
      console.log('🌐 Using web FCM system...');
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        const tokenResponse: TokenResponse = {
          token: fcmToken,
          platform: 'web',
          source: 'fcm',
          platformDetails: {
            userAgent: navigator.userAgent,
            language: navigator.language
          }
        };
        await saveTokenToSupabase(tokenResponse);
        return tokenResponse;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error in getAndSaveToken:', error);
    toast.error('Failed to setup notifications');
    return null;
  }
}
