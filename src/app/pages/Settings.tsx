import React, { useState, useEffect } from "react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Button as DesignButton } from "@/app/components/design-system/Button";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/lib/utils";
import { User, Volume2, Monitor, Shield, Palette, Key, LogOut, Computer, CheckCircle2, XCircle, Mic, Video, Headphones, Bell, Lock, Eye, Trash2, Settings as SettingsIcon, Smartphone, Upload, Save, X as CloseIcon, Bug, Send } from "lucide-react";
import { getTimeAgo } from "@/app/utils/deviceDetection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { supabase } from "@/app/utils/supabase";
import { sendBugReportToTelegram } from "@/app/utils/telegram";
import { toast } from "sonner";

interface AudioDevice {
  id: string;
  name: string;
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

interface TrustedDevice {
  id: string;
  label: string;
  createdAt: number;
  expiresAt: number;
  lastVerifiedAt?: number;
}

interface SettingsProps {
  isVerified?: boolean;
  verificationStatus?: "none" | "pending" | "approved" | "rejected";
  onSubmitVerification?: (data: { reason: string; links: string[] }) => void;
  theme?: "dark" | "light";
  setTheme?: (theme: "dark" | "light") => void;
  devices?: DeviceSession[];
  onRevokeDevice?: (deviceId: string) => void;
  onLogoutAllDevices?: () => void;
  onLogout?: () => void;
  onClose?: () => void;
  // Audio/Video states for keybinds section
  isMuted?: boolean;
  isDeafened?: boolean;
  isVideoEnabled?: boolean;
  // Audio device selection
  selectedMicrophone?: string;
  selectedCamera?: string;
  selectedSpeaker?: string;
  onDeviceChange?: (type: 'microphone' | 'camera' | 'speaker', deviceId: string) => void;
  // User profile
  username?: string;
  email?: string;
  avatar?: string;
  onUpdateUsername?: (username: string) => void;
  onUpdateAvatar?: (avatar: string) => void;
}

export function Settings({ 
  isVerified = false, 
  verificationStatus = "none",
  onSubmitVerification,
  theme: externalTheme,
  setTheme: externalSetTheme,
  devices = [],
  onRevokeDevice,
  onLogoutAllDevices,
  onLogout,
  onClose,
  isMuted = false,
  isDeafened = false,
  isVideoEnabled = true,
  selectedMicrophone: globalSelectedMicrophone,
  selectedCamera: globalSelectedCamera,
  selectedSpeaker: globalSelectedSpeaker,
  onDeviceChange,
  username = "User#0000",
  email = "",
  avatar,
  onUpdateUsername,
  onUpdateAvatar
}: SettingsProps) {
  const [activeCategory, setActiveCategory] = useState("profile");
  
  // Use external theme if provided, otherwise use local state
  const [localTheme, setLocalTheme] = useState<"dark" | "light">("dark");
  const theme = externalTheme ?? localTheme;
  const setTheme = externalSetTheme ?? setLocalTheme;
  
  const [verificationReason, setVerificationReason] = useState("");
  const [verificationLinks, setVerificationLinks] = useState<string[]>([""]);

  // Audio/Video devices state
  const [audioDevices, setAudioDevices] = useState<{
    microphones: AudioDevice[]; 
    cameras: AudioDevice[]; 
    speakers: AudioDevice[];
  }>({
    microphones: [],
    cameras: [],
    speakers: []
  });
  const [selectedMicrophone, setSelectedMicrophone] = useState(globalSelectedMicrophone || 'default');
  const [selectedCamera, setSelectedCamera] = useState(globalSelectedCamera || 'default');
  const [selectedSpeaker, setSelectedSpeaker] = useState(globalSelectedSpeaker || 'default');
  const [devicesLoading, setDevicesLoading] = useState(true);

  // Profile management states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [userAvatar, setUserAvatar] = useState<string | null>(avatar || null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);
  const [userEmail, setUserEmail] = useState(email || "loading...");
  const [userId, setUserId] = useState<string | null>(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetupCode, setTwoFASetupCode] = useState("");
  const [twoFASetupUrl, setTwoFASetupUrl] = useState("");
  const [twoFAVerifyInput, setTwoFAVerifyInput] = useState("");
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);

  const getTrustedDevicesListKey = (id: string) => `connecta_2fa_trusted_devices_${id}`;
  const getTrustedDeviceKey = (id: string) => `connecta_2fa_trusted_${id}`;
  const getDeviceId = () => {
    const key = "connecta_device_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    localStorage.setItem(key, generated);
    return generated;
  };

  const loadTrustedDevices = (id: string) => {
    const raw = localStorage.getItem(getTrustedDevicesListKey(id));
    if (!raw) {
      setTrustedDevices([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [];
      const now = Date.now();
      const filtered = list.filter((item: TrustedDevice) => item?.expiresAt && item.expiresAt > now);

      if (filtered.length !== list.length) {
        localStorage.setItem(getTrustedDevicesListKey(id), JSON.stringify(filtered));
      }

      setTrustedDevices(filtered);
    } catch {
      setTrustedDevices([]);
    }
  };

  const getMaskedEmail = (value: string) => {
    if (!value || value === "loading...") return "loading...";
    const [name, domain] = value.split("@");
    if (!domain) return value;
    const visible = name.length <= 2 ? (name[0] || "*") : name.slice(0, 2);
    const hiddenCount = Math.max(1, name.length - visible.length);
    return `${visible}${"*".repeat(hiddenCount)}@${domain}`;
  };
  
  useEffect(() => {
    if (email) {
      setUserEmail(email);
    }
  }, [email]);

  // Get real user email from Supabase
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user?.email) {
          setUserEmail(user.email);
          setUserId(user.id);
          const { data, error } = await supabase.functions.invoke("twofa", {
            body: { action: "status" }
          });
          if (error) throw error;
          setTwoFAEnabled(data?.enabled === true);
          loadTrustedDevices(user.id);
        } else if (email) {
          setUserEmail(email);
        }
      } catch (error) {
        console.error('Failed to fetch user email:', error);
        setUserEmail(email || "unknown");
      }
    };
    fetchUserEmail();
  }, []);
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return localStorage.getItem('connecta_user_phone') || '';
  });
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Privacy & Safety states - загружаем из localStorage
  const [profileVisibility, setProfileVisibility] = useState<"everyone" | "friends" | "nobody">(() => {
    const saved = localStorage.getItem('connecta_profile_visibility');
    return (saved as "everyone" | "friends" | "nobody") || "everyone";
  });
  const [activityStatus, setActivityStatus] = useState(() => {
    const saved = localStorage.getItem('connecta_activity_status');
    return saved !== null ? saved === 'true' : true;
  });
  const [allowDirectMessages, setAllowDirectMessages] = useState(() => {
    const saved = localStorage.getItem('connecta_allow_dms');
    return saved !== null ? saved === 'true' : true;
  });
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('connecta_blocked_users');
    return saved ? JSON.parse(saved) : [];
  });
  const [showBlockUserDialog, setShowBlockUserDialog] = useState(false);
  const [blockUsername, setBlockUsername] = useState("");
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");

  // Bug Report states
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugCategory, setBugCategory] = useState<"bug" | "feature" | "improvement" | "other">("bug");
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugReports, setBugReports] = useState<Array<{id: string; title: string; description: string; category: string; timestamp: string; status: string}>>(() => {
    const saved = localStorage.getItem('connecta_bug_reports');
    return saved ? JSON.parse(saved) : [];
  });

  // Apply theme to document only if using local theme management
  useEffect(() => {
    if (!externalTheme) {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, externalTheme]);

  // Update tempUsername when username prop changes
  useEffect(() => {
    setTempUsername(username);
  }, [username]);

  // Update userAvatar when avatar prop changes
  useEffect(() => {
    if (avatar !== undefined) {
      setUserAvatar(avatar);
    }
  }, [avatar]);

  // Load real audio/video devices
  useEffect(() => {
    const loadDevices = async () => {
      setDevicesLoading(true);
      
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          // Request permissions first to get device labels
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          } catch {
            // Continue without permissions - we'll get device IDs without labels
          }
          
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const mics = deviceList.filter(d => d.kind === 'audioinput').map((d, i) => ({ 
            id: d.deviceId, 
            name: d.label || `Microphone ${i + 1}` 
          }));
          const cams = deviceList.filter(d => d.kind === 'videoinput').map((d, i) => ({ 
            id: d.deviceId, 
            name: d.label || `Camera ${i + 1}` 
          }));
          const spks = deviceList.filter(d => d.kind === 'audiooutput').map((d, i) => ({ 
            id: d.deviceId, 
            name: d.label || `Speaker ${i + 1}` 
          }));
          
          setAudioDevices({
            microphones: mics.length > 0 ? mics : [{ id: 'default', name: 'Default Microphone' }],
            cameras: cams.length > 0 ? cams : [{ id: 'default', name: 'Default Camera' }],
            speakers: spks.length > 0 ? spks : [{ id: 'default', name: 'Default Speaker' }]
          });
        } catch {
          // Fallback to default devices
          setAudioDevices({
            microphones: [{ id: 'default', name: 'Default Microphone' }],
            cameras: [{ id: 'default', name: 'Default Camera' }],
            speakers: [{ id: 'default', name: 'Default Speaker' }]
          });
        }
      } else {
        setAudioDevices({
          microphones: [{ id: 'default', name: 'Default Microphone' }],
          cameras: [{ id: 'default', name: 'Default Camera' }],
          speakers: [{ id: 'default', name: 'Default Speaker' }]
        });
      }
      setDevicesLoading(false);
    };
    
    loadDevices();
  }, []);

  // Sync with external device selections
  useEffect(() => {
    if (globalSelectedMicrophone !== undefined) setSelectedMicrophone(globalSelectedMicrophone);
  }, [globalSelectedMicrophone]);

  useEffect(() => {
    if (globalSelectedCamera !== undefined) setSelectedCamera(globalSelectedCamera);
  }, [globalSelectedCamera]);

  useEffect(() => {
    if (globalSelectedSpeaker !== undefined) setSelectedSpeaker(globalSelectedSpeaker);
  }, [globalSelectedSpeaker]);

  // Profile management functions
  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setAvatarLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
          const avatarUrl = e.target?.result as string;
          setUserAvatar(avatarUrl);
          setAvatarLoading(false);
          // Update parent component
          if (onUpdateAvatar) {
            onUpdateAvatar(avatarUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleUsernameEdit = () => {
    if (isEditingUsername) {
      // Save username
      setIsEditingUsername(false);
      if (onUpdateUsername && tempUsername.trim()) {
        onUpdateUsername(tempUsername.trim());
      }
      console.log('Saving username:', tempUsername);
    } else {
      setIsEditingUsername(true);
    }
  };

  const handleEmailReveal = () => {
    setIsEmailRevealed(!isEmailRevealed);
  };

  const handlePhoneAdd = () => {
    if (isAddingPhone && phoneNumber.trim()) {
      setIsAddingPhone(false);
      localStorage.setItem('connecta_user_phone', phoneNumber.trim());
      console.log('Adding phone:', phoneNumber);
    } else {
      setIsAddingPhone(true);
    }
  };

  const handlePasswordChange = () => {
    console.log('handlePasswordChange called');
    if (currentPassword && newPassword && newPassword === confirmPassword) {
      console.log('Changing password');
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password changed successfully!");
    } else {
      alert("Please fill all fields correctly!");
    }
  };

  const handleEnable2FA = async () => {
    if (!userEmail || userEmail === "loading...") {
      toast.error("User email not loaded yet", {
        description: "Please try again in a moment"
      });
      return;
    }

    const { data, error } = await supabase.functions.invoke("twofa", {
      body: { action: "setup" }
    });

    if (error) {
      toast.error("Failed to start 2FA setup", {
        description: error.message || "Please try again"
      });
      return;
    }

    setTwoFASetupCode(data?.secret || "");
    setTwoFASetupUrl(data?.otpauthUrl || "");
    setTwoFAVerifyInput("");
    setShow2FADialog(true);
  };

  const handleConfirmEnable2FA = async () => {
    if (!twoFASetupCode) {
      toast.error("Setup code missing", {
        description: "Please reopen 2FA setup"
      });
      return;
    }

    const { error } = await supabase.functions.invoke("twofa", {
      body: { action: "confirm", code: twoFAVerifyInput }
    });

    if (error) {
      toast.error("Invalid verification code", {
        description: error.message || "Please try again"
      });
      return;
    }

    setTwoFAEnabled(true);
    setShow2FADialog(false);
    toast.success("2FA enabled", {
      description: "You will be asked for a code at login"
    });
  };

  const handleDisable2FA = async () => {
    const { error } = await supabase.functions.invoke("twofa", {
      body: { action: "disable" }
    });

    if (error) {
      toast.error("Failed to disable 2FA", {
        description: error.message || "Please try again"
      });
      return;
    }

    setTwoFAEnabled(false);
    toast.info("2FA disabled");
  };

  const handleRemoveTrustedDevice = (deviceId: string) => {
    if (!userId) return;
    const updated = trustedDevices.filter((device) => device.id !== deviceId);
    localStorage.setItem(getTrustedDevicesListKey(userId), JSON.stringify(updated));
    setTrustedDevices(updated);

    const currentDeviceId = getDeviceId();
    if (deviceId === currentDeviceId) {
      localStorage.removeItem(getTrustedDeviceKey(userId));
    }
  };

  const handleRemoveAllTrustedDevices = () => {
    if (!userId) return;
    localStorage.removeItem(getTrustedDevicesListKey(userId));
    localStorage.removeItem(getTrustedDeviceKey(userId));
    setTrustedDevices([]);
  };

  // Privacy & Safety handlers
  const handleProfileVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "everyone" | "friends" | "nobody";
    setProfileVisibility(value);
    localStorage.setItem('connecta_profile_visibility', value);
    console.log('Profile visibility changed to:', value);
  };

  const handleActivityStatusChange = (checked: boolean) => {
    setActivityStatus(checked);
    localStorage.setItem('connecta_activity_status', String(checked));
    console.log('Activity status:', checked);
  };

  const handleDirectMessagesChange = (checked: boolean) => {
    setAllowDirectMessages(checked);
    localStorage.setItem('connecta_allow_dms', String(checked));
    console.log('Direct messages:', checked);
  };

  const handleBlockUser = () => {
    setShowBlockUserDialog(true);
  };

  const handleConfirmBlockUser = () => {
    if (blockUsername.trim()) {
      const updatedBlockedUsers = [...blockedUsers, blockUsername.trim()];
      setBlockedUsers(updatedBlockedUsers);
      localStorage.setItem('connecta_blocked_users', JSON.stringify(updatedBlockedUsers));
      setShowBlockUserDialog(false);
      setBlockUsername("");
      alert(`User ${blockUsername} has been blocked.`);
    } else {
      alert("Please enter a username to block.");
    }
  };

  const handleUnblockUser = (username: string) => {
    const updatedBlockedUsers = blockedUsers.filter(u => u !== username);
    setBlockedUsers(updatedBlockedUsers);
    localStorage.setItem('connecta_blocked_users', JSON.stringify(updatedBlockedUsers));
    console.log('Unblocked user:', username);
  };

  const handleRequestDataExport = () => {
    console.log('Requesting data export...');
    alert("Your data export request has been submitted. You will receive an email with a download link within 24 hours.");
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(true);
  };

  const handleConfirmDeleteAccount = () => {
    if (deleteAccountPassword.trim()) {
      console.log('Deleting account with password verification');
      // In production, this would verify password and delete account
      alert("Account deletion request submitted. Your account will be permanently deleted in 30 days.");
      setShowDeleteAccountDialog(false);
      setDeleteAccountPassword("");
    } else {
      alert("Please enter your password to confirm account deletion.");
    }
  };

  const handleSubmitBugReport = async () => {
    if (!bugTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!bugDescription.trim()) {
      toast.error("Please enter a description");
      return;
    }

    const newReport = {
      id: `bug-${Date.now()}`,
      title: bugTitle,
      description: bugDescription,
      category: bugCategory,
      timestamp: new Date().toISOString(),
      status: "submitted"
    };

    const updatedReports = [...bugReports, newReport];
    setBugReports(updatedReports);
    localStorage.setItem('connecta_bug_reports', JSON.stringify(updatedReports));

    setBugSubmitting(true);
    try {
      // Try to send to Telegram directly
      const result = await sendBugReportToTelegram({
        title: bugTitle,
        description: bugDescription,
        category: bugCategory,
        username,
        email: userEmail,
        userId,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to send bug report");
      }

      toast.success("Report submitted!", {
        description: "Thanks for helping us improve Connecta. We'll review it soon."
      });
      setBugTitle("");
      setBugDescription("");
      setBugCategory("bug");
    } catch (error: any) {
      console.error("Bug report error:", error);
      toast.error("Failed to send report", {
        description: error?.message || "Please check your Telegram bot configuration."
      });
    } finally {
      setBugSubmitting(false);
    }
  };

  const categories = [
    { label: "User Settings", items: [
      { id: "profile", label: "My Account", icon: User },
      { id: "verification", label: "Verification", icon: CheckCircle2 },
      { id: "privacy", label: "Privacy & Safety", icon: Shield },
    ]},
    { label: "App Settings", items: [
      { id: "appearance", label: "Appearance", icon: Palette },
      { id: "voice", label: "Voice & Video", icon: Volume2 },
      { id: "keybinds", label: "Keybinds", icon: Key },
    ]},
    { label: "System", items: [
      { id: "devices", label: "Devices", icon: Computer },
      { id: "bug-report", label: "Report Bug", icon: Bug },
    ]}
  ];

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar flex flex-col pt-12 pb-6 px-2 overflow-y-auto flex-shrink-0">
         {categories.map((section, idx) => (
           <div key={idx} className="mb-6 px-2">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-3">{section.label}</h3>
             <div className="space-y-0.5">
               {section.items.map(item => (
                 <button
                   key={item.id}
                   onClick={() => setActiveCategory(item.id)}
                   className={cn(
                     "w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                     activeCategory === item.id 
                       ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                       : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                   )}
                 >
                   <item.icon className="w-4 h-4" />
                   {item.label}
                 </button>
               ))}
             </div>
           </div>
         ))}
         
         <div className="mt-auto px-4">
           <div className="h-px bg-border mb-4" />
           <button 
             className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium pl-1 transition-colors"
             onClick={() => {
               if (onLogout) {
                 onLogout();
               } else {
                 console.log('Logging out...');
                 alert('Logged out successfully!');
               }
             }}
           >
             <LogOut className="w-4 h-4" /> Log Out
           </button>
           <p className="text-[10px] text-muted-foreground mt-4 pl-1">
             Connecta Client v1.0.0 <br/>
             Stable Build 8923
           </p>
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-background overflow-y-auto">
        <div className="max-w-3xl mx-auto py-14 px-10">
           
           {activeCategory === "profile" && (
             <div className="space-y-8">
               <h2 className="text-xl font-bold mb-6">My Account</h2>
               
               {/* Profile Card Banner */}
               <div className="rounded-t-lg h-24 bg-gradient-to-r from-blue-600 to-teal-500" />
               <div className="bg-card p-4 rounded-b-lg -mt-4 relative z-10 flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                     <div 
                       className="w-20 h-20 rounded-full bg-background p-1.5 -mt-12 ml-4 cursor-pointer group" 
                       onClick={handleAvatarUpload}
                     >
                        {avatarLoading ? (
                          <div className="w-full h-full rounded-full bg-muted animate-pulse" />
                        ) : userAvatar ? (
                          <img src={userAvatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                            <Upload className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        )}
                     </div>
                     <div className="mb-2">
                        <h3 className="text-lg font-bold">{tempUsername}</h3>
                        <p className="text-sm text-muted-foreground">Click avatar to upload</p>
                     </div>
                  </div>
                  <DesignButton variant="secondary" size="sm" onClick={() => setIsEditingProfile(true)}>Edit User Profile</DesignButton>
               </div>

               <div className="bg-card rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                     <div className="flex-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Username</label>
                        {isEditingUsername ? (
                          <Input 
                            value={tempUsername} 
                            onChange={(e) => setTempUsername(e.target.value)}
                            className="mt-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUsernameEdit();
                              if (e.key === 'Escape') {
                                setIsEditingUsername(false);
                                setTempUsername("User#0000");
                              }
                            }}
                          />
                        ) : (
                          <div className="text-foreground">{tempUsername}</div>
                        )}
                     </div>
                     <DesignButton 
                       variant="secondary" 
                       size="sm" 
                       onClick={handleUsernameEdit}
                     >
                       {isEditingUsername ? <Save className="w-4 h-4" /> : "Edit"}
                     </DesignButton>
                  </div>
                  <div className="flex justify-between items-center">
                     <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                        <div className="text-foreground">
                            {isEmailRevealed ? userEmail : getMaskedEmail(userEmail)}
                        </div>
                     </div>
                     <DesignButton variant="secondary" size="sm" onClick={handleEmailReveal}>
                       {isEmailRevealed ? <Eye className="w-4 h-4" /> : "Reveal"}
                     </DesignButton>
                  </div>
                  <div className="flex justify-between items-center">
                     <div className="flex-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                        {isAddingPhone ? (
                          <Input 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="mt-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePhoneAdd();
                              if (e.key === 'Escape') {
                                setIsAddingPhone(false);
                                setPhoneNumber("");
                              }
                            }}
                          />
                        ) : (
                          <div className="text-foreground">
                            {phoneNumber || "Not Set"}
                          </div>
                        )}
                     </div>
                     <DesignButton 
                       variant="secondary" 
                       size="sm" 
                       onClick={handlePhoneAdd}
                     >
                       {isAddingPhone ? <Save className="w-4 h-4" /> : (phoneNumber ? "Edit" : "Add")}
                     </DesignButton>
                  </div>
               </div>

               <div className="pt-8 border-t border-border space-y-4">
                  <h3 className="text-lg font-bold text-foreground">Password and Authentication</h3>
                  <DesignButton 
                    variant="primary" 
                    size="md"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Change Password button clicked');
                      setShowPasswordDialog(true);
                    }}
                  >
                    Change Password
                  </DesignButton>

                  <div className="bg-card rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase">Two-Factor Authentication</label>
                        <div className="text-foreground">{twoFAEnabled ? "Enabled" : "Disabled"}</div>
                      </div>
                      {twoFAEnabled ? (
                        <DesignButton variant="secondary" size="sm" onClick={handleDisable2FA}>
                          Disable
                        </DesignButton>
                      ) : (
                        <DesignButton variant="primary" size="sm" onClick={handleEnable2FA}>
                          Enable
                        </DesignButton>
                      )}
                    </div>
                  </div>

                  <div className="bg-card rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase">Trusted Devices</label>
                        <div className="text-sm text-muted-foreground">Devices that skip 2FA for 30 days.</div>
                      </div>
                      {trustedDevices.length > 0 && (
                        <DesignButton variant="secondary" size="sm" onClick={handleRemoveAllTrustedDevices}>
                          Remove all
                        </DesignButton>
                      )}
                    </div>
                    {trustedDevices.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No trusted devices yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {trustedDevices.map((device) => (
                          <div key={device.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{device.label}</div>
                              <div className="text-xs text-muted-foreground">
                                Expires {new Date(device.expiresAt).toLocaleDateString()}
                              </div>
                            </div>
                            <DesignButton variant="secondary" size="sm" onClick={() => handleRemoveTrustedDevice(device.id)}>
                              Remove
                            </DesignButton>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
               </div>
             </div>
           )}

           {activeCategory === "appearance" && (
              <div className="space-y-8">
                <h2 className="text-xl font-bold mb-6">Appearance</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                   <div className="cursor-pointer group" onClick={() => setTheme("dark")}>
                      <div className={cn(
                        "bg-[#1e1e22] h-24 rounded-lg border-2 mb-2 relative overflow-hidden transition-all",
                        theme === "dark" ? "border-blue-500" : "border-transparent group-hover:border-white/20"
                      )}>
                        <div className="absolute top-2 left-2 w-16 h-8 bg-[#2b2d31] rounded" />
                      </div>
                      <span className={cn(
                        "text-sm transition-colors",
                        theme === "dark" ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>Dark</span>
                   </div>
                   <div className="cursor-pointer group" onClick={() => setTheme("light")}>
                      <div className={cn(
                        "bg-white h-24 rounded-lg border-2 mb-2 relative overflow-hidden transition-all",
                        theme === "light" ? "border-blue-500" : "border-transparent group-hover:border-blue-500/50"
                      )}>
                         <div className="absolute top-2 left-2 w-16 h-8 bg-gray-100 rounded" />
                      </div>
                      <span className={cn(
                        "text-sm transition-colors",
                        theme === "light" ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>Light</span>
                   </div>
                </div>

                <div>
                   <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">Message Display</h3>
                   <div className="bg-card p-4 rounded-lg space-y-4 pointer-events-none">
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-full bg-blue-500" />
                         <div>
                            <div className="flex items-baseline gap-2">
                               <span className="font-medium text-foreground">Connecta User</span>
                               <span className="text-xs text-muted-foreground">Today at 4:20 PM</span>
                            </div>
                            <p className="text-foreground/80 text-sm mt-1">Cozy mode fits more messages on screen.</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
           )}

           {/* Placeholder for other sections */}
           {activeCategory === "verification" && (
             <div className="space-y-8">
               <div className="flex items-start justify-between">
                 <div>
                   <h2 className="text-xl font-bold mb-2">Verification</h2>
                   <p className="text-gray-400 text-sm">Get verified to show authenticity and build trust</p>
                 </div>
                 {isVerified && (
                   <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg">
                     <CheckCircle2 className="w-5 h-5" />
                     <span className="font-medium">Verified</span>
                   </div>
                 )}
               </div>

               {isVerified ? (
                 <div className="bg-card rounded-lg p-6 border border-blue-500/20">
                   <div className="flex items-center gap-3 mb-4">
                     <CheckCircle2 className="w-8 h-8 text-blue-400" />
                     <div>
                       <h3 className="text-lg font-bold">You're Verified!</h3>
                       <p className="text-sm text-muted-foreground">Your account has been verified</p>
                     </div>
                   </div>
                   <p className="text-foreground/80 text-sm">
                     Your verified badge will be displayed on your profile and messages.
                   </p>
                 </div>
               ) : verificationStatus === "pending" ? (
                 <div className="bg-card rounded-lg p-6 border border-yellow-500/20">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                       <div className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse" />
                     </div>
                     <div>
                       <h3 className="text-lg font-bold">Verification Pending</h3>
                       <p className="text-sm text-muted-foreground">Your request is being reviewed</p>
                     </div>
                   </div>
                   <p className="text-foreground/80 text-sm">
                     We're reviewing your verification request. This usually takes 24-48 hours.
                     You'll receive a notification once your request has been processed.
                   </p>
                 </div>
               ) : verificationStatus === "rejected" ? (
                 <div className="bg-card rounded-lg p-6 border border-red-500/20">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center">
                       <XCircle className="w-5 h-5 text-red-400" />
                     </div>
                     <div>
                       <h3 className="text-lg font-bold">Verification Rejected</h3>
                       <p className="text-sm text-muted-foreground">Your request was not approved</p>
                     </div>
                   </div>
                   <p className="text-foreground/80 text-sm mb-4">
                     Unfortunately, your verification request didn't meet our criteria.
                     You can submit a new request with updated information.
                   </p>
                   <Button 
                     variant="secondary" 
                     onClick={() => onSubmitVerification && onSubmitVerification({ reason: "", links: [] })}
                     className="bg-muted hover:bg-muted/80"
                   >
                     Submit New Request
                   </Button>
                 </div>
               ) : (
                 <div className="bg-card rounded-lg p-6">
                   <h3 className="text-lg font-bold mb-4">Apply for Verification</h3>
                   
                   <div className="space-y-6">
                     <div>
                       <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
                         Why do you want to be verified?
                       </label>
                       <textarea
                         value={verificationReason}
                         onChange={(e) => setVerificationReason(e.target.value)}
                         placeholder="Explain why your account should be verified (e.g., content creator, public figure, brand)..."
                         className="w-full h-32 bg-background text-foreground rounded-lg p-3 border border-border focus:border-blue-500 outline-none resize-none text-sm"
                       />
                       <p className="text-xs text-muted-foreground mt-1">
                         {verificationReason.length}/500 characters
                       </p>
                     </div>

                     <div>
                       <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
                         Social Media Links (Optional)
                       </label>
                       <p className="text-xs text-muted-foreground mb-3">
                         Add links to your social media profiles to help verify your identity
                       </p>
                       <div className="space-y-2">
                         {verificationLinks.map((link, index) => (
                           <div key={index} className="flex gap-2">
                             <input
                               type="url"
                               value={link}
                               onChange={(e) => {
                                 const newLinks = [...verificationLinks];
                                 newLinks[index] = e.target.value;
                                 setVerificationLinks(newLinks);
                               }}
                               placeholder="https://..."
                               className="flex-1 bg-background text-foreground rounded-lg px-3 py-2 border border-border focus:border-blue-500 outline-none text-sm"
                             />
                             {verificationLinks.length > 1 && (
                               <button
                                 onClick={() => setVerificationLinks(verificationLinks.filter((_, i) => i !== index))}
                                 className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-sm"
                               >
                                 Remove
                               </button>
                             )}
                           </div>
                         ))}
                       </div>
                       {verificationLinks.length < 5 && (
                         <button
                           onClick={() => setVerificationLinks([...verificationLinks, ""])}
                           className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                         >
                           + Add another link
                         </button>
                       )}
                     </div>

                     <div className="pt-4 border-t border-border">
                       <Button
                         onClick={() => {
                           if (verificationReason.trim() && onSubmitVerification) {
                             onSubmitVerification({
                               reason: verificationReason,
                               links: verificationLinks.filter(l => l.trim() !== "")
                             });
                             setVerificationReason("");
                             setVerificationLinks([""]);
                           }
                         }}
                         disabled={!verificationReason.trim()}
                         className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white border-none w-full"
                       >
                         Submit Verification Request
                       </Button>
                       <p className="text-xs text-muted-foreground mt-3">
                         By submitting, you agree that the information provided is accurate.
                         False information may result in permanent account suspension.
                       </p>
                     </div>
                   </div>
                 </div>
               )}

               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4">Verification Benefits</h3>
                 <ul className="space-y-3">
                   <li className="flex items-start gap-3">
                     <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                     <div>
                       <div className="font-medium">Verified Badge</div>
                       <div className="text-sm text-muted-foreground">Show your authenticity with a blue checkmark</div>
                     </div>
                   </li>
                   <li className="flex items-start gap-3">
                     <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                     <div>
                       <div className="font-medium">Increased Trust</div>
                       <div className="text-sm text-muted-foreground">Build credibility with your community</div>
                     </div>
                   </li>
                   <li className="flex items-start gap-3">
                     <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                     <div>
                       <div className="font-medium">Stand Out</div>
                       <div className="text-sm text-muted-foreground">Your messages and profile will be highlighted</div>
                     </div>
                   </li>
                 </ul>
               </div>
             </div>
           )}

           {/* Privacy & Safety */}
           {activeCategory === "privacy" && (
             <div className="space-y-8">
               <h2 className="text-xl font-bold mb-6">Privacy & Safety</h2>
               
               {/* Privacy Settings */}
               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4">Privacy Settings</h3>
                 <div className="space-y-4">
                   <div className="flex items-center justify-between py-3 border-b border-border">
                     <div className="flex items-start gap-3">
                       <Eye className="w-5 h-5 text-muted-foreground mt-0.5" />
                       <div>
                         <div className="font-medium">Profile Visibility</div>
                         <div className="text-sm text-muted-foreground">Who can see your profile information</div>
                       </div>
                     </div>
                     <select 
                       className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                       value={profileVisibility}
                       onChange={handleProfileVisibilityChange}
                     >
                       <option value="everyone">Everyone</option>
                       <option value="friends">Friends Only</option>
                       <option value="nobody">Nobody</option>
                     </select>
                   </div>
                   
                   <div className="flex items-center justify-between py-3 border-b border-border">
                     <div className="flex items-start gap-3">
                       <Bell className="w-5 h-5 text-muted-foreground mt-0.5" />
                       <div>
                         <div className="font-medium">Activity Status</div>
                         <div className="text-sm text-muted-foreground">Show when you're online or active</div>
                       </div>
                     </div>
                     <Switch 
                       checked={activityStatus} 
                       onCheckedChange={handleActivityStatusChange}
                     />
                   </div>
                   
                   <div className="flex items-center justify-between py-3 border-b border-border">
                     <div className="flex items-start gap-3">
                       <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
                       <div>
                         <div className="font-medium">Direct Messages</div>
                         <div className="text-sm text-muted-foreground">Allow DMs from server members</div>
                       </div>
                     </div>
                     <Switch 
                       checked={allowDirectMessages} 
                       onCheckedChange={handleDirectMessagesChange}
                     />
                   </div>
                 </div>
               </div>

               {/* Blocked Users */}
               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4">Blocked Users</h3>
                 {blockedUsers.length === 0 ? (
                   <p className="text-muted-foreground text-sm mb-4">You haven't blocked anyone yet</p>
                 ) : (
                   <div className="space-y-2 mb-4">
                     {blockedUsers.map((username, index) => (
                       <div key={index} className="flex items-center justify-between py-2 px-3 bg-background rounded-lg">
                         <span className="text-sm">{username}</span>
                         <Button 
                           variant="ghost" 
                           size="sm"
                           onClick={() => handleUnblockUser(username)}
                           className="text-red-500 hover:text-red-400"
                         >
                           Unblock
                         </Button>
                       </div>
                     ))}
                   </div>
                 )}
                 <Button 
                   variant="secondary" 
                   size="sm"
                   onClick={handleBlockUser}
                 >
                   <Lock className="w-4 h-4 mr-2" />
                   Block User
                 </Button>
               </div>

               {/* Data & Privacy */}
               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4 text-red-500">Data & Privacy</h3>
                 <div className="space-y-3">
                   <Button 
                     variant="secondary" 
                     className="w-full justify-start"
                     onClick={handleRequestDataExport}
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     Request Data Export
                   </Button>
                   <Button 
                     variant="secondary" 
                     className="w-full justify-start text-red-500 hover:text-red-400"
                     onClick={handleDeleteAccount}
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     Delete Account
                   </Button>
                 </div>
               </div>
             </div>
           )}

           {/* Voice & Video */}
           {activeCategory === "voice" && (
             <div className="space-y-8">
               <h2 className="text-xl font-bold mb-6">Voice & Video</h2>
               
               {/* Input Device */}
               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <Mic className="w-5 h-5" />
                   Input Device
                 </h3>
                 <div className="space-y-4">
                   <div>
                     <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Microphone</label>
                       <select 
                         className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                         value={selectedMicrophone}
                         onChange={(e) => {
                           setSelectedMicrophone(e.target.value);
                           onDeviceChange?.('microphone', e.target.value);
                         }}
                         disabled={devicesLoading}
                       >
                         {devicesLoading ? (
                           <option>Loading devices...</option>
                         ) : (
                           audioDevices.microphones.map(device => (
                             <option key={device.id} value={device.id}>{device.name}</option>
                           ))
                         )}
                     </select>
                   </div>
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="font-medium">Input Sensitivity</div>
                       <div className="text-sm text-muted-foreground">Automatically determine input sensitivity</div>
                     </div>
                     <Switch defaultChecked />
                   </div>
                 </div>
               </div>

               {/* Output Device */}
               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <Headphones className="w-5 h-5" />
                   Output Device
                 </h3>
                 <div>
                   <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Speaker/Headphones</label>
                     <select 
                       className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                       value={selectedSpeaker}
                       onChange={(e) => {
                         setSelectedSpeaker(e.target.value);
                         onDeviceChange?.('speaker', e.target.value);
                       }}
                       disabled={devicesLoading}
                     >
                       {devicesLoading ? (
                         <option>Loading devices...</option>
                       ) : (
                         audioDevices.speakers.map(device => (
                           <option key={device.id} value={device.id}>{device.name}</option>
                         ))
                       )}
                   </select>
                 </div>
               </div>

               {/* Video Settings */}
               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <Video className="w-5 h-5" />
                   Video Settings
                 </h3>
                 <div className="space-y-4">
                   <div>
                     <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Camera</label>
                       <select 
                         className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                         value={selectedCamera}
                         onChange={(e) => {
                           setSelectedCamera(e.target.value);
                           onDeviceChange?.('camera', e.target.value);
                         }}
                         disabled={devicesLoading}
                       >
                         {devicesLoading ? (
                           <option>Loading devices...</option>
                         ) : (
                           audioDevices.cameras.map(device => (
                             <option key={device.id} value={device.id}>{device.name}</option>
                           ))
                         )}
                     </select>
                   </div>
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="font-medium">Enable Hardware Acceleration</div>
                       <div className="text-sm text-muted-foreground">Use GPU for video processing</div>
                     </div>
                     <Switch defaultChecked />
                   </div>
                 </div>
               </div>

               {/* Advanced */}
               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4">Advanced</h3>
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="font-medium">Echo Cancellation</div>
                       <div className="text-sm text-muted-foreground">Reduce echo during calls</div>
                     </div>
                     <Switch defaultChecked />
                   </div>
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="font-medium">Noise Suppression</div>
                       <div className="text-sm text-muted-foreground">Filter background noise</div>
                     </div>
                     <Switch defaultChecked />
                   </div>
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="font-medium">Automatic Gain Control</div>
                       <div className="text-sm text-muted-foreground">Normalize audio levels</div>
                     </div>
                     <Switch defaultChecked />
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Keybinds */}
           {activeCategory === "keybinds" && (
             <div className="space-y-8">
               <h2 className="text-xl font-bold mb-6">Keybinds</h2>
               
               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4">Voice & Video Shortcuts</h3>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between py-3 border-b border-border">
                     <div>
                       <div className="font-medium flex items-center gap-2">
                         Toggle Mute
                         <span className={`text-xs px-2 py-0.5 rounded-full ${
                           isMuted 
                             ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                             : "bg-green-500/20 text-green-400 border border-green-500/30"
                         }`}>
                           {isMuted ? "MUTED" : "UNMUTED"}
                         </span>
                       </div>
                       <div className="text-sm text-muted-foreground">Mute/unmute your microphone</div>
                     </div>
                     <kbd className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-mono">Ctrl + M</kbd>
                   </div>
                   <div className="flex items-center justify-between py-3 border-b border-border">
                     <div>
                       <div className="font-medium flex items-center gap-2">
                         Toggle Deafen
                         <span className={`text-xs px-2 py-0.5 rounded-full ${
                           isDeafened 
                             ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                             : "bg-green-500/20 text-green-400 border border-green-500/30"
                         }`}>
                           {isDeafened ? "DEAFENED" : "LISTENING"}
                         </span>
                       </div>
                       <div className="text-sm text-muted-foreground">Disable all audio</div>
                     </div>
                     <kbd className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-mono">Ctrl + D</kbd>
                   </div>
                   <div className="flex items-center justify-between py-3 border-b border-border">
                     <div>
                       <div className="font-medium flex items-center gap-2">
                         Toggle Video
                         <span className={`text-xs px-2 py-0.5 rounded-full ${
                           isVideoEnabled 
                             ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                             : "bg-red-500/20 text-red-400 border border-red-500/30"
                         }`}>
                           {isVideoEnabled ? "ON" : "OFF"}
                         </span>
                       </div>
                       <div className="text-sm text-muted-foreground">Turn camera on/off</div>
                     </div>
                     <kbd className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-mono">Ctrl + E</kbd>
                   </div>
                 </div>
               </div>

               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4">Navigation Shortcuts</h3>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between py-3 border-b border-border">
                     <div>
                       <div className="font-medium">Quick Switcher</div>
                       <div className="text-sm text-muted-foreground">Jump to any server or channel</div>
                     </div>
                     <kbd className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-mono">Ctrl + K</kbd>
                   </div>
                   <div className="flex items-center justify-between py-3 border-b border-border">
                     <div>
                       <div className="font-medium">User Settings</div>
                       <div className="text-sm text-muted-foreground">Open settings panel</div>
                     </div>
                     <kbd className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-mono">Ctrl + ,</kbd>
                   </div>
                   <div className="flex items-center justify-between py-3 border-b border-border">
                     <div>
                       <div className="font-medium">Close Window</div>
                       <div className="text-sm text-muted-foreground">Close current window or modal</div>
                     </div>
                     <kbd className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-mono">Esc</kbd>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Devices */}
           {activeCategory === "devices" && (
             <div className="space-y-8">
               <h2 className="text-xl font-bold mb-6">Devices</h2>
               
               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4">Active Sessions</h3>
                 <p className="text-muted-foreground text-sm mb-6">
                   You're currently signed in on these devices
                 </p>
                 
                 {devices.length === 0 ? (
                   <p className="text-muted-foreground text-sm">No active sessions found</p>
                 ) : (
                   <div className="space-y-4">
                     {devices.map((device) => {
                       // Выбор иконки в зависимости от типа устройства
                       let DeviceIcon = Monitor;
                       if (device.type === "desktop") DeviceIcon = Computer;
                       else if (device.type === "mobile") DeviceIcon = Smartphone;
                       
                       const iconColor = device.isCurrent ? "text-blue-500" : "text-muted-foreground";
                       const bgColor = device.isCurrent ? "bg-blue-500/20" : "bg-muted/20";
                       
                       // Форматирование времени
                       const timeAgo = getTimeAgo(device.lastActive);
                       
                       return (
                         <div key={device.id} className="flex items-start justify-between p-4 bg-background rounded-lg border border-border">
                           <div className="flex items-start gap-4">
                             <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center`}>
                               <DeviceIcon className={`w-6 h-6 ${iconColor}`} />
                             </div>
                             <div className="flex-1">
                               <div className="font-medium flex items-center gap-2">
                                 {device.name}
                                 {device.isCurrent && (
                                   <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Current</span>
                                 )}
                               </div>
                               <div className="text-sm text-muted-foreground">Last active: {timeAgo}</div>
                               <div className="text-xs text-muted-foreground mt-1">Location: {device.location}</div>
                               <div className="text-xs text-muted-foreground mt-1 capitalize">
                                 {device.type} device
                               </div>
                             </div>
                           </div>
                           {!device.isCurrent && onRevokeDevice && (
                             <Button 
                               variant="secondary" 
                               size="sm" 
                               className="text-red-500 hover:text-red-400"
                               onClick={() => onRevokeDevice(device.id)}
                             >
                               Revoke
                             </Button>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>

               <div className="bg-card rounded-lg p-6">
                 <h3 className="text-lg font-bold mb-4 text-red-500">Security Actions</h3>
                 <Button 
                   variant="secondary" 
                   className="text-red-500 hover:text-red-400"
                   onClick={onLogoutAllDevices}
                   disabled={!onLogoutAllDevices || devices.length === 0}
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Log Out All Devices
                 </Button>
               </div>
             </div>
           )}

           {/* Bug Report Section */}
           {activeCategory === "bug-report" && (
             <div className="space-y-6">
               <div>
                 <h2 className="text-2xl font-bold mb-2">Report a Bug</h2>
                 <p className="text-muted-foreground">
                   Help us improve Connecta by reporting bugs or suggesting features.
                 </p>
               </div>

               <div className="bg-card rounded-lg p-6 space-y-4">
                 <div>
                   <Label className="text-sm font-medium">Bug Category</Label>
                   <div className="grid grid-cols-2 gap-2 mt-2">
                     {[
                       { value: "bug", label: "🐛 Bug Report", color: "text-red-500" },
                       { value: "feature", label: "✨ Feature Request", color: "text-blue-500" },
                       { value: "improvement", label: "📈 Improvement", color: "text-green-500" },
                       { value: "other", label: "💬 Other", color: "text-gray-500" }
                     ].map((cat) => (
                       <button
                         key={cat.value}
                         onClick={() => setBugCategory(cat.value as any)}
                         className={cn(
                           "p-3 rounded-lg border-2 transition-all text-left",
                           bugCategory === cat.value
                             ? "border-blue-500 bg-blue-500/10"
                             : "border-border hover:border-blue-500/50"
                         )}
                       >
                         <span className={cat.color}>{cat.label}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                   <Label htmlFor="bug-title">Title</Label>
                   <Input
                     id="bug-title"
                     placeholder="Brief description of the issue..."
                     value={bugTitle}
                     onChange={(e) => setBugTitle(e.target.value)}
                     className="mt-2"
                   />
                 </div>

                 <div>
                   <Label htmlFor="bug-description">Description</Label>
                   <textarea
                     id="bug-description"
                     placeholder="Detailed explanation of the bug or feature request..."
                     value={bugDescription}
                     onChange={(e) => setBugDescription(e.target.value)}
                     className="mt-2 w-full min-h-[150px] bg-background border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                 </div>

                 <Button
                   onClick={() => {
                     if (!bugTitle.trim()) {
                       alert("Please enter a title");
                       return;
                     }
                     if (!bugDescription.trim()) {
                       alert("Please enter a description");
                       return;
                     }

                     const newReport = {
                       id: `bug-${Date.now()}`,
                       title: bugTitle,
                       description: bugDescription,
                       category: bugCategory,
                       timestamp: new Date().toISOString(),
                       status: "submitted"
                     };

                     const updatedReports = [...bugReports, newReport];
                     setBugReports(updatedReports);
                     localStorage.setItem('connecta_bug_reports', JSON.stringify(updatedReports));

                     // Send to webhook or API
                     fetch("https://discord.com/api/webhooks/YOUR_WEBHOOK_URL", {
                       method: "POST",
                       headers: { "Content-Type": "application/json" },
                       body: JSON.stringify({
                         content: `**New ${bugCategory.toUpperCase()}**\\n**Title:** ${bugTitle}\\n**Description:** ${bugDescription}\\n**User:** ${username}\\n**Time:** ${new Date().toLocaleString()}`
                       })
                     }).catch(() => {});

                     alert("Report submitted! Thank you for your feedback.");
                     setBugTitle("");
                     setBugDescription("");
                     setBugCategory("bug");
                   }}
                   className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                 >
                   <Send className="w-4 h-4 mr-2" />
                   Submit Report
                 </Button>
               </div>

               {/* Previous Reports */}
               {bugReports.length > 0 && (
                 <div className="bg-card rounded-lg p-6">
                   <h3 className="text-lg font-bold mb-4">Your Previous Reports</h3>
                   <div className="space-y-3">
                     {bugReports.slice(-5).reverse().map((report) => (
                       <div key={report.id} className="p-4 rounded-lg bg-background border border-border">
                         <div className="flex items-start justify-between mb-2">
                           <div className="flex-1">
                             <div className="font-semibold">{report.title}</div>
                             <div className="text-xs text-muted-foreground mt-1">
                               {new Date(report.timestamp).toLocaleDateString()} • {report.category}
                             </div>
                           </div>
                           <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                             {report.status}
                           </span>
                         </div>
                         <p className="text-sm text-muted-foreground line-clamp-2">
                           {report.description}
                         </p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* Placeholder for other sections */}
           {!["profile", "appearance", "verification", "privacy", "voice", "keybinds", "devices", "bug-report"].includes(activeCategory) && (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                 <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <SettingsIcon className="w-8 h-8 text-muted-foreground" />
                 </div>
                 <h3 className="text-lg font-medium">Coming Soon</h3>
                 <p className="text-muted-foreground">This settings panel is under construction.</p>
              </div>
           )}

        </div>
      </div>
      
      {/* Quick Close Button (Native App Style) - скрывается когда открыт диалог */}
      {!showPasswordDialog && !show2FADialog && !showBlockUserDialog && !showDeleteAccountDialog && (
        <div className="absolute top-4 right-4 z-50 flex flex-col items-center gap-1 group cursor-pointer" onClick={() => {
          if (onClose) onClose();
        }}>           <div className="w-9 h-9 rounded-full border-2 border-muted-foreground flex items-center justify-center group-hover:bg-muted/20 transition-all">
              <span className="text-muted-foreground text-lg font-light group-hover:text-foreground">✕</span>
           </div>
           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">Esc</span>
        </div>
      )}

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password"
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password"
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input 
                id="confirm-password"
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
              <Button onClick={handlePasswordChange}>Save Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-48 h-48 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {twoFASetupUrl ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFASetupUrl)}`}
                    alt="2FA QR code"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="text-muted-foreground">QR Code</div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
            </div>
            <div>
              <Label>Manual Entry Secret</Label>
              <div className="bg-muted p-3 rounded text-center font-mono text-sm">
                {twoFASetupCode || "------"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                If you cannot scan the QR code, enter this secret in your authenticator app.
              </p>
            </div>
            <div>
              <Label htmlFor="verify-code">Verification Code</Label>
              <Input 
                id="verify-code"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={twoFAVerifyInput}
                onChange={(e) => setTwoFAVerifyInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShow2FADialog(false)}>Cancel</Button>
              <Button onClick={handleConfirmEnable2FA}>Enable 2FA</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block User Dialog */}
      <Dialog open={showBlockUserDialog} onOpenChange={setShowBlockUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="block-username">Username</Label>
              <Input 
                id="block-username"
                type="text" 
                value={blockUsername}
                onChange={(e) => setBlockUsername(e.target.value)}
                placeholder="Enter username to block"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmBlockUser();
                  }
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Blocked users won't be able to send you messages or see your online status.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => {
                setShowBlockUserDialog(false);
                setBlockUsername("");
              }}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmBlockUser}>Block User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">⚠️ Warning: This action cannot be undone!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Deleting your account will permanently remove all your data, including messages, files, and settings.
              </p>
            </div>
            <div>
              <Label htmlFor="delete-password">Confirm Your Password</Label>
              <Input 
                id="delete-password"
                type="password" 
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmDeleteAccount();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => {
                setShowDeleteAccountDialog(false);
                setDeleteAccountPassword("");
              }}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDeleteAccount}>Delete My Account</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
