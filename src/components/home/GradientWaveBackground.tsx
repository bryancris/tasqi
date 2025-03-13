
import React from "react";

const GradientWaveBackground = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100" />
      
      {/* First wave */}
      <div className="absolute w-[200%] h-[50vh] bottom-[5%] left-[-50%]">
        <div className="absolute w-full h-full bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 animate-wave-slow rounded-[100%]" />
      </div>
      
      {/* Second wave */}
      <div className="absolute w-[200%] h-[45vh] bottom-[0%] left-[-50%]">
        <div className="absolute w-full h-full bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-indigo-500/30 animate-wave-medium rounded-[100%]" />
      </div>
      
      {/* Third wave */}
      <div className="absolute w-[200%] h-[40vh] bottom-[-5%] left-[-50%]">
        <div className="absolute w-full h-full bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-violet-500/40 animate-wave-fast rounded-[100%]" />
      </div>
    </div>
  );
};

export default GradientWaveBackground;
