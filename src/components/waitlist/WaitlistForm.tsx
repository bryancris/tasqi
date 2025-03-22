
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";

export function WaitlistForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email) {
      toast.error("Please fill out all fields");
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('waitlist_entries')
        .insert([{ first_name: firstName, last_name: lastName, email: email }]);
      
      if (error) {
        if (error.code === '23505') { // Unique violation error code
          toast.error("This email is already on our waitlist");
        } else {
          console.error("Error submitting to waitlist:", error);
          toast.error("Failed to join waitlist. Please try again later.");
        }
        setIsSubmitting(false);
        return;
      }
      
      setIsSuccess(true);
      toast.success("You've been added to our beta waitlist!");
    } catch (error) {
      console.error("Exception submitting to waitlist:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center bg-green-50 border border-green-200 p-8 rounded-lg">
        <h3 className="text-xl font-semibold text-green-700 mb-2">Thank you for joining our waitlist!</h3>
        <p className="text-gray-700 mb-4">
          We've received your information and will notify you when our beta launches.
        </p>
        <p className="text-sm text-gray-500">
          Keep an eye on your inbox for updates about TASQI.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={isSubmitting}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : null}
          Join Beta Waitlist
        </Button>
      </form>
    </div>
  );
}
