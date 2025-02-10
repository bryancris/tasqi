
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Group {
  id: number;
  name: string;
}

export function useTaskGroups() {
  return useQuery({
    queryKey: ['task-groups'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('task_groups')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Group[];
    }
  });
}
