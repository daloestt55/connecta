import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-white/10 text-white",
    success: "bg-teal-500/20 text-teal-400 border border-teal-500/20",
    warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20",
    error: "bg-red-500/20 text-red-400 border border-red-500/20",
    outline: "border border-white/20 text-gray-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-md",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
