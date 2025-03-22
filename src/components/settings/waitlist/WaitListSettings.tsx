
import { useState, useEffect } from "react";
import { ClipboardList, Users, Mail, Check, Send, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

type WaitlistEntry = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  invited_at: string | null;
  created_at: string;
};

export function WaitListSettings() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchWaitlistEntries();
  }, []);

  const fetchWaitlistEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('waitlist_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching waitlist entries:", error);
        toast.error("Failed to load waitlist entries");
        return;
      }

      setEntries(data || []);
    } catch (error) {
      console.error("Exception fetching waitlist entries:", error);
      toast.error("An unexpected error occurred loading the waitlist");
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (id: number) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('waitlist_entries')
        .update({ 
          status: 'invited', 
          invited_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        console.error("Error sending invitation:", error);
        toast.error("Failed to send invitation");
        return;
      }

      // Update local state
      setEntries(entries.map(entry => 
        entry.id === id 
          ? { ...entry, status: 'invited', invited_at: new Date().toISOString() } 
          : entry
      ));
      
      toast.success("Invitation sent successfully");
    } catch (error) {
      console.error("Exception sending invitation:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#9B87F5]" />
          <h3 className="text-lg font-medium">Wait-List Management</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchWaitlistEntries}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="rounded-lg border p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-[#9B87F5]" />
          <h4 className="text-base font-medium">Beta Sign-ups</h4>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="w-8 h-8 text-[#9B87F5]" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-gray-700 text-center">
              No waitlist entries found. Direct people to the waitlist sign-up page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.first_name} {entry.last_name}
                    </TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {entry.status === 'invited' ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Check className="w-4 h-4" />
                          Invited
                        </span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendInvitation(entry.id)}
                        disabled={entry.status === 'invited' || processingId === entry.id}
                      >
                        {processingId === entry.id ? (
                          <Spinner className="w-4 h-4 mr-2" />
                        ) : entry.status === 'invited' ? (
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {entry.status === 'invited' ? 'Invited' : 'Send Invite'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="flex items-center gap-2 mb-2 mt-6">
          <Mail className="w-4 h-4 text-[#9B87F5]" />
          <h4 className="text-base font-medium">Invitation Management</h4>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-gray-700 mb-4">
            When you're ready to onboard beta users, select "Send Invite" next to their name to mark them as invited.
          </p>
          <p className="text-sm text-gray-500">
            Note: Currently this only marks them as invited. To implement actual email sending, we'll need to set up an email service integration.
          </p>
        </div>
      </div>
    </div>
  );
}
