import React, { useState } from "react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Button } from "@/app/components/design-system/Button";
import { Plus, Command, Search, Sparkles, Upload, Edit2, Hash, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";

interface DashboardProps {
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  onCreateServer: (data: { name: string; icon?: string; description?: string }) => void;
  onJoinServer: (code: string) => boolean;
  servers?: Array<{ id: string; name: string; icon?: string; description?: string }>;
  channels?: Array<{ id: string; name: string; serverId: string }>;
  onNavigate?: (tab: string, data?: any) => void;
}

export function Dashboard({ showCreateDialog, setShowCreateDialog, onCreateServer, onJoinServer, servers = [], channels = [], onNavigate }: DashboardProps) {
  const [serverName, setServerName] = useState("");
  const [serverIcon, setServerIcon] = useState<string | null>(null);
  const [serverDescription, setServerDescription] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [serverCode, setServerCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const serverIconInputRef = React.useRef<HTMLInputElement>(null);

  // Command palette keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateServer = () => {
    if (!serverName.trim()) {
      toast.error("Please enter a server name");
      return;
    }
    
    onCreateServer({
      name: serverName,
      icon: serverIcon || undefined,
      description: serverDescription || undefined
    });
    setServerName("");
    setServerIcon(null);
    setServerDescription("");
    setShowCreateDialog(false);
  };
  
  const handleJoinServer = () => {
    if (!serverCode.trim()) {
      toast.error("Please enter a server code");
      return;
    }
    
    const success = onJoinServer(serverCode);
    if (success) {
      setServerCode("");
      setShowJoinDialog(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Minimal Header */}
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={() => setShowCommandPalette(true)}
          className="flex items-center gap-4 bg-muted/30 px-4 py-2 rounded-lg border border-border w-[320px] cursor-pointer hover:bg-muted/50 transition-colors"
          type="button"
        >
          <Search className="w-4 h-4 text-muted-foreground pointer-events-none" />
          <span className="flex-1 text-sm text-muted-foreground text-left pointer-events-none">Search...</span>
          <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded pointer-events-none">⌘K</span>
        </button>
      </div>

      {/* Main Empty State Area */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        
        {/* Abstract Illustration */}
        <div className="relative w-64 h-64 mb-8 opacity-50">
           <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[80px]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-border rounded-full flex items-center justify-center">
              <div className="w-24 h-24 border border-border/50 rounded-full flex items-center justify-center">
                 <Sparkles className="w-8 h-8 text-blue-500/50" />
              </div>
           </div>
           
           {/* Orbiting dots */}
           <div className="absolute top-0 left-1/2 w-1 h-1 bg-teal-500 rounded-full blur-[1px]" />
           <div className="absolute bottom-10 right-10 w-1.5 h-1.5 bg-blue-500 rounded-full blur-[1px]" />
        </div>

        <h2 className="text-xl font-medium text-foreground mb-2 tracking-tight">Ready to Connect</h2>
        <p className="text-muted-foreground max-w-sm text-center text-sm leading-relaxed mb-8">
          Your workspace is clear. Start a new voice session or invite collaborators to begin.
        </p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
           <GlassCard 
             className="p-6 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer group border-dashed border-border"
             onClick={() => setShowCreateDialog(true)}
           >
              <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Plus className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground">Create Server</span>
           </GlassCard>

           <GlassCard 
             className="p-6 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer group border-dashed border-border"
             onClick={() => setShowJoinDialog(true)}
           >
              <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Command className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground">Join via Code</span>
           </GlassCard>
        </div>
      </div>

      {/* Create Server Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Customize your server</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Give your new server a personality with a name and an icon. You can always change it later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Server Icon Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <input
                  ref={serverIconInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setServerIcon(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {serverIcon ? (
                  <div className="relative">
                    <img 
                      src={serverIcon} 
                      alt="Server icon"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-border"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center cursor-pointer" onClick={() => serverIconInputRef.current?.click()}>
                      <Edit2 className="w-6 h-6 text-foreground" />
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => serverIconInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-dashed border-border/50 hover:border-border flex items-center justify-center cursor-pointer transition-all group"
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">Upload</span>
                    </div>
                  </div>
                )}
              </div>
              {serverIcon && (
                <button
                  onClick={() => setServerIcon(null)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove Icon
                </button>
              )}
            </div>

            {/* Server Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Server Name</label>
              <Input
                placeholder="e.g., My Workspace, Team Server"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && serverName.trim()) {
                    handleCreateServer();
                  }
                }}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground h-11"
                autoFocus
              />
            </div>

            {/* Server Description (Optional) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description <span className="text-muted-foreground/60 normal-case">(optional)</span></label>
              <textarea
                placeholder="What's your server about?"
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                className="w-full bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-lg p-3 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                onClick={() => {
                  setShowCreateDialog(false);
                  setServerName("");
                  setServerIcon(null);
                  setServerDescription("");
                }}
                className="bg-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground border-0"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateServer}
                disabled={!serverName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white disabled:opacity-50 disabled:cursor-not-allowed px-6"
              >
                Create Server
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Server Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Command className="w-5 h-5 text-teal-500" />
              Join Server via Code
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the invite code to join an existing server.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Server Code</label>
              <Input
                placeholder="e.g., ABC123XYZ"
                value={serverCode}
                onChange={(e) => setServerCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJoinServer();
                  }
                }}
                className="bg-background border-border text-foreground font-mono tracking-wider"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowJoinDialog(false);
                  setServerCode("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleJoinServer}
                disabled={!serverCode.trim()}
              >
                Join Server
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Palette */}
      <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <DialogContent className="bg-card border-border max-w-2xl p-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search servers, channels, friends, messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>
          <div className="p-2 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {(() => {
                const query = searchQuery.toLowerCase();
                const commands = [
                  { icon: Plus, label: 'Create Server', desc: 'Start a new server', type: 'command', action: () => { setShowCommandPalette(false); setShowCreateDialog(true); } },
                  { icon: Command, label: 'Join Server', desc: 'Join with invite code', type: 'command', action: () => { setShowCommandPalette(false); setShowJoinDialog(true); } },
                  { icon: Users, label: 'Friends', desc: 'View your friends list', type: 'command', action: () => { setShowCommandPalette(false); onNavigate?.('friends'); } },
                  { icon: Hash, label: 'Channels', desc: 'View server channels', type: 'command', action: () => { setShowCommandPalette(false); onNavigate?.('channels'); } },
                  { icon: Search, label: 'Settings', desc: 'Open app settings', type: 'command', action: () => { setShowCommandPalette(false); onNavigate?.('settings'); } },
                ];
                
                const serverResults = servers
                  .filter(s => query === '' || s.name.toLowerCase().includes(query))
                  .slice(0, query === '' ? 5 : undefined) // Show max 5 when no query
                  .map(s => ({
                    icon: Sparkles,
                    label: s.name,
                    desc: s.description || 'Server',
                    type: 'server',
                    action: () => { setShowCommandPalette(false); onNavigate?.('channels', { serverId: s.id }); }
                  }));
                
                const channelResults = channels
                  .filter(c => query === '' || c.name.toLowerCase().includes(query))
                  .slice(0, query === '' ? 5 : undefined) // Show max 5 when no query
                  .map(c => ({
                    icon: Hash,
                    label: `# ${c.name}`,
                    desc: 'Channel',
                    type: 'channel',
                    action: () => { setShowCommandPalette(false); onNavigate?.('channels', { serverId: c.serverId }); }
                  }));
                
                const allResults = [
                  ...commands.filter(cmd => 
                    query === '' || 
                    cmd.label.toLowerCase().includes(query) ||
                    cmd.desc.toLowerCase().includes(query)
                  ),
                  ...serverResults,
                  ...channelResults,
                ];
                
                if (allResults.length === 0 && query !== '') {
                  return (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No results found for "{searchQuery}"
                    </div>
                  );
                }
                
                if (allResults.length === 0 && query === '') {
                  return (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <div className="mb-2">No servers or channels yet</div>
                      <div className="text-xs">Create or join a server to get started</div>
                    </div>
                  );
                }
                
                const groupedResults = {
                  'Commands': allResults.filter(r => r.type === 'command'),
                  'Servers': allResults.filter(r => r.type === 'server'),
                  'Channels': allResults.filter(r => r.type === 'channel'),
                };
                
                return Object.entries(groupedResults).map(([category, items]) => 
                  items.length > 0 && (
                    <div key={category}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </div>
                      <div className="space-y-1">
                        {items.map((item, i) => (
                          <button
                            key={`${category}-${i}`}
                            onClick={item.action}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center group-hover:bg-muted/50 transition-colors">
                              <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-foreground font-medium">{item.label}</div>
                              <div className="text-xs text-muted-foreground">{item.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                );
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
