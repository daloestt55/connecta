import React, { useState, useEffect } from "react";
import { Auth } from "@/app/pages/Auth";
import { Dashboard } from "@/app/pages/Dashboard";
import { Channels } from "@/app/pages/Channels";
import { ActiveCall } from "@/app/pages/ActiveCall";
import { VideoCall } from "@/app/pages/VideoCall";
import { Chat } from "@/app/pages/Chat";
import { Settings } from "@/app/pages/Settings";
import { UserProfile } from "@/app/pages/UserProfile";
import { Store } from "@/app/pages/Store";
import { Subscriptions } from "@/app/pages/Subscriptions";
import { Friends } from "@/app/pages/Friends";
import { AdminPanel } from "@/app/pages/AdminPanel";
import { MainLayout } from "@/app/components/layout/MainLayout";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import { 
  getCurrentDeviceSession, 
  loadStoredDevices, 
  saveDevices, 
  updateCurrentDevice 
} from "@/app/utils/deviceDetection";
import { supabase } from "@/app/utils/supabase";
import { getFriends, type Friend } from "@/app/utils/friends";

interface Server {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  color: string;
  inviteCode: string;
}

interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  serverId: string;
  unread?: number;
}

interface VerificationRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  reason: string;
  links: string[];
  submittedAt: Date;
  status: "pending" | "approved" | "rejected";
}

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  isVerified: boolean;
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  avatar?: string;
}

interface DeviceSession {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "browser" | "other";
  location: string;
  lastActive: string;
  isCurrent: boolean;
  userAgent?: string;
}

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('connecta_is_authenticated');
    return saved === 'true';
  });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('connecta_active_tab') || 'dashboard';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
  const [servers, setServers] = useState<Server[]>(() => {
    return safeJsonParse<Server[]>(localStorage.getItem('connecta_servers'), []);
  });
  const [channels, setChannels] = useState<Channel[]>(() => {
    return safeJsonParse<Channel[]>(localStorage.getItem('connecta_channels'), []);
  });
  const [selectedServer, setSelectedServer] = useState<string | null>(() => {
    return localStorage.getItem('connecta_selected_server');
  });
  
  // User and Verification State
  const [currentUser, setCurrentUser] = useState<User>(() => {
    return {
      id: "user-1",
      username: "User",
      email: "user@example.com",
      role: "admin",
      isVerified: false,
      verificationStatus: "none"
    };
  });
  useEffect(() => {
    const saved = localStorage.getItem('connecta_current_user');
    if (!saved) return;
    const parsed = safeJsonParse<User | null>(saved, null);
    if (parsed) {
      setCurrentUser(prev => ({ ...prev, ...parsed }));
    }
  }, []);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);

  // Theme management
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("connecta-theme");
    return (savedTheme as "dark" | "light") || "dark";
  });

  // Device sessions management
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [devicesLoaded, setDevicesLoaded] = useState(false);

  // Audio/Video controls state
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('connecta_is_muted');
    return saved === 'true';
  });
  const [isDeafened, setIsDeafened] = useState(() => {
    const saved = localStorage.getItem('connecta_is_deafened');
    return saved === 'true';
  });
  const [isVideoEnabled, setIsVideoEnabled] = useState(() => {
    const saved = localStorage.getItem('connecta_is_video_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Quick switcher state
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [quickSwitcherFriends, setQuickSwitcherFriends] = useState<Friend[]>([]);

  // Load friends for quick switcher
  useEffect(() => {
    if (showQuickSwitcher && isAuthenticated) {
      getFriends().then(friends => {
        setQuickSwitcherFriends(friends.filter(f => f.relationship === 'friend'));
      });
    }
  }, [showQuickSwitcher, isAuthenticated]);

  // Selected friend for chat
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // Should open add friend form
  const [shouldOpenAddFriend, setShouldOpenAddFriend] = useState(false);

  // Active call state
  const [activeCall, setActiveCall] = useState<{
    id: string;
    username: string;
    avatar?: string;
    isVerified?: boolean;
  } | null>(null);

  // Загрузка и обновление устройств при монтировании
  useEffect(() => {
    const initDevices = async () => {
      const storedDevices = loadStoredDevices();
      const updatedDevices = await updateCurrentDevice(storedDevices);
      setDevices(updatedDevices);
      saveDevices(updatedDevices);
      setDevicesLoaded(true);
    };
    
    initDevices();
  }, []);

  // Автоматическое обновление времени активности текущего устройства
  useEffect(() => {
    if (!devicesLoaded) return;
    
    const interval = setInterval(() => {
      const currentDeviceId = localStorage.getItem('connecta-device-id');
      setDevices(prev => prev.map(device => 
        device.id === currentDeviceId 
          ? { ...device, lastActive: "Just now" }
          : device
      ));
    }, 60000); // Обновление каждую минуту
    
    return () => clearInterval(interval);
  }, [devicesLoaded]);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("connecta-theme", theme);
  }, [theme]);

  // Save authentication state
  useEffect(() => {
    localStorage.setItem('connecta_is_authenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isActive = true;

    const syncUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user || !isActive) return;
        setCurrentUser(prev => ({
          ...prev,
          id: user.id || prev.id,
          email: user.email || prev.email,
          username: user.user_metadata?.name || user.user_metadata?.username || prev.username
        }));
      } catch (error) {
        console.error("Failed to sync user session:", error);
      }
    };

    syncUser();
    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  // Save active tab
  useEffect(() => {
    localStorage.setItem('connecta_active_tab', activeTab);
  }, [activeTab]);

  // Save servers
  useEffect(() => {
    localStorage.setItem('connecta_servers', JSON.stringify(servers));
  }, [servers]);

  // Save channels
  useEffect(() => {
    localStorage.setItem('connecta_channels', JSON.stringify(channels));
  }, [channels]);

  // Save selected server
  useEffect(() => {
    if (selectedServer) {
      localStorage.setItem('connecta_selected_server', selectedServer);
    } else {
      localStorage.removeItem('connecta_selected_server');
    }
  }, [selectedServer]);

  // Save current user
  useEffect(() => {
    localStorage.setItem('connecta_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Save audio/video states
  useEffect(() => {
    localStorage.setItem('connecta_is_muted', String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('connecta_is_deafened', String(isDeafened));
  }, [isDeafened]);

  useEffect(() => {
    localStorage.setItem('connecta_is_video_enabled', String(isVideoEnabled));
  }, [isVideoEnabled]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + M - Toggle Mute
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleMute();
      }

      // Ctrl/Cmd + D - Toggle Deafen
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleDeafen();
      }

      // Ctrl/Cmd + E - Toggle Video
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        toggleVideo();
      }

      // Ctrl/Cmd + K - Quick Switcher
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSwitcher(true);
      }

      // Ctrl/Cmd + , or Ctrl/Cmd + Shift + S - Open Settings
      if ((e.ctrlKey || e.metaKey) && (e.key === ',' || e.code === 'Comma')) {
        e.preventDefault();
        setShowSettings(true);
      }
      
      // Alternative: Ctrl/Cmd + Shift + S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowSettings(true);
      }

      // Ctrl/Cmd + 1 - Friends Tab
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setActiveTab('friends');
      }

      // Ctrl/Cmd + 2 - Channels Tab
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setActiveTab('channels');
      }

      // Ctrl/Cmd + 3 - Chat Tab
      if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        setActiveTab('chats');
      }

      // Ctrl/Cmd + 4 - Calls Tab
      if ((e.ctrlKey || e.metaKey) && e.key === '4') {
        e.preventDefault();
        setActiveTab('calls');
      }

      // Escape - Close modals/settings
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else if (showQuickSwitcher) {
          setShowQuickSwitcher(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, showQuickSwitcher]);

  // Handle custom navigation events
  useEffect(() => {
    const handleNavigateToStore = () => {
      setActiveTab("store");
    };

    window.addEventListener('navigate-to-store', handleNavigateToStore as EventListener);
    return () => window.removeEventListener('navigate-to-store', handleNavigateToStore as EventListener);
  }, []);

  // Audio/Video control functions
  const toggleMute = () => {
    setIsMuted(prev => !prev);
    toast.success(isMuted ? "Microphone unmuted" : "Microphone muted");
  };

  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    if (newDeafened) {
      setIsMuted(true); // Auto-mute when deafened
    }
    toast.success(newDeafened ? "Audio deafened" : "Audio undeafened");
  };

  const toggleVideo = () => {
    setIsVideoEnabled(prev => !prev);
    toast.success(isVideoEnabled ? "Camera disabled" : "Camera enabled");
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateServer = (data: { name: string; icon?: string; description?: string }) => {
    if (data.name.trim()) {
      const colors = [
        "from-blue-600 to-blue-700",
        "from-purple-600 to-purple-700",
        "from-green-600 to-green-700",
        "from-red-600 to-red-700",
        "from-orange-600 to-orange-700",
        "from-pink-600 to-pink-700",
        "from-teal-600 to-teal-700",
      ];
      const newServer: Server = {
        id: `server-${Date.now()}`,
        name: data.name,
        icon: data.icon,
        description: data.description,
        color: colors[Math.floor(Math.random() * colors.length)],
        inviteCode: generateInviteCode(),
      };
      setServers([...servers, newServer]);
      toast.success(`Server "${name}" created! Invite code: ${newServer.inviteCode}`);
      return newServer.id;
    }
    return null;
  };

  const handleJoinServer = (code: string): boolean => {
    const server = servers.find(s => s.inviteCode === code.toUpperCase());
    if (server) {
      toast.success(`Successfully joined "${server.name}"!`);
      setSelectedServer(server.id);
      setActiveTab("channels");
      return true;
    } else {
      toast.error("Invalid invite code. Server not found.");
      return false;
    }
  };

  const handleBackToServers = () => {
    setSelectedServer(null);
  };

  const handleSubmitVerification = (data: { reason: string; links: string[] }) => {
    const newRequest: VerificationRequest = {
      id: `req-${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      reason: data.reason,
      links: data.links,
      submittedAt: new Date(),
      status: "pending"
    };
    setVerificationRequests([...verificationRequests, newRequest]);
    setCurrentUser({ ...currentUser, verificationStatus: "pending" });
    toast.success("Verification request submitted! We'll review it soon.");
  };

  const handleRevokeDevice = (deviceId: string) => {
    const updatedDevices = devices.filter(device => device.id !== deviceId);
    setDevices(updatedDevices);
    saveDevices(updatedDevices);
    toast.success("Device access revoked successfully");
  };

  const handleLogoutAllDevices = () => {
    const currentDevice = devices.find(device => device.isCurrent);
    if (currentDevice) {
      const newDevices = [currentDevice];
      setDevices(newDevices);
      saveDevices(newDevices);
      toast.success("Logged out from all other devices");
    }
  };

  const handleApproveVerification = (requestId: string) => {
    const request = verificationRequests.find(r => r.id === requestId);
    if (request) {
      setVerificationRequests(
        verificationRequests.map(r => 
          r.id === requestId ? { ...r, status: "approved" as const } : r
        )
      );
      if (request.userId === currentUser.id) {
        setCurrentUser({ 
          ...currentUser, 
          isVerified: true, 
          verificationStatus: "approved" 
        });
      }
      toast.success(`Verified ${request.username}!`);
    }
  };

  const handleRejectVerification = (requestId: string) => {
    const request = verificationRequests.find(r => r.id === requestId);
    if (request) {
      setVerificationRequests(
        verificationRequests.map(r => 
          r.id === requestId ? { ...r, status: "rejected" as const } : r
        )
      );
      if (request.userId === currentUser.id) {
        setCurrentUser({ 
          ...currentUser, 
          verificationStatus: "rejected" 
        });
      }
      toast.error(`Rejected verification for ${request.username}`);
    }
  };

  const handleRevokeVerification = (requestId: string) => {
    const request = verificationRequests.find(r => r.id === requestId);
    if (request) {
      setVerificationRequests(
        verificationRequests.map(r => 
          r.id === requestId ? { ...r, status: "rejected" as const } : r
        )
      );
      if (request.userId === currentUser.id) {
        setCurrentUser({ 
          ...currentUser, 
          isVerified: false,
          verificationStatus: "rejected" 
        });
      }
      toast.error(`Revoked verification from ${request.username}`);
    }
  };

  const handleUpdateServer = (serverId: string, updates: { name?: string; icon?: string; description?: string }) => {
    setServers(servers.map(s => 
      s.id === serverId ? { ...s, ...updates } : s
    ));
    toast.success("Server updated!");
  };

  const handleUpdateUser = (updates: { username?: string; avatar?: string; bio?: string }) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
    toast.success("Profile updated!");
  };

  const handleDeleteServer = (serverId: string) => {
    const serverToDelete = servers.find(s => s.id === serverId);
    setServers(servers.filter(s => s.id !== serverId));
    setChannels(channels.filter(ch => ch.serverId !== serverId));
    if (selectedServer === serverId) {
      setSelectedServer(null);
    }
    toast.success(`Server "${serverToDelete?.name}" deleted!`);
  };

  const handleLeaveServer = (serverId: string) => {
    const serverToLeave = servers.find(s => s.id === serverId);
    setServers(servers.filter(s => s.id !== serverId));
    if (selectedServer === serverId) {
      setSelectedServer(null);
    }
    toast.success(`Left server "${serverToLeave?.name}"`);
  };

  const handleUpdateChannel = (channelId: string, newName: string) => {
    setChannels(channels.map(ch => 
      ch.id === channelId ? { ...ch, name: newName } : ch
    ));
    toast.success("Channel updated!");
  };

  const handleDeleteChannel = (channelId: string) => {
    const channelToDelete = channels.find(ch => ch.id === channelId);
    setChannels(channels.filter(ch => ch.id !== channelId));
    toast.success(`Channel "${channelToDelete?.name}" deleted!`);
  };

  const handleCreateChannel = (name: string, type: "text" | "voice", serverId?: string) => {
    let targetServerId = serverId || selectedServer;
    
    // If no server exists, create a default one
    if (!targetServerId && servers.length === 0) {
      const defaultServerId = handleCreateServer({ name: "My Workspace" });
      if (defaultServerId) {
        targetServerId = defaultServerId;
        setSelectedServer(defaultServerId);
      }
    }
    
    if (!targetServerId) {
      toast.error("Please select a server first");
      return;
    }
    
    if (name.trim()) {
      const newChannel: Channel = {
        id: `channel-${Date.now()}`,
        name: name,
        type: type,
        serverId: targetServerId,
      };
      setChannels([...channels, newChannel]);
      const channelTypeText = type === "text" ? "Text channel" : "Voice channel";
      toast.success(`${channelTypeText} "${name}" created!`);
    } else {
      toast.error("Please enter a channel name");
    }
  };

  // Handle Authentication
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear all user data
    localStorage.removeItem('connecta_remembered');
    localStorage.removeItem('connecta_user_email');
    localStorage.removeItem('connecta_is_authenticated');
    localStorage.removeItem('connecta_current_user');
    localStorage.removeItem('connecta_servers');
    localStorage.removeItem('connecta_channels');
    localStorage.removeItem('connecta_selected_server');
    localStorage.removeItem('connecta_active_tab');
    
    // Clear settings data
    localStorage.removeItem('connecta_user_phone');
    localStorage.removeItem('connecta_profile_visibility');
    localStorage.removeItem('connecta_activity_status');
    localStorage.removeItem('connecta_allow_dms');
    localStorage.removeItem('connecta_blocked_users');
    
    // Clear profile customization
    localStorage.removeItem('connecta_profile_accent_color');
    localStorage.removeItem('connecta_profile_bio');
    localStorage.removeItem('connecta_profile_avatar');
    localStorage.removeItem('connecta_profile_banner');
    localStorage.removeItem('connecta_profile_custom_banner');
    
    // Note: Keep theme, device preferences, and call settings as they are device-level settings
    
    setIsAuthenticated(false);
  };

  // Check if user is remembered on mount
  useEffect(() => {
    const isRemembered = localStorage.getItem('connecta_remembered');
    if (isRemembered === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle Tab Change
  const handleTabChange = (tab: string) => {
    if (tab === "settings") {
      setShowSettings(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Handle navigation from search
  const handleNavigateFromSearch = (tab: string, data?: any) => {
    setActiveTab(tab);
    if (data?.serverId) {
      setSelectedServer(data.serverId);
    }
  };

  // Handle opening chat with friend
  const handleOpenChatWithFriend = (friendId: string) => {
    setSelectedFriendId(friendId);
    setActiveTab("chats");
  };

  // Handle opening add friend form
  const handleOpenAddFriend = () => {
    setShouldOpenAddFriend(true);
    setActiveTab("friends");
  };

  // Render logic
  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <MainLayout 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        isAdmin={currentUser.role === "admin"}
      >
        <Toaster position="top-right" theme="dark" />
        
        {/* Main Content Router */}
        <div className="w-full h-full bg-[#0A0A0C]">
          {activeTab === "dashboard" && (
            <Dashboard 
              showCreateDialog={showCreateChannelDialog} 
              setShowCreateDialog={setShowCreateChannelDialog}
              onCreateServer={handleCreateServer}
              onJoinServer={handleJoinServer}
              servers={servers}
              channels={channels}
              onNavigate={handleNavigateFromSearch}
            />
          )}
          {activeTab === "channels" && (
            <Channels 
              showCreateDialog={showCreateChannelDialog} 
              setShowCreateDialog={setShowCreateChannelDialog}
              servers={servers}
              channels={channels}
              selectedServer={selectedServer}
              onServerSelect={setSelectedServer}
              onBack={handleBackToServers}
              onCreateServer={handleCreateServer}
              onCreateChannel={handleCreateChannel}
              onUpdateServer={handleUpdateServer}
              onDeleteServer={handleDeleteServer}
              onLeaveServer={handleLeaveServer}
              onUpdateChannel={handleUpdateChannel}
              onDeleteChannel={handleDeleteChannel}
            />
          )}
          {activeTab === "friends" && (
            <Friends 
              onOpenChat={handleOpenChatWithFriend}
              shouldOpenAddFriend={shouldOpenAddFriend}
              onAddFriendFormChange={(isOpen) => !isOpen && setShouldOpenAddFriend(false)}
              onStartCall={(friend) => {
                setActiveCall(friend);
                setActiveTab('calls');
              }}
            />
          )}
          {activeTab === "chats" && (
            <Chat 
              currentUser={currentUser} 
              selectedFriendId={selectedFriendId}
              onOpenAddFriend={handleOpenAddFriend}
              onStartCall={(friend, isVideo) => {
                setActiveCall(friend);
                setIsVideoEnabled(isVideo);
                setActiveTab('calls');
              }}
            />
          )}
          {activeTab === "calls" && (
            <ActiveCall 
              isMuted={isMuted}
              isDeafened={isDeafened}
              isVideoEnabled={isVideoEnabled}
              onToggleMute={toggleMute}
              onToggleDeafen={toggleDeafen}
              onToggleVideo={toggleVideo}
              caller={activeCall || undefined}
            />
          )}
          {activeTab === "store" && <Store />}
          {activeTab === "subscriptions" && <Subscriptions />}
          {activeTab === "profile" && <UserProfile user={currentUser} onUpdateUser={handleUpdateUser} />}
          {activeTab === "admin" && currentUser.role === "admin" && (
            <AdminPanel
              verificationRequests={verificationRequests}
              onApprove={handleApproveVerification}
              onReject={handleRejectVerification}
              onRevoke={handleRevokeVerification}
            />
          )}
        </div>
      </MainLayout>

      {/* Settings Overlay (Native Modal Style) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            className="absolute inset-0 z-[100] bg-[#0A0A0C]"
          >
            {/* Pass a close handler to Settings to allow closing the modal */}
            <div className="h-full w-full relative">
               <Settings 
                 isVerified={currentUser.isVerified}
                 verificationStatus={currentUser.verificationStatus}
                 onSubmitVerification={handleSubmitVerification}
                 theme={theme}
                 setTheme={setTheme}
                 devices={devices}
                 onRevokeDevice={handleRevokeDevice}
                 onLogoutAllDevices={handleLogoutAllDevices}
                 onLogout={handleLogout}
                 isMuted={isMuted}
                 isDeafened={isDeafened}
                 isVideoEnabled={isVideoEnabled}
                 username={currentUser.username}
                 email={currentUser.email}
                 avatar={currentUser.avatar}
                 onUpdateUsername={(newUsername) => {
                   setCurrentUser(prev => ({ ...prev, username: newUsername }));
                 }}
                 onUpdateAvatar={(newAvatar) => {
                   setCurrentUser(prev => ({ ...prev, avatar: newAvatar }));
                 }}
                 onClose={() => setShowSettings(false)}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Switcher Dialog */}
      <Dialog open={showQuickSwitcher} onOpenChange={setShowQuickSwitcher}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Switcher</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Search servers, channels, or navigate..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigation">
                <CommandItem onSelect={() => { setActiveTab("dashboard"); setShowQuickSwitcher(false); }}>
                  🏠 Dashboard
                </CommandItem>
                <CommandItem onSelect={() => { setActiveTab("friends"); setShowQuickSwitcher(false); }}>
                  👥 Friends
                </CommandItem>
                <CommandItem onSelect={() => { setActiveTab("chats"); setShowQuickSwitcher(false); }}>
                  💬 Chats
                </CommandItem>
                <CommandItem onSelect={() => { setActiveTab("calls"); setShowQuickSwitcher(false); }}>
                  📞 Active Call
                </CommandItem>
                <CommandItem onSelect={() => { setActiveTab("store"); setShowQuickSwitcher(false); }}>
                  🛍️ Store
                </CommandItem>
                <CommandItem onSelect={() => { setActiveTab("subscriptions"); setShowQuickSwitcher(false); }}>
                  👑 Subscriptions
                </CommandItem>
                <CommandItem onSelect={() => { setShowSettings(true); setShowQuickSwitcher(false); }}>
                  ⚙️ Settings
                </CommandItem>
              </CommandGroup>
              {quickSwitcherFriends.length > 0 && (
                <CommandGroup heading="Friends">
                  {quickSwitcherFriends.map(friend => (
                    <CommandItem 
                      key={friend.id}
                      onSelect={() => { 
                        setSelectedFriendId(friend.id);
                        setActiveTab("chats");
                        setShowQuickSwitcher(false);
                      }}
                    >
                      👤 {friend.username}{friend.isVerified && ' ✓'}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {servers.length > 0 && (
                <CommandGroup heading="Servers">
                  {servers.map(server => (
                    <CommandItem 
                      key={server.id}
                      onSelect={() => { 
                        setSelectedServer(server.id);
                        setActiveTab("channels");
                        setShowQuickSwitcher(false);
                      }}
                    >
                      🖥️ {server.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {channels.length > 0 && (
                <CommandGroup heading="Channels">
                  {channels.slice(0, 10).map(channel => (
                    <CommandItem 
                      key={channel.id}
                      onSelect={() => { 
                        const channelServer = servers.find(s => s.id === channel.serverId);
                        if (channelServer) {
                          setSelectedServer(channelServer.id);
                          setActiveTab("channels");
                        }
                        setShowQuickSwitcher(false);
                      }}
                    >
                      {channel.type === 'voice' ? '🔊' : '#'} {channel.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
