
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const ScaleAnimation = () => {
  const [loaded, setLoaded] = useState(false);
  const [hoveredPlate, setHoveredPlate] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-[400px] w-full flex items-center justify-center overflow-hidden">
      {/* Bench */}
      <div 
        className={cn(
          "absolute bottom-0 w-3/4 h-[50px] bg-gradient-to-r from-courtroom-dark/20 to-courtroom-dark/40 rounded-t-xl",
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20",
          "transition-all duration-1000 ease-out"
        )}
      />
      
      {/* Center post */}
      <div 
        className={cn(
          "absolute h-[200px] w-[10px] bg-golden-500 rounded-full",
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-100px]",
          "transition-all duration-1000 delay-500 ease-out"
        )}
      />
      
      {/* Horizontal bar */}
      <div 
        className={cn(
          "absolute w-[300px] h-[8px] bg-golden-500 rounded-full",
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-100px]",
          hoveredPlate === "left" ? "rotate-[-5deg]" : 
          hoveredPlate === "right" ? "rotate-[5deg]" : "rotate-0",
          "transition-all duration-1000 delay-700 ease-out",
        )}
        style={{ top: "calc(50% - 100px)" }}
      />
      
      {/* Left plate */}
      <div
        className={cn(
          "absolute left-[calc(50%-125px)] w-[100px] h-[100px] rounded-full flex flex-col items-center justify-center",
          "bg-golden-100 border-2 border-golden-500",
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-50px]",
          hoveredPlate === "left" ? "translate-y-[20px] shadow-lg shadow-golden-500/30" : "",
          "transition-all duration-500 delay-800 ease-out cursor-pointer"
        )}
        style={{ top: "calc(50% - 70px)" }}
        onMouseEnter={() => setHoveredPlate("left")}
        onMouseLeave={() => setHoveredPlate(null)}
      >
        <div className="text-xs font-bold text-golden-800">Resources</div>
        <div className="text-xs font-bold text-golden-800">Community</div>
      </div>
      
      {/* Right plate */}
      <div
        className={cn(
          "absolute right-[calc(50%-125px)] w-[100px] h-[100px] rounded-full flex flex-col items-center justify-center",
          "bg-golden-100 border-2 border-golden-500",
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-50px]",
          hoveredPlate === "right" ? "translate-y-[20px] shadow-lg shadow-golden-500/30" : "",
          "transition-all duration-500 delay-900 ease-out cursor-pointer"
        )}
        style={{ top: "calc(50% - 70px)" }}
        onMouseEnter={() => setHoveredPlate("right")}
        onMouseLeave={() => setHoveredPlate(null)}
      >
        <div className="text-xs font-bold text-golden-800">Career</div>
        <div className="text-xs font-bold text-golden-800">Events</div>
      </div>

      {/* Left string */}
      <div
        className={cn(
          "absolute left-[calc(50%-75px)] w-[1px] h-[100px] bg-golden-500/50",
          loaded ? "opacity-100" : "opacity-0",
          "transition-all duration-500 delay-1000"
        )}
        style={{ 
          top: "calc(50% - 70px)",
          transform: hoveredPlate === "left" ? "rotate(-5deg)" : "rotate(0deg)"
        }}
      />

      {/* Right string */}
      <div
        className={cn(
          "absolute right-[calc(50%-75px)] w-[1px] h-[100px] bg-golden-500/50",
          loaded ? "opacity-100" : "opacity-0",
          "transition-all duration-500 delay-1000"
        )}
        style={{ 
          top: "calc(50% - 70px)",
          transform: hoveredPlate === "right" ? "rotate(5deg)" : "rotate(0deg)" 
        }}
      />
    </div>
  );
};

export default ScaleAnimation;
