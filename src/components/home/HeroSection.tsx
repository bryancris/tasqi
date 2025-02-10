
import React from 'react';

const HeroSection = () => {
  return (
    <div className="max-w-4xl mx-auto text-center mb-20">
      <img 
        src="/lovable-uploads/3f275e6b-84cc-4b91-9c41-2e30b0a99384.png" 
        alt="TASQI-AI Logo" 
        className="w-60 h-60 object-contain mx-auto mb-8"
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

