
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrustedUser {
  id: number;
  trusted_user_id: string;
  alias: string | null;
  profiles: {
    email: string;
  };
}

export function useTrustedUsers() {
  return useQuery({
    queryKey: ['trusted-users'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getUser();
      
      const { data: trustedUsersData, error: trustedUsersError } = await supabase
        .from('trusted_task_users')
        .select('id, trusted_user_id, alias')
        .eq('user_id', session.user?.id);

      if (trustedUsersError) throw trustedUsersError;
      if (!trustedUsersData) return [];

      const trustedUsersWithProfiles = await Promise.all(
        trustedUsersData.map(async (user) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', user.trusted_user_id)
            .single();

          return {
            id: user.id,
            trusted_user_id: user.trusted_user_id,
            alias: user.alias,
            profiles: {
              email: profileData?.email || 'Unknown email'
            }
          };
        })
      );

      return trustedUsersWithProfiles;
    }
  });
}
