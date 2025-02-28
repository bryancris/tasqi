
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { TokenResponse, detectPlatform } from "./platformDetection";

export async function getFCMToken(): Promise<string | null> {
  try {
    const platform = detectPlatform();
    
    if (platform === 'ios-pwa') {
      // Generate an iOS-specific token format
      const token = 'ios_pwa_' + Math.random().toString(36).substring(2) + '_' + Date.now();
      console.log('✅ iOS PWA notification token generated:', token);
      return token;
    } else {
      // Generate a unique token for web notifications
      const token = 'web_' + Math.random().toString(36).substring(2);
      console.log('✅ Web notification token generated:', token);
      return token;
    }
  } catch (error) {
    console.error('❌ Error generating notification token:', error);
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

    // First check if this token already exists using proper query format
    const { data: existingTokens, error: queryError } = await supabase
      .from('push_device_tokens')
      .select('id')
      .eq('token', tokenResponse.token);

    if (queryError) {
      throw queryError;
    }

    if (existingTokens && existingTokens.length > 0) {
      console.log('Token already exists, skipping insert');
      return;
    }

    const { error } = await supabase
      .from('push_device_tokens')
      .insert({
        user_id: session.user.id,
        platform: tokenResponse.platform,
        token_source: 'web',
        platform_details: tokenResponse.platformDetails as Json,
        metadata: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          isStandalone: tokenResponse.platformDetails.isStandalone,
          isIOS: tokenResponse.platformDetails.isIOS
        } as Json,
        notification_settings: {
          enabled: true,
          task_reminders: true,
          task_updates: true
        } as Json,
        token: tokenResponse.token,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    console.log(`✅ ${tokenResponse.platform} token saved successfully`);
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
    console.log(`🌐 Using ${platform} notification system...`);
    const token = await getFCMToken();
    if (token) {
      // Check if we're on iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
      
      const tokenResponse: TokenResponse = {
        token: token,
        platform: platform,
        source: 'web',
        platformDetails: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          isStandalone: isStandalone,
          isIOS: isIOS
        }
      };
      await saveTokenToSupabase(tokenResponse);
      return tokenResponse;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error in getAndSaveToken:', error);
    toast.error('Failed to setup notifications');
    return null;
  }
}
