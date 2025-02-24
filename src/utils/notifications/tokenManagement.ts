
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { TokenResponse, detectPlatform } from "./platformDetection";

export async function getFCMToken(): Promise<string | null> {
  try {
    // Generate a unique token for web notifications
    const token = 'web_' + Math.random().toString(36).substring(2);
    console.log('✅ Web notification token generated:', token);
    return token;
  } catch (error) {
    console.error('❌ Error generating web token:', error);
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
    console.log('🌐 Using web notification system...');
    const token = await getFCMToken();
    if (token) {
      const tokenResponse: TokenResponse = {
        token: token,
        platform: 'web',
        source: 'web',
        platformDetails: {
          userAgent: navigator.userAgent,
          language: navigator.language
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
