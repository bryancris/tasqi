
import { ClipboardList, Users, Mail } from "lucide-react";

export function WaitListSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-[#9B87F5]" />
        <h3 className="text-lg font-medium">Wait-List Management</h3>
      </div>
      
      <div className="rounded-lg border p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-[#9B87F5]" />
          <h4 className="text-base font-medium">Beta Sign-ups</h4>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-gray-700">
            This section will display users who have signed up for the beta waitlist.
          </p>
        </div>
        
        <div className="flex items-center gap-2 mb-2 mt-6">
          <Mail className="w-4 h-4 text-[#9B87F5]" />
          <h4 className="text-base font-medium">Invitation Management</h4>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-gray-700">
            Here you'll be able to send invitations to users on the waitlist when the beta is ready.
          </p>
        </div>
      </div>
    </div>
  );
}
