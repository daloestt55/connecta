import React, { useState, useEffect } from "react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Button } from "@/app/components/design-system/Button";
import { Edit2, Share2, Shield, Calendar, X, Check, Palette, CheckCircle2, Upload, Users, Loader2, Crown, Lock, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateProfileLink, copyToClipboard } from "@/app/utils/linkGenerator";
import { toast } from "sonner";
import { getPurchasedItems, hasPremium, hasItem } from "@/app/utils/payments";

interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
}

interface Server {
  id: string;
  name: string;
  icon?: string;
  memberCount: number;
}

interface UserProfileProps {
  user: User;
  onUpdateUser: (updates: { username?: string; avatar?: string; bio?: string }) => void;
}

export function UserProfile({ user, onUpdateUser }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [purchasedThemes, setPurchasedThemes] = useState<string[]>([]);
  const [purchasedFrames, setPurchasedFrames] = useState<string[]>([]);
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('connecta_profile_accent_color') || 'blue';
  });
  const [bio, setBio] = useState(() => {
    return localStorage.getItem('connecta_profile_bio') || user.bio || '';
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return localStorage.getItem('connecta_profile_avatar') || user.avatar || null;
  });
  const [selectedBanner, setSelectedBanner] = useState(() => {
    return localStorage.getItem('connecta_profile_banner') || 'gradient-blue';
  });
  const [customBannerUrl, setCustomBannerUrl] = useState<string | null>(() => {
    return localStorage.getItem('connecta_profile_custom_banner') || null;
  });
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "servers">("overview");
  
  // Mutual servers state
  const [mutualServers, setMutualServers] = useState<Server[]>([]);
  const [serversLoading, setServersLoading] = useState(false);

  // Check premium status and purchased items
  useEffect(() => {
    const premium = hasPremium();
    setIsPremium(premium);
    
    // Load purchased themes and frames
    const items = getPurchasedItems();
    const themes = items.filter(item => item.itemType === 'theme').map(item => item.itemId);
    const frames = items.filter(item => item.itemType === 'frame').map(item => item.itemId);
    setPurchasedThemes(themes);
    setPurchasedFrames(frames);
  }, []);

  const banners = [
    { id: "gradient-purple", name: "Purple Cosmic", gradient: "from-purple-900 via-purple-700 to-black", requiresPremium: false },
    { id: "gradient-blue", name: "Blue Ocean", gradient: "from-blue-900 via-blue-700 to-black", requiresPremium: false },
    { id: "gradient-red", name: "Red Sunset", gradient: "from-red-900 via-orange-700 to-black", requiresPremium: false },
    { id: "gradient-green", name: "Green Forest", gradient: "from-green-900 via-teal-700 to-black", requiresPremium: false },
    { id: "theme-dark-purple", name: "Dark Purple", gradient: "from-purple-900 to-black", requiresPremium: true, storeItemId: "theme-dark-purple" },
    { id: "theme-ocean", name: "Ocean Waves", gradient: "from-blue-900 via-teal-700 to-black", requiresPremium: true, storeItemId: "theme-ocean" },
    { id: "theme-sunset", name: "Sunset Vibes", gradient: "from-orange-500 via-pink-500 to-purple-900", requiresPremium: true, storeItemId: "theme-sunset" },
  ];

  const colors = [
    { id: "blue", class: "bg-blue-500", borderClass: "border-blue-500", gradientFrom: "from-blue-900", requiresPremium: false },
    { id: "purple", class: "bg-purple-500", borderClass: "border-purple-500", gradientFrom: "from-purple-900", requiresPremium: false },
    { id: "green", class: "bg-green-500", borderClass: "border-green-500", gradientFrom: "from-green-900", requiresPremium: true },
    { id: "orange", class: "bg-orange-500", borderClass: "border-orange-500", gradientFrom: "from-orange-900", requiresPremium: true },
    { id: "pink", class: "bg-pink-500", borderClass: "border-pink-500", gradientFrom: "from-pink-900", requiresPremium: true },
    { id: "gray", class: "bg-gray-500", borderClass: "border-gray-500", gradientFrom: "from-gray-900", requiresPremium: true },
  ];

  const getAccentClasses = () => {
    const color = colors.find(c => c.id === accentColor);
    return color || colors[0];
  };

  const getCurrentBanner = () => {
    const banner = banners.find(b => b.id === selectedBanner);
    return banner || banners[1];
  };

  const handleBannerUpload = () => {
    console.log('Banner upload clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('File selected:', file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          console.log('File loaded, setting banner');
          setCustomBannerUrl(result);
          setSelectedBanner('custom');
          localStorage.setItem('connecta_profile_custom_banner', result);
          localStorage.setItem('connecta_profile_banner', 'custom');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Save profile settings when they change
  useEffect(() => {
    localStorage.setItem('connecta_profile_accent_color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('connecta_profile_bio', bio);
  }, [bio]);

  useEffect(() => {
    if (avatarUrl) {
      localStorage.setItem('connecta_profile_avatar', avatarUrl);
    }
  }, [avatarUrl]);

  useEffect(() => {
    localStorage.setItem('connecta_profile_banner', selectedBanner);
  }, [selectedBanner]);

  const handleServerClick = (server: Server) => {
    console.log('Navigating to server:', server.name);
    alert(`Opening server: ${server.name}\n\nIn a real app, this would navigate to the server page.`);
  };

  // Load mutual servers when switching to servers tab
  useEffect(() => {
    if (activeTab === 'servers' && mutualServers.length === 0 && !serversLoading) {
      loadMutualServers();
    }
  }, [activeTab]);

  const loadMutualServers = async () => {
    setServersLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // В реальном приложении здесь будет fetch к API:
      // const response = await fetch(`/api/users/${user.id}/mutual-servers`);
      // const data = await response.json();
      // setMutualServers(data);
      
      // Пока заглушка - пустой массив
      setMutualServers([]);
      console.log('Mutual servers loaded from API');
    } catch (error) {
      console.error('Failed to load mutual servers:', error);
      setMutualServers([]);
    } finally {
      setServersLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto animate-in fade-in duration-500 bg-[#0A0A0C] relative">
      
      {/* Banner Area */}
      <div className={cn(
        "w-full h-32 relative transition-all duration-700 flex-shrink-0",
        isEditing ? "bg-black" : selectedBanner === 'custom' && customBannerUrl ? "" : `bg-gradient-to-r ${getCurrentBanner().gradient}`,
        !isEditing && "pointer-events-none"
      )}>
        {selectedBanner === 'custom' && customBannerUrl && !isEditing && (
          <img 
            src={customBannerUrl} 
            alt="Custom Banner" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
         {isEditing && (
           <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto">
              <div className="flex gap-4 backdrop-blur-md bg-black/50 p-6 rounded-2xl shadow-2xl border border-white/20 pointer-events-auto">
                {/* Upload Custom Banner Button */}
                <button
                  onClick={handleBannerUpload}
                  type="button"
                  className={cn(
                    "relative group w-32 h-20 rounded-xl overflow-hidden transition-all duration-300",
                    "hover:scale-105 hover:shadow-2xl border-2 border-dashed cursor-pointer pointer-events-auto",
                    selectedBanner === 'custom' 
                      ? "border-green-500 bg-green-500/20 scale-105 shadow-2xl shadow-green-500/20" 
                      : "border-white/40 bg-white/10 opacity-80 hover:opacity-100 hover:border-white/60"
                  )}
                >
                  {customBannerUrl ? (
                    <>
                      <img src={customBannerUrl} alt="Custom" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all" />
                      {selectedBanner === 'custom' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Upload className="w-7 h-7 text-white mb-1" />
                      <p className="text-white text-xs font-semibold">Upload</p>
                    </div>
                  )}
                </button>

                {banners.map((banner) => {
                  const isLocked = banner.requiresPremium && !isPremium && (!banner.storeItemId || !purchasedThemes.includes(banner.storeItemId));
                  return (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          toast.info("Premium theme", {
                            description: `Upgrade to Premium or purchase this theme to unlock ${banner.name}`,
                            action: {
                              label: "View Store",
                              onClick: () => {
                                window.dispatchEvent(new Event('navigate-to-store'));
                              }
                            }
                          });
                          return;
                        }
                        console.log('Banner selected:', banner.id);
                        setSelectedBanner(banner.id);
                      }}
                      className={cn(
                        "relative group w-32 h-20 rounded-xl overflow-hidden transition-all duration-300 pointer-events-auto",
                        isLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:scale-105 hover:shadow-2xl",
                        selectedBanner === banner.id 
                          ? "ring-4 ring-green-500 scale-105 shadow-2xl shadow-green-500/20" 
                          : "opacity-80 hover:opacity-100 ring-2 ring-white/20"
                      )}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${banner.gradient}`} />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all" />
                      
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      )}
                      
                      {selectedBanner === banner.id && !isLocked && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-white text-xs font-semibold text-center flex items-center justify-center gap-1">
                          {banner.name}
                          {isLocked && <Lock className="w-3 h-3" />}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
           </div>
         )}
         
         {!isEditing && (
           <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50 z-10 pointer-events-none">
             <Button 
               variant="secondary" 
               size="sm" 
               className="pointer-events-auto"
               onClick={() => {
                 console.log('Customize Profile clicked');
                 setIsEditing(true);
               }} 
               leftIcon={<Edit2 className="w-3 h-3" />}
             >
               Customize Profile
             </Button>
           </div>
         )}
      </div>

      {/* Profile Header Info */}
      <div className="relative px-8 pb-8 mt-0 flex items-end justify-between z-20 flex-shrink-0">
         <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-3xl bg-[#0A0A0C] p-2 relative group">
               <div className={cn(
                 "w-full h-full rounded-2xl bg-white/5 border flex items-center justify-center overflow-hidden transition-all duration-300",
                 isEditing ? `${getAccentClasses().borderClass} border-2` : "border-white/10"
               )}>
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/5" />
                  )}
                  {isEditing && (
                    <div 
                      className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer rounded-2xl"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              setAvatarUrl(result);
                              onUpdateUser({ avatar: result });
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <Edit2 className="w-6 h-6 text-white" />
                    </div>
                  )}
               </div>
            </div>

            {/* Text Info */}
            <div className="mb-4 space-y-1">
               <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                 {user.username}
                 {user.isVerified && (
                   <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500">
                     <CheckCircle2 className="w-4 h-4 text-white" />
                   </div>
                 )}
                 {isPremium && (
                   <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                     <Crown className="w-3 h-3 text-yellow-500" />
                     <span className="text-xs font-medium text-yellow-500">Premium</span>
                   </div>
                 )}
                 <span className="text-gray-500 text-xl font-normal">#{user.id.slice(-4)}</span>
               </h1>
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black" />
                  <span className="text-sm text-green-400">Online</span>
               </div>
            </div>
         </div>

         <div className="mb-6 flex gap-3 relative z-30 flex-shrink-0">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                   <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button onClick={() => setIsEditing(false)} className="bg-green-600 hover:bg-green-700 text-white border-none">
                   <Check className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(true)} className="pointer-events-auto">Edit Profile</Button>
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="pointer-events-auto"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const profileLink = generateProfileLink(user.id);
                    const success = await copyToClipboard(profileLink);
                    if (success) {
                      toast.success('Profile link copied!', {
                        description: profileLink
                      });
                    } else {
                      toast.error('Failed to copy link');
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </>
            )}
         </div>
      </div>

      {/* Customization Drawer / Content */}
      {isEditing && (
        <div className="px-8 pb-8 animate-in slide-in-from-top-4 flex-shrink-0">
           <GlassCard className="p-6 border-blue-500/30 bg-blue-500/5">
              <h3 className="text-white font-bold flex items-center gap-2 mb-6">
                <Palette className="w-5 h-5 text-blue-400" /> 
                Profile Customization
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                      Accent Color
                      {!isPremium && <span className="text-xs font-normal text-gray-500">(2 free, more with Premium)</span>}
                    </label>
                    <div className="flex gap-3">
                       {colors.map(c => {
                         const isLocked = c.requiresPremium && !isPremium;
                         return (
                           <button 
                             key={c.id}
                             onClick={() => {
                               if (isLocked) {
                                 toast.info("Premium feature", {
                                   description: "Upgrade to Premium to unlock more accent colors",
                                   action: {
                                     label: "View Premium",
                                     onClick: () => {
                                       window.dispatchEvent(new Event('navigate-to-store'));
                                     }
                                   }
                                 });
                                 return;
                               }
                               setAccentColor(c.id);
                             }}
                             className={cn(
                               "w-10 h-10 rounded-full transition-all relative group",
                               c.class,
                               isLocked && "cursor-not-allowed opacity-30",
                               !isLocked && accentColor === c.id && "ring-2 ring-white scale-110",
                               !isLocked && accentColor !== c.id && "opacity-50 hover:opacity-100"
                             )}
                           >
                             {isLocked && (
                               <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                                 <Lock className="w-4 h-4 text-white" />
                               </div>
                             )}
                           </button>
                         );
                       })}
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                      Avatar Frames
                      {!isPremium && <span className="text-xs font-normal text-gray-500">(Premium feature)</span>}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                       <div 
                         className="h-16 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500 cursor-pointer flex items-center justify-center text-xs text-gray-400"
                       >
                         None
                       </div>
                       
                       {/* Neon Glow Frame */}
                       <div 
                         onClick={() => {
                           if (!isPremium && !purchasedFrames.includes('avatar-frame-neon')) {
                             toast.info("Premium frame", {
                               description: "Purchase Neon Glow frame in the Store",
                               action: {
                                 label: "View Store",
                                 onClick: () => {
                                   window.dispatchEvent(new Event('navigate-to-store'));
                                 }
                               }
                             });
                           }
                         }}
                         className={cn(
                           "h-16 rounded-lg border border-white/10 cursor-pointer flex items-center justify-center text-xs relative",
                           (isPremium || purchasedFrames.includes('avatar-frame-neon'))
                             ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:border-blue-500 text-white"
                             : "bg-white/5 opacity-50 cursor-not-allowed"
                         )}
                       >
                         <span>Neon</span>
                         {!isPremium && !purchasedFrames.includes('avatar-frame-neon') && (
                           <Lock className="w-3 h-3 ml-1 text-gray-500" />
                         )}
                       </div>

                       {/* Cosmic Star Frame */}
                       <div 
                         onClick={() => {
                           if (!isPremium && !purchasedFrames.includes('avatar-frame-cosmic')) {
                             toast.info("Premium frame", {
                               description: "Purchase Cosmic Star frame in the Store",
                               action: {
                                 label: "View Store",
                                 onClick: () => {
                                   window.dispatchEvent(new Event('navigate-to-store'));
                                 }
                               }
                             });
                           }
                         }}
                         className={cn(
                           "h-16 rounded-lg border border-white/10 cursor-pointer flex items-center justify-center text-xs relative",
                           (isPremium || purchasedFrames.includes('avatar-frame-cosmic'))
                             ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:border-purple-500 text-white"
                             : "bg-white/5 opacity-50 cursor-not-allowed"
                         )}
                       >
                         <span>Cosmic</span>
                         {!isPremium && !purchasedFrames.includes('avatar-frame-cosmic') && (
                           <Lock className="w-3 h-3 ml-1 text-gray-500" />
                         )}
                       </div>
                    </div>
                 </div>
              </div>
           </GlassCard>

           {/* Premium Upsell Card */}
           {!isPremium && (
             <GlassCard className="p-6 border-yellow-500/30 bg-yellow-500/5 mt-6">
               <div className="flex items-start gap-4">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                   <Crown className="w-6 h-6 text-white" />
                 </div>
                 <div className="flex-1">
                   <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                     Unlock More with Connecta Premium
                   </h4>
                   <p className="text-gray-400 text-sm mb-4">
                     Get access to more accent colors, premium themes, animated avatars, exclusive frames, and 12+ premium features starting at $4.99/month.
                   </p>
                   <div className="flex gap-3">
                     <Button
                       variant="secondary"
                       size="sm"
                       onClick={() => {
                         window.dispatchEvent(new Event('navigate-to-store'));
                       }}
                       className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
                     >
                       <Crown className="w-4 h-4 mr-2" />
                       View Premium
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         window.location.hash = '#subscriptions';
                       }}
                     >
                       Learn More
                     </Button>
                   </div>
                 </div>
               </div>
             </GlassCard>
           )}
        </div>
      )}

      {/* Content Tabs */}
      <div className="flex items-center gap-8 px-8 border-b border-white/5 mb-8 flex-shrink-0">
         <button 
           onClick={() => setActiveTab("overview")}
           className={cn(
             "pb-4 text-sm transition-colors",
             activeTab === "overview" 
               ? "text-white border-b-2 border-blue-500 font-medium" 
               : "text-gray-500 hover:text-white"
           )}
         >
           Overview
         </button>
         <button 
           onClick={() => setActiveTab("badges")}
           className={cn(
             "pb-4 text-sm transition-colors",
             activeTab === "badges" 
               ? "text-white border-b-2 border-blue-500 font-medium" 
               : "text-gray-500 hover:text-white"
           )}
         >
           Badges
         </button>
         <button 
           onClick={() => setActiveTab("servers")}
           className={cn(
             "pb-4 text-sm transition-colors",
             activeTab === "servers" 
               ? "text-white border-b-2 border-blue-500 font-medium" 
               : "text-gray-500 hover:text-white"
           )}
         >
           Mutual Servers
         </button>
      </div>

      {/* Body Content */}
      <div className="px-8 pb-12 flex-1 min-h-0">
         {activeTab === "overview" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left Col */}
             <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6 space-y-4">
               <h3 className="text-white font-medium">About Me</h3>
               {isEditing ? (
                 <textarea
                   value={bio}
                   onChange={(e) => setBio(e.target.value)}
                   placeholder="Tell us about yourself..."
                   className="w-full bg-white/5 rounded-xl p-4 min-h-[100px] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                   maxLength={500}
                 />
               ) : (
                 <div className="bg-white/5 rounded-xl p-4 min-h-[100px] border border-white/5">
                   {bio ? (
                     <p className="text-white text-sm">{bio}</p>
                   ) : (
                     <p className="text-gray-500 text-sm italic">This user hasn't written a bio yet.</p>
                   )}
                 </div>
               )}
            </GlassCard>

            <GlassCard className="p-6">
               <h3 className="text-white font-medium mb-4">Activity</h3>
               <div className="text-center py-8 text-gray-500 text-sm">
                 No recent activity to show.
               </div>
            </GlassCard>
         </div>

         {/* Right Col */}
         <div className="space-y-6">
            <GlassCard className="p-6 space-y-4">
               <h3 className="text-white font-medium">Connecta Member</h3>
               <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Joined Feb 08, 2026</span>
               </div>
               <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Verification pending</span>
               </div>
            </GlassCard>

            <GlassCard className="p-6">
               <h3 className="text-white font-medium mb-4">Badges</h3>
               <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-square rounded-xl bg-white/5 border border-white/5 border-dashed flex items-center justify-center hover:border-white/20 transition-colors cursor-pointer group" title="Empty Slot">
                       <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-white/30" />
                    </div>
                  ))}
               </div>
            </GlassCard>
           </div>
         </div>
       )}

       {activeTab === "badges" && (
         <div className="max-w-4xl">
           <GlassCard className="p-6">
             <h3 className="text-white font-medium mb-4">Badges</h3>
             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
               {[1,2,3,4,5,6,7,8].map(i => (
                 <div key={i} className="aspect-square rounded-xl bg-white/5 border border-white/5 border-dashed flex items-center justify-center hover:border-white/20 transition-colors cursor-pointer group" title="Empty Slot">
                   <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-white/30" />
                 </div>
               ))}
             </div>
           </GlassCard>
         </div>
       )}

       {activeTab === "servers" && (
         <div className="max-w-4xl">
           <GlassCard className="p-6">
             <h3 className="text-white font-medium mb-4">Mutual Servers</h3>
             {serversLoading ? (
               <div className="flex flex-col items-center justify-center py-12">
                 <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                 <p className="text-gray-400 text-sm">Loading mutual servers...</p>
               </div>
             ) : mutualServers.length === 0 ? (
               <div className="text-center py-12 text-gray-500 text-sm">
                 No mutual servers.
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {mutualServers.map((server) => (
                   <div
                     key={server.id}
                     onClick={() => handleServerClick(server)}
                     className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                   >
                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl flex-shrink-0">
                       {server.icon || "🌐"}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="text-white font-medium text-sm truncate group-hover:text-blue-400 transition-colors">
                         {server.name}
                       </h4>
                       <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
                         <Users className="w-3 h-3" />
                         <span>{server.memberCount.toLocaleString()} members</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </GlassCard>
         </div>
       )}
      </div>
    </div>
  );
}
