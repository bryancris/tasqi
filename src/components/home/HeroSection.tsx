
import React from 'react';

const HeroSection = () => {
  return (
    <div className="max-w-4xl mx-auto text-center mb-20">
      <img 
        src="/lovable-uploads/8749ad4f-473f-466e-9128-1259a6f8f2fb.png" 
        alt="TASQI-AI Logo" 
        className="w-24 h-24 mx-auto mb-8"
      />
      <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
        TASQI-AI Assistant
      </h1>
      <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-8">
        Transform your productivity with AI-powered task management. From voice
        commands to image processing, our assistant understands and adapts to
        your workflow.
      </p>
    </div>
  );
};

export default HeroSection;

