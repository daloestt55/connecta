import React from "react";
import { cn } from "@/lib/utils";
import { MicOff, UserPlus } from "lucide-react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Button } from "@/app/components/design-system/Button";

export function VideoCall() {
  const participants: any[] = []; // Default empty

  if (participants.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8">
        <div className="text-center">
           <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
             <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-white/10" />
             </div>
           </div>
           
           <h2 className="text-xl text-white font-medium mb-2">No active video feeds</h2>
           <p className="text-gray-500 mb-8">You are the only one in this room.</p>
           
           <Button leftIcon={<UserPlus className="w-4 h-4" />}>
             Add People
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 grid grid-cols-2 gap-4">
      {/* Participant grid would go here */}
    </div>
  );
}
