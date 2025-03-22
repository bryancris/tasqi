
import React from 'react';
import { Link } from 'react-router-dom';
import { WaitlistForm } from '@/components/waitlist/WaitlistForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Waitlist() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-8 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join the TASQI Beta Waitlist
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Be among the first to experience TASQI, the complete AI productivity suite. 
            Fill out the form below to secure your spot and get early access when we launch.
          </p>
        </div>
        
        <WaitlistForm />
        
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>By joining our waitlist, you agree to receive updates about TASQI.</p>
          <p>We won't share your information with third parties.</p>
        </div>
      </div>
    </div>
  );
}
