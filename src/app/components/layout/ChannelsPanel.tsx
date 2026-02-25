import { useState } from "react";
import { cn } from "@/lib/utils";
import { Hash, Volume2, Plus, ChevronDown, Settings, Search } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  unread?: number;
}

interface ChannelsPanelProps {
  className?: string;
  onCreateChannel?: () => void;
}

export function ChannelsPanel({ className, onCreateChannel }: ChannelsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [channels] = useState<Channel[]>([
    { id: "1", name: "general", type: "text", unread: 3 },
    { id: "2", name: "random", type: "text" },
    { id: "3", name: "announcements", type: "text" },
  ]);
  
  const [voiceChannels] = useState<Channel[]>([
    { id: "v1", name: "Lounge", type: "voice" },
    { id: "v2", name: "Gaming", type: "voice" },
  ]);

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredVoiceChannels = voiceChannels.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("w-60 h-full bg-[#111114] flex flex-col border-r border-white/5", className)}>
      {/* Server Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors group">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-white font-semibold text-sm truncate">My Workspace</h2>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white flex-shrink-0" />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-black/20 rounded px-2 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-gray-500 w-full"
          />
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Text Channels */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 py-1 group">
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300">
              <ChevronDown className="w-3 h-3" />
              <span>Text Channels</span>
            </div>
            <button 
              onClick={onCreateChannel}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Create Channel"
            >
              <Plus className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
          
          <div className="space-y-0.5 mt-1">
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all group",
                  channel.unread && "text-white font-medium"
                )}
              >
                <Hash className="w-4 h-4 text-gray-500 group-hover:text-gray-300 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{channel.name}</span>
                {channel.unread && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Channels */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 py-1 group">
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300">
              <ChevronDown className="w-3 h-3" />
              <span>Voice Channels</span>
            </div>
            <button 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Create Channel"
            >
              <Plus className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
          
          <div className="space-y-0.5 mt-1">
            {filteredVoiceChannels.map((channel) => (
              <button
                key={channel.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all group"
              >
                <Volume2 className="w-4 h-4 text-gray-500 group-hover:text-gray-300 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Panel at Bottom */}
      <div className="h-14 px-2 py-2 bg-[#0d0d0f] border-t border-white/5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate">User#0000</div>
          <div className="text-[10px] text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Online
          </div>
        </div>
        <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
