import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const HeroSection = () => {
  const handleInstall = () => {
    if (typeof window.showInstallPrompt === 'function') {
      window.showInstallPrompt();
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center mb-20">
      <img 
        src="/lovable-uploads/98b0b439-cc30-41da-8912-7786e473fb9a.png" 
        alt="TASQI-AI Logo" 
        className="w-24 h-24 mx-auto mb-8"
      />
      <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
        TASQI-AI Assistant
      </h1>
      <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
        Transform your productivity with AI-powered task management. From voice
        commands to image processing, our assistant understands and adapts to
        your workflow.
      </p>
      <Button
        onClick={handleInstall}
        variant="outline"
        className="bg-white/10 text-white border-white hover:bg-white hover:text-[#1a1b3b]"
      >
        <Download className="mr-2 h-4 w-4" />
        Install App
      </Button>
    </div>
  );
};

export default HeroSection;