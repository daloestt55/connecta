import React from "react";
import { cn } from "@/lib/utils";
import { Users, ChevronRight, Activity, Signal, Clock } from "lucide-react";
import { Avatar } from "@/app/components/design-system/Avatar";
import { Waveform } from "@/app/components/design-system/Waveform";
import { GlassCard } from "@/app/components/design-system/GlassCard";

interface RightPanelProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
  context?: "call" | "chat" | "idle";
}

export function RightPanel({ className, isOpen, onToggle, context = "idle" }: RightPanelProps) {
  if (!isOpen) return null;

  return (
    <div className={cn("w-[320px] h-full border-l border-white/5 bg-[#0A0A0C]/50 backdrop-blur-xl flex flex-col", className)}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          {context === "call" ? "Live Signal" : "Activity"}
        </h3>
        <button onClick={onToggle} className="text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {context === "call" ? (
          <>
            <GlassCard className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Connection Quality</span>
                <span className="text-xs text-teal-400">Excellent</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[92%] bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Latency</div>
                  <div className="text-sm text-white font-mono">12ms</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Loss</div>
                  <div className="text-sm text-white font-mono">0.0%</div>
                </div>
              </div>
            </GlassCard>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Participants (4)
              </h4>
              <div className="space-y-3">
                {[
                  { name: "Sarah Connor", status: "speaking", time: "12:40" },
                  { name: "John Smith", status: "silent", time: "12:40" },
                  { name: "Kyle Reese", status: "silent", time: "12:35" },
                  { name: "T-800", status: "muted", time: "12:30" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <Avatar 
                      size="sm" 
                      status="online" 
                      isSpeaking={p.status === "speaking"}
                      className={p.status === "muted" ? "opacity-50" : ""}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        {p.status === "speaking" && (
                          <div className="h-4 w-12">
                             <Waveform barCount={5} height={12} isActive={true} color="bg-teal-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {p.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <Activity className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">No active signal</p>
              <p className="text-gray-600 text-xs mt-1">Select a chat or start a call</p>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Signals</h4>
              <div className="space-y-2">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      <div className="flex-1">
                        <div className="h-2 w-24 bg-white/10 rounded mb-2" />
                        <div className="h-2 w-16 bg-white/10 rounded" />
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
