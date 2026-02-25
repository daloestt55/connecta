import React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { motion } from "motion/react";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  status?: "online" | "offline" | "busy" | "away";
  isSpeaking?: boolean;
  className?: string;
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  status,
  isSpeaking = false,
  className,
}: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
    "2xl": "h-32 w-32",
  };

  const statusColors = {
    online: "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]",
    offline: "bg-gray-500",
    busy: "bg-red-500",
    away: "bg-yellow-500",
  };

  // Get initials from name (first 2 letters)
  const getInitials = (text?: string) => {
    if (!text) return "U";
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  // Generate color from name
  const getColorFromName = (text?: string) => {
    if (!text) return "from-gray-800 to-gray-900";
    const colors = [
      "from-blue-600 to-blue-700",
      "from-purple-600 to-purple-700",
      "from-green-600 to-green-700",
      "from-red-600 to-red-700",
      "from-orange-600 to-orange-700",
      "from-pink-600 to-pink-700",
      "from-teal-600 to-teal-700",
      "from-indigo-600 to-indigo-700",
      "from-yellow-600 to-yellow-700",
      "from-cyan-600 to-cyan-700",
    ];
    const index = text.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const initials = getInitials(name || alt);
  const bgColor = getColorFromName(name || alt);

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Speaking Ring Animation */}
      {isSpeaking && (
        <>
          <motion.div
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-teal-500/30 blur-md z-0"
          />
          <motion.div
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 rounded-full bg-teal-400/20 blur-sm z-0"
          />
        </>
      )}

      {/* Avatar Image/Fallback */}
      <div
        className={cn(
          "relative z-10 overflow-hidden rounded-full border-2 border-white/10 bg-white/5",
          sizes[size],
          isSpeaking && "border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.4)]"
        )}
      >
        {src ? (
          <img src={src} alt={alt || "Avatar"} className="h-full w-full object-cover" />
        ) : (
          <div className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-to-br text-white font-semibold",
            bgColor,
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            size === "xl" && "text-lg",
            size === "2xl" && "text-2xl"
          )}>
            {initials}
          </div>
        )}
      </div>

      {/* Status Dot */}
      {status && (
        <div
          className={cn(
            "absolute bottom-0 right-0 z-20 rounded-full border-2 border-[#0A0A0C]",
            statusColors[status],
            size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"
          )}
        />
      )}
    </div>
  );
}
