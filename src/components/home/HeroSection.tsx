
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <div className="max-w-4xl mx-auto text-center py-16 md:py-24">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        TASQI (task-ee): The Complete AI Productivity Suite
      </h1>
      <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
        Transform your productivity with AI-powered task management, self-care tools, smart organization, and collaboration features. TASQI adapts to your workflow and helps you achieve more with less effort.
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Coming Soon!</h2>
        <p className="text-gray-700 mb-4">
          We're currently in development and preparing for launch. Sign up for our beta waitlist to get early access and a <span className="font-semibold">free 30-day trial</span> when we launch!
        </p>
      </div>
      
      <div className="flex justify-center">
        <Link to="/auth">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg">
            Join Beta Waitlist
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;
