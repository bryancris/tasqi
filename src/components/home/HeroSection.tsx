
import React from 'react';

const HeroSection = () => {
  return (
    <div className="max-w-4xl mx-auto text-center mb-20">
      <img 
        src="/lovable-uploads/5f059472-aad4-42ce-ba2d-2c1ffa0e684a.png" 
        alt="TASQI-AI Logo" 
        className="w-60 h-60 object-contain mx-auto mb-8"
      />
      <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-8">
        Transform your productivity with AI-powered task management. From voice
        commands to image processing, our assistant understands and adapts to
        your workflow.
      </p>
    </div>
  );
};

export default HeroSection;
