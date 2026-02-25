import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "darker" | "lighter";
}

export function GlassCard({ children, className, variant = "default", ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 backdrop-blur-xl transition-all duration-300",
        variant === "default" && "bg-white/5",
        variant === "darker" && "bg-black/20",
        variant === "lighter" && "bg-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
