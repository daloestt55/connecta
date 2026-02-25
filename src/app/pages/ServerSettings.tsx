import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/design-system/Button";
import { Input } from "@/app/components/design-system/Input";
import { Switch } from "@/app/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Settings, 
  Shield, 
  Users, 
  Crown, 
  Lock, 
  Zap, 
  Trash2, 
  Copy, 
  LogOut,
  FileText,
  UserPlus,
  Ban,
  Hash,
  Image as ImageIcon,
  X
} from "lucide-react";

interface Server {
  id: string;
  name: string;
  icon?: string;
  inviteCode?: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

interface Member {
  id: string;
  username: string;
  role: string;
  avatar?: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  icon: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  channel: string;
}

interface Bot {
  id: string;
  name: string;
  description: string;
  icon: string;
  installed: boolean;
}

interface Region {
  id: string;
  name: string;
  flag: string;
  ping: number;
}

interface ServerSettingsProps {
  server: Server;
  onClose: () => void;
  onUpdateServer: (serverId: string, updates: { name?: string; icon?: string; description?: string }) => void;
  onDeleteServer: (serverId: string) => void;
  onLeaveServer: (serverId: string) => void;
  onCopyInviteCode: () => void;
}

export function ServerSettings({ 
  server, 
  onClose, 
  onUpdateServer, 
  onDeleteServer,
  onLeaveServer,
  onCopyInviteCode 
}: ServerSettingsProps) {
  const [activeCategory, setActiveCategory] = useState("overview");
  const [serverName, setServerName] = useState(server.name);
  const [serverDescription, setServerDescription] = useState("");
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [explicitContent, setExplicitContent] = useState(false);
  const [autoModeration, setAutoModeration] = useState(true);
  const [requireVerification, setRequireVerification] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState("public");
  const [serverIcon, setServerIcon] = useState<string | null>(server.icon || null);
  
  // Dynamic data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLog] = useState<AuditLogEntry[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  
  // New item states
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#5865F2");
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showEditRole, setShowEditRole] = useState(false);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleColor, setEditRoleColor] = useState("#5865F2");
  
  // Integrations states
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState("");
  const [installedBots, setInstalledBots] = useState<Bot[]>([]);
  const [availableBots] = useState<Bot[]>([
    { id: '1', name: 'Music Bot', description: 'Play music in voice channels', icon: '🎵', installed: false },
    { id: '2', name: 'Moderation Bot', description: 'Auto-moderation and logging', icon: '🛡️', installed: false },
    { id: '3', name: 'Welcome Bot', description: 'Greet new members', icon: '👋', installed: false },
  ]);
  
  // Server regions with real-time ping
  const [selectedRegion, setSelectedRegion] = useState('us-east');
  const [regions, setRegions] = useState<Region[]>([
    { id: 'us-east', name: 'US East', flag: '🇺🇸', ping: 0 },
    { id: 'us-west', name: 'US West', flag: '🇺🇸', ping: 0 },
    { id: 'eu-west', name: 'EU West', flag: '🇪🇺', ping: 0 },
    { id: 'eu-central', name: 'EU Central', flag: '🇪🇺', ping: 0 },
    { id: 'asia', name: 'Asia', flag: '🇯🇵', ping: 0 },
    { id: 'brazil', name: 'Brazil', flag: '🇧🇷', ping: 0 },
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate ping calculation on mount
  useEffect(() => {
    const calculatePing = () => {
      setRegions(regions.map(region => ({
        ...region,
        ping: Math.floor(Math.random() * (200 - 20) + 20) // Random ping between 20-200ms
      })));
    };
    
    calculatePing();
    const interval = setInterval(calculatePing, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    const hasChanges = (serverName.trim() && serverName !== server.name) || serverDescription.trim() || serverIcon !== server.icon;
    if (hasChanges && serverName.trim()) {
      const updates: { name?: string; icon?: string; description?: string } = {};
      
      if (serverName !== server.name) {
        updates.name = serverName;
      }
      if (serverIcon !== server.icon) {
        updates.icon = serverIcon || undefined;
      }
      if (serverDescription.trim()) {
        updates.description = serverDescription;
      }
      
      onUpdateServer(server.id, updates);
      toast.success("Server settings updated!");
      onClose();
    }
  };

  const handleReset = () => {
    setServerName(server.name);
    setServerDescription("");
    setServerIcon(server.icon || null);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setServerIcon(result);
        toast.success("Server icon updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: newRoleName,
      color: newRoleColor,
      permissions: []
    };
    
    setRoles([...roles, newRole]);
    setNewRoleName("");
    setNewRoleColor("#5865F2");
    setShowCreateRole(false);
    toast.success(`Role "${newRoleName}" created!`);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(r => r.id !== roleId));
    toast.success("Role deleted!");
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditRoleColor(role.color);
    setShowEditRole(true);
  };

  const handleUpdateRole = () => {
    if (!editRoleName.trim() || !editingRole) return;
    
    setRoles(roles.map(r => 
      r.id === editingRole.id ? { ...r, name: editRoleName, color: editRoleColor } : r
    ));
    setShowEditRole(false);
    setEditingRole(null);
    setEditRoleName("");
    setEditRoleColor("#5865F2");
    toast.success("Role updated!");
  };

  const handleCreateWebhook = () => {
    if (!newWebhookName.trim()) return;
    
    const newWebhook: Webhook = {
      id: `webhook-${Date.now()}`,
      name: newWebhookName,
      url: `https://connecta.app/webhook/${Math.random().toString(36).substring(7)}`,
      channel: 'general'
    };
    
    setWebhooks([...webhooks, newWebhook]);
    setNewWebhookName("");
    setShowCreateWebhook(false);
    toast.success("Webhook created!");
  };

  const handleDeleteWebhook = (webhookId: string) => {
    setWebhooks(webhooks.filter(w => w.id !== webhookId));
    toast.success("Webhook deleted!");
  };

  const handleCopyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied!");
  };

  const handleInstallBot = (bot: Bot) => {
    setInstalledBots([...installedBots, bot]);
    toast.success(`${bot.name} has been added to your server!`);
  };

  const handleRemoveBot = (botId: string) => {
    const bot = installedBots.find(b => b.id === botId);
    setInstalledBots(installedBots.filter(b => b.id !== botId));
    toast.success(`${bot?.name} has been removed from your server!`);
  };

  const handleSelectRegion = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    setSelectedRegion(regionId);
    toast.success(`Server region changed to ${region?.name}!`);
  };

  const handleKickMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    setMembers(members.filter(m => m.id !== memberId));
    toast.success(`${member?.username} has been kicked!`);
  };

  const handleChangeMemberRole = (memberId: string, newRole: string) => {
    setMembers(members.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    ));
    const member = members.find(m => m.id === memberId);
    toast.success(`${member?.username}'s role changed to ${newRole}`);
  };

  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const categories = [
    { 
      label: "Server Settings", 
      items: [
        { id: "overview", label: "Overview", icon: Settings },
        { id: "roles", label: "Roles & Permissions", icon: Crown },
        { id: "members", label: "Members", icon: Users },
        { id: "invites", label: "Invites", icon: UserPlus },
      ]
    },
    { 
      label: "Moderation", 
      items: [
        { id: "moderation", label: "Moderation", icon: Shield },
        { id: "safety", label: "Safety & Privacy", icon: Lock },
        { id: "audit", label: "Audit Log", icon: FileText },
      ]
    },
    { 
      label: "Community", 
      items: [
        { id: "channels", label: "Channels", icon: Hash },
        { id: "integrations", label: "Integrations", icon: Zap },
        { id: "emoji", label: "Emoji & Stickers", icon: ImageIcon },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-4 md:inset-8 lg:inset-16 flex bg-[#0A0A0C] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Sidebar */}
        <div className="w-64 bg-[#111114] flex flex-col pt-6 pb-6 px-3 overflow-y-auto flex-shrink-0 border-r border-white/5">
          <div className="px-3 mb-6">
            <h2 className="text-lg font-bold text-white truncate">{server.name}</h2>
            <p className="text-xs text-gray-500">Server Settings</p>
          </div>

          {categories.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">
                {section.label}
              </h3>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      activeCategory === item.id 
                        ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-500" 
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <div className="mt-auto px-3 space-y-2">
            <div className="h-px bg-white/5 mb-4" />
            <button 
              onClick={() => {
                onLeaveServer(server.id);
                onClose();
              }}
              className="w-full flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-medium px-3 py-2 hover:bg-orange-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" /> 
              Leave Server
            </button>
            <button 
              onClick={() => {
                onDeleteServer(server.id);
                onClose();
              }}
              className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium px-3 py-2 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> 
              Delete Server
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#0A0A0C] overflow-y-auto relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-3xl mx-auto py-12 px-10">
            
            {/* Overview */}
            {activeCategory === "overview" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Server Overview</h2>
                  <p className="text-gray-400 text-sm">Manage your server's basic information and settings</p>
                </div>

                {/* Server Icon & Name */}
                <div className="bg-[#18181b] rounded-lg p-6 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={handleIconClick}>
                      {serverIcon ? (
                        <img 
                          src={serverIcon} 
                          alt="Server icon" 
                          className="w-24 h-24 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-3xl font-bold text-white">
                          {server.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Server Icon</h3>
                      <p className="text-sm text-gray-500 mb-3">Recommended size: 512x512px</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={handleIconClick}
                      >
                        Upload Image
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase">Server Name</label>
                    <Input
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="Enter server name..."
                      className="bg-[#0A0A0C] border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase">Server Description</label>
                    <textarea
                      value={serverDescription}
                      onChange={(e) => setServerDescription(e.target.value)}
                      placeholder="Tell people what your server is about..."
                      rows={3}
                      className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button
                      onClick={handleReset}
                      variant="secondary"
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!serverName.trim() || (serverName === server.name && !serverDescription.trim() && serverIcon === server.icon)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>

                {/* Server Region */}
                <div className="bg-[#18181b] rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Server Region</h3>
                  <p className="text-sm text-gray-400 mb-4">Select the region closest to you for optimal performance</p>
                  <div className="space-y-2">
                    {regions.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => handleSelectRegion(region.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                          selectedRegion === region.id
                            ? 'bg-[#0A0A0C] border border-blue-500/50'
                            : 'bg-[#0A0A0C]/50 border border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {selectedRegion === region.id && (
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            </div>
                          )}
                          <div className="text-left">
                            <div className="text-white font-medium">
                              {region.flag} {region.name}
                            </div>
                            <div className={`text-xs ${
                              region.ping < 50 ? 'text-green-400' :
                              region.ping < 100 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              Ping: {region.ping}ms
                            </div>
                          </div>
                        </div>
                        {selectedRegion === region.id && (
                          <div className="text-xs text-blue-400 font-medium">SELECTED</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Roles & Permissions */}
            {activeCategory === "roles" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Roles & Permissions</h2>
                  <p className="text-gray-400 text-sm">Manage server roles and member permissions</p>
                </div>

                {roles.length > 0 ? (
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <div key={role.id} className="bg-[#18181b] rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <div>
                            <div className="font-medium text-white">{role.name}</div>
                            <div className="text-xs text-gray-500">{role.permissions.length} permissions</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#18181b] rounded-lg p-8 text-center">
                    <Crown className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No roles yet. Create your first role to manage permissions.</p>
                  </div>
                )}

                {showCreateRole ? (
                  <div className="bg-[#18181b] rounded-lg p-4 space-y-3">
                    <Input
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Role name..."
                      className="bg-[#0A0A0C] border-white/10"
                      onKeyPress={(e) => e.key === "Enter" && handleCreateRole()}
                    />
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Role Color</label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { color: "#5865F2", name: "Blurple" },
                          { color: "#57F287", name: "Green" },
                          { color: "#FEE75C", name: "Yellow" },
                          { color: "#EB459E", name: "Pink" },
                          { color: "#ED4245", name: "Red" },
                          { color: "#F26522", name: "Orange" },
                          { color: "#9B59B6", name: "Purple" },
                          { color: "#3498DB", name: "Blue" },
                          { color: "#1ABC9C", name: "Teal" },
                          { color: "#95A5A6", name: "Gray" },
                        ].map((colorOption) => (
                          <button
                            key={colorOption.color}
                            type="button"
                            onClick={() => setNewRoleColor(colorOption.color)}
                            className={cn(
                              "w-8 h-8 rounded-full transition-all",
                              newRoleColor === colorOption.color ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                            )}
                            style={{ backgroundColor: colorOption.color }}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCreateRole}
                        disabled={!newRoleName.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Create
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowCreateRole(false);
                          setNewRoleName("");
                          setNewRoleColor("#5865F2");
                        }}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setShowCreateRole(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Create New Role
                  </Button>
                )}
              </div>
            )}

            {/* Members */}
            {activeCategory === "members" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Server Members</h2>
                  <p className="text-gray-400 text-sm">Manage and view all server members ({members.length} total)</p>
                </div>

                <div className="bg-[#18181b] rounded-lg p-4">
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className="bg-[#0A0A0C] border-white/10"
                  />
                </div>

                {filteredMembers.length > 0 ? (
                  <div className="space-y-2">
                    {filteredMembers.map((member) => (
                      <div key={member.id} className="bg-[#18181b] rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{member.username}</div>
                            <div className="text-xs text-gray-500">{member.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select 
                            value={member.role}
                            onChange={(e) => handleChangeMemberRole(member.id, e.target.value)}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Member">Member</option>
                            <option value="Moderator">Moderator</option>
                            <option value="Admin">Admin</option>
                          </select>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleKickMember(member.id)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#18181b] rounded-lg p-8 text-center">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      {members.length === 0 ? "No members in this server yet." : "No members found matching your search."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Invites */}
            {activeCategory === "invites" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Invite Management</h2>
                  <p className="text-gray-400 text-sm">Create and manage server invites</p>
                </div>

                <div className="bg-[#18181b] rounded-lg p-6 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Permanent Invite Link</label>
                    <div className="flex gap-2">
                      <Input
                        value={server.inviteCode || ""}
                        readOnly
                        className="bg-[#0A0A0C] border-white/10 text-white font-mono"
                      />
                      <Button
                        onClick={onCopyInviteCode}
                        className="bg-blue-600 hover:bg-blue-700 px-4"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium text-white">Max Uses</div>
                        <div className="text-xs text-gray-500">Limit how many times this invite can be used</div>
                      </div>
                      <select className="bg-[#0A0A0C] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                        <option>No limit</option>
                        <option>1 use</option>
                        <option>5 uses</option>
                        <option>10 uses</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">Expires After</div>
                        <div className="text-xs text-gray-500">Set when this invite expires</div>
                      </div>
                      <select className="bg-[#0A0A0C] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                        <option>Never</option>
                        <option>30 minutes</option>
                        <option>1 hour</option>
                        <option>6 hours</option>
                        <option>12 hours</option>
                        <option>1 day</option>
                        <option>7 days</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Moderation */}
            {activeCategory === "moderation" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Moderation Settings</h2>
                  <p className="text-gray-400 text-sm">Configure automated moderation and safety features</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#18181b] rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white mb-1">Auto-Moderation</div>
                      <div className="text-sm text-gray-500">Automatically filter spam and inappropriate content</div>
                    </div>
                    <Switch checked={autoModeration} onCheckedChange={setAutoModeration} />
                  </div>

                  <div className="bg-[#18181b] rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white mb-1">Explicit Content Filter</div>
                      <div className="text-sm text-gray-500">Block messages with explicit content</div>
                    </div>
                    <Switch checked={explicitContent} onCheckedChange={setExplicitContent} />
                  </div>

                  <div className="bg-[#18181b] rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white mb-1">Verification Required</div>
                      <div className="text-sm text-gray-500">Members must verify before accessing channels</div>
                    </div>
                    <Switch checked={requireVerification} onCheckedChange={setRequireVerification} />
                  </div>
                </div>
              </div>
            )}

            {/* Safety & Privacy */}
            {activeCategory === "safety" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Safety & Privacy</h2>
                  <p className="text-gray-400 text-sm">Protect your server and members</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#18181b] rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white mb-1">Enable Notifications</div>
                      <div className="text-sm text-gray-500">Receive notifications for server events</div>
                    </div>
                    <Switch checked={enableNotifications} onCheckedChange={setEnableNotifications} />
                  </div>

                  <div className="bg-[#18181b] rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white mb-1">Require 2FA for Moderators</div>
                      <div className="text-sm text-gray-500">Moderators must enable two-factor authentication</div>
                    </div>
                    <Switch checked={twoFactorRequired} onCheckedChange={setTwoFactorRequired} />
                  </div>
                </div>

                <div className="bg-[#18181b] rounded-lg p-6">
                  <h3 className="font-bold text-white mb-4">Privacy Level</h3>
                  <div className="space-y-3">
                    {[
                      { value: "public", label: "Public", desc: "Anyone can find and join" },
                      { value: "private", label: "Private", desc: "Only searchable by name" },
                      { value: "invite", label: "Invite Only", desc: "Can only join with invite" }
                    ].map((level) => (
                      <label 
                        key={level.value} 
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0C] cursor-pointer hover:bg-[#0e0e11] transition-colors"
                      >
                        <input 
                          type="radio" 
                          name="privacy" 
                          value={level.value}
                          checked={privacyLevel === level.value}
                          onChange={(e) => setPrivacyLevel(e.target.value)}
                          className="w-4 h-4" 
                        />
                        <div>
                          <div className="text-white font-medium">{level.label}</div>
                          <div className="text-xs text-gray-500">{level.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Audit Log */}
            {activeCategory === "audit" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Audit Log</h2>
                  <p className="text-gray-400 text-sm">View recent server activity and changes</p>
                </div>

                {auditLog.length > 0 ? (
                  <div className="space-y-2">
                    {auditLog.map((log) => (
                      <div key={log.id} className="bg-[#18181b] rounded-lg p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          {log.icon === "hash" && <Hash className="w-5 h-5 text-blue-400" />}
                          {log.icon === "ban" && <Ban className="w-5 h-5 text-red-400" />}
                          {log.icon === "crown" && <Crown className="w-5 h-5 text-yellow-400" />}
                          {log.icon === "user" && <Users className="w-5 h-5 text-green-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{log.action}</div>
                          <div className="text-sm text-gray-500">
                            by {log.user} • {log.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#18181b] rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No audit log entries yet. Activity will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Channels */}
            {activeCategory === "channels" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Channel Management</h2>
                  <p className="text-gray-400 text-sm">Channels are managed from the main server view</p>
                </div>

                <div className="bg-[#18181b] rounded-lg p-8 text-center">
                  <Hash className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="font-bold text-white mb-2">Manage Channels</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    To create, edit, or delete channels, use the channel panel in the main server view
                  </p>
                  <Button 
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Server
                  </Button>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeCategory === "integrations" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Integrations</h2>
                  <p className="text-gray-400 text-sm">Connect external apps and services to enhance your server</p>
                </div>

                {/* Webhooks Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Webhooks</h3>
                    <Button 
                      onClick={() => setShowCreateWebhook(true)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Create Webhook
                    </Button>
                  </div>

                  {showCreateWebhook && (
                    <div className="bg-[#18181b] rounded-lg p-4 space-y-3">
                      <Input
                        value={newWebhookName}
                        onChange={(e) => setNewWebhookName(e.target.value)}
                        placeholder="Webhook name..."
                        className="bg-[#0A0A0C] border-white/10"
                        onKeyPress={(e) => e.key === "Enter" && handleCreateWebhook()}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCreateWebhook}
                          disabled={!newWebhookName.trim()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Create
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowCreateWebhook(false);
                            setNewWebhookName("");
                          }}
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {webhooks.length > 0 ? (
                    <div className="space-y-2">
                      {webhooks.map((webhook) => (
                        <div key={webhook.id} className="bg-[#18181b] rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-medium text-white">{webhook.name}</div>
                              <div className="text-xs text-gray-500">#{webhook.channel}</div>
                            </div>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleDeleteWebhook(webhook.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={webhook.url}
                              readOnly
                              className="bg-[#0A0A0C] border-white/10 text-white text-xs font-mono"
                            />
                            <Button
                              onClick={() => handleCopyWebhookUrl(webhook.url)}
                              size="sm"
                              variant="secondary"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#18181b] rounded-lg p-6 text-center">
                      <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No webhooks yet. Create a webhook to receive events from external services.</p>
                    </div>
                  )}
                </div>

                {/* Installed Bots Section */}
                {installedBots.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Installed Bots</h3>
                    <div className="grid gap-3">
                      {installedBots.map((bot) => (
                        <div key={bot.id} className="bg-[#18181b] rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl">
                              {bot.icon}
                            </div>
                            <div>
                              <div className="font-medium text-white flex items-center gap-2">
                                {bot.name}
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                              </div>
                              <div className="text-xs text-gray-500">{bot.description}</div>
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            variant="secondary"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleRemoveBot(bot.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Bots Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Available Bots</h3>
                  <div className="grid gap-3">
                    {availableBots.filter(bot => !installedBots.some(installed => installed.id === bot.id)).map((bot) => (
                      <div key={bot.id} className="bg-[#18181b] rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl">
                            {bot.icon}
                          </div>
                          <div>
                            <div className="font-medium text-white">{bot.name}</div>
                            <div className="text-xs text-gray-500">{bot.description}</div>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleInstallBot(bot)}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Bot
                        </Button>
                      </div>
                    ))}
                  </div>
                  {availableBots.every(bot => installedBots.some(installed => installed.id === bot.id)) && (
                    <div className="bg-[#18181b] rounded-lg p-6 text-center">
                      <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">All available bots are already installed!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Emoji */}
            {activeCategory === "emoji" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Emoji & Stickers</h2>
                  <p className="text-gray-400 text-sm">Upload custom emoji and stickers</p>
                </div>

                <div className="bg-[#18181b] rounded-lg p-8 text-center">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="font-bold text-white mb-2">No Custom Emoji Yet</h3>
                  <p className="text-gray-500 text-sm mb-4">Upload your first custom emoji to personalize your server</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">Upload Emoji</Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
        <DialogContent className="bg-[#18181b] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Edit Role
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Role Name</label>
              <Input
                placeholder="Enter role name..."
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateRole();
                  }
                }}
                className="bg-[#0A0A0C] border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Role Color</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { color: "#5865F2", name: "Blurple" },
                  { color: "#57F287", name: "Green" },
                  { color: "#FEE75C", name: "Yellow" },
                  { color: "#EB459E", name: "Pink" },
                  { color: "#ED4245", name: "Red" },
                  { color: "#F26522", name: "Orange" },
                  { color: "#9B59B6", name: "Purple" },
                  { color: "#3498DB", name: "Blue" },
                  { color: "#1ABC9C", name: "Teal" },
                  { color: "#95A5A6", name: "Gray" },
                ].map((colorOption) => (
                  <button
                    key={colorOption.color}
                    type="button"
                    onClick={() => setEditRoleColor(colorOption.color)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      editRoleColor === colorOption.color ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                onClick={() => {
                  setShowEditRole(false);
                  setEditingRole(null);
                  setEditRoleName("");
                  setEditRoleColor("#5865F2");
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={!editRoleName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
