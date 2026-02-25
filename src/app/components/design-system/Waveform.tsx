import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface WaveformProps {
  barCount?: number;
  height?: number;
  color?: string;
  isActive?: boolean;
  intensity?: number; // 0 to 1
  className?: string;
}

export function Waveform({ 
  barCount = 20, 
  height = 40, 
  color = "bg-blue-500", 
  isActive = false, 
  intensity = 0.5,
  className 
}: WaveformProps) {
  
  return (
    <div className={cn("flex items-center justify-center gap-[3px]", className)} style={{ height }}>
      {Array.from({ length: barCount }).map((_, i) => {
        // Calculate a "natural" wave shape for the resting state
        const center = barCount / 2;
        const dist = Math.abs(i - center);
        const restingHeight = Math.max(10, height * (1 - dist / center) * 0.3); // Tapered edges
        
        return (
          <motion.div
            key={i}
            className={cn("w-1 rounded-full", color)}
            initial={{ height: restingHeight }}
            animate={{ 
              height: isActive 
                ? [restingHeight, Math.random() * height * intensity + 10, restingHeight] 
                : restingHeight,
              opacity: isActive ? 1 : 0.5
            }}
            transition={{
              repeat: Infinity,
              duration: isActive ? 0.3 + Math.random() * 0.2 : 2, // Fast jitter if active, slow breathe if idle
              ease: "easeInOut",
              delay: i * 0.05 // Wave effect
            }}
          />
        );
      })}
    </div>
  );
}
