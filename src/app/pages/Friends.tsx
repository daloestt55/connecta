import React, { useState, useEffect } from "react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Avatar } from "@/app/components/design-system/Avatar";
import { Button } from "@/app/components/design-system/Button";
import { Users, Search, UserPlus, Mail, MessageSquare, MoreVertical, UserMinus, CheckCircle2, UserX, Copy, Hash, X, Calendar, Shield, Clock, Phone, PhoneIncoming, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { playIncomingCall, playOutgoingCall, playCallConnected, playCallDisconnected } from "@/app/utils/sounds";
import { getFriends, addFriendRequest, acceptFriendRequest, removeFriend, blockUser } from "@/app/utils/friends";

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  status: "online" | "idle" | "dnd" | "offline";
  statusText?: string;
  isVerified?: boolean;
  relationship?: "friend" | "pending_incoming" | "pending_outgoing" | "blocked";
}

interface FriendsProps {
  onOpenChat?: (friendId: string) => void;
  shouldOpenAddFriend?: boolean;
  onAddFriendFormChange?: (isOpen: boolean) => void;
  onStartCall?: (friend: { id: string; username: string; avatar?: string; isVerified?: boolean }) => void;
}

export function Friends({ onOpenChat, shouldOpenAddFriend, onAddFriendFormChange, onStartCall }: FriendsProps = {}) {
  const [activeTab, setActiveTab] = useState("online");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Friend | null>(null);
  const [incomingCall, setIncomingCall] = useState<Friend | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<Friend | null>(null);
  
  // Call state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callTimer, setCallTimer] = useState("00:00");

  // Load friends from Supabase
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setIsLoadingFriends(true);
    const friendsData = await getFriends();
    setFriends(friendsData);
    setIsLoadingFriends(false);
  };

  // Generate avatar color based on username
  const getAvatarColor = (username: string) => {
    const colors = [
      'from-blue-600 to-blue-700',
      'from-purple-600 to-purple-700',
      'from-green-600 to-green-700',
      'from-red-600 to-red-700',
      'from-orange-600 to-orange-700',
      'from-pink-600 to-pink-700',
      'from-teal-600 to-teal-700',
      'from-indigo-600 to-indigo-700',
      'from-yellow-600 to-yellow-700',
      'from-cyan-600 to-cyan-700',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Handle shouldOpenAddFriend prop
  useEffect(() => {
    if (shouldOpenAddFriend) {
      setShowAddFriend(true);
    }
  }, [shouldOpenAddFriend]);

  // Notify parent when add friend form opens/closes
  useEffect(() => {
    onAddFriendFormChange?.(showAddFriend);
  }, [showAddFriend, onAddFriendFormChange]);

  // Call timer
  useEffect(() => {
    if (callStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setCallTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStartTime]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredFriends = friends.filter(friend => {
    // Filter by search query
    const matchesSearch = friend.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by tab
    if (activeTab === 'online') {
      return matchesSearch && friend.status === 'online';
    } else if (activeTab === 'all') {
      return matchesSearch && friend.relationship === 'friend';
    } else if (activeTab === 'pending') {
      return matchesSearch && (friend.relationship === 'pending_incoming' || friend.relationship === 'pending_outgoing');
    } else if (activeTab === 'blocked') {
      return matchesSearch && friend.relationship === 'blocked';
    }
    
    return matchesSearch;
  }); 

  const handleMessageFriend = (friend: Friend) => {
    if (onOpenChat) {
      onOpenChat(friend.id);
    } else {
      toast.info(`Message ${friend.username}`, {
        description: 'Chat functionality coming soon!'
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (confirm(`Are you sure you want to remove ${friend?.username} from your friends?`)) {
      const result = await removeFriend(friendId);
      if (result.success) {
        await loadFriends();
        toast.success(`${friend?.username} removed from friends`, {
          description: 'You can add them back anytime'
        });
      } else {
        toast.error('Failed to remove friend', {
          description: result.error
        });
      }
    }
  };

  const handleBlockUser = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (confirm(`Block ${friend?.username}? They won't be able to message you or see your online status.`)) {
      const result = await blockUser(friendId);
      if (result.success) {
        await loadFriends();
        toast.success(`${friend?.username} has been blocked`, {
          description: 'You can unblock them from the Blocked tab'
        });
      } else {
        toast.error('Failed to block user', {
          description: result.error
        });
      }
    }
  };

  const handleUnblockUser = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    const result = await removeFriend(friendId);
    if (result.success) {
      await loadFriends();
      toast.success(`${friend?.username} has been unblocked`, {
        description: 'They can now message you again'
      });
    } else {
      toast.error('Failed to unblock user', {
        description: result.error
      });
    }
  };

  const handleAcceptFriendRequest = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    const result = await acceptFriendRequest(friendId);
    if (result.success) {
      await loadFriends();
      toast.success(`You are now friends with ${friend?.username}!`);
    } else {
      toast.error('Failed to accept friend request', {
        description: result.error
      });
    }
  };

  const handleDeclineFriendRequest = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    const result = await removeFriend(friendId);
    if (result.success) {
      await loadFriends();
      toast.info(`Declined friend request from ${friend?.username}`);
    } else {
      toast.error('Failed to decline friend request', {
        description: result.error
      });
    }
  };

  const handleCancelFriendRequest = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    const result = await removeFriend(friendId);
    if (result.success) {
      await loadFriends();
      toast.info(`Cancelled friend request to ${friend?.username}`);
    } else {
      toast.error('Failed to cancel friend request', {
        description: result.error
      });
    }
  };

  const handleCopyId = (friend: Friend) => {
    navigator.clipboard.writeText(friend.id);
    toast.success('User ID copied!', {
      description: `ID: ${friend.id}`
    });
  };

  const handleSendFriendRequest = async () => {
    if (!friendUsername.trim()) {
      toast.error('Please enter a username', {
        description: 'Username cannot be empty'
      });
      return;
    }

    const result = await addFriendRequest(friendUsername);
    if (result.success) {
      await loadFriends();
      toast.success('Friend request sent!', {
        description: `Sent to ${friendUsername}`
      });
      setFriendUsername('');
      setShowAddFriend(false);
    } else {
      toast.error('Failed to send friend request', {
        description: result.error
      });
    }
  };

  const tabs = [
    { id: "online", label: "Online" },
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "blocked", label: "Blocked" },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0A0A0C] animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 px-8 flex items-center justify-between flex-shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
               <Users className="w-5 h-5 text-gray-400" />
               <span className="font-medium text-white">Friends</span>
            </div>

            <div className="flex items-center gap-2">
               {tabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={cn(
                     "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                     activeTab === tab.id 
                       ? "bg-white/10 text-white" 
                       : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                   )}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>
         </div>

         <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#050507] border border-black rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 w-48"
              />
            </div>
            <Button 
              size="sm" 
              variant={showAddFriend ? "transparent" : "primary"}
              className={cn(showAddFriend && "text-green-400")}
              onClick={() => setShowAddFriend(!showAddFriend)}
            >
              Add Friend
            </Button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
         {showAddFriend ? (
           <div className="p-8 border-b border-white/5">
              <h2 className="text-white font-bold mb-2 uppercase text-xs tracking-wide opacity-80">Add Friend</h2>
              <p className="text-gray-400 text-sm mb-4">You can add friends with their Connecta username.</p>
              
              <div className="relative max-w-2xl">
                 <input 
                   type="text" 
                   placeholder="Enter a username#0000"
                   value={friendUsername}
                   onChange={(e) => setFriendUsername(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendFriendRequest()}
                   className="w-full bg-[#050507] border border-black rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                   autoFocus
                 />
                 <div className="absolute right-2 top-1.5">
                    <Button 
                      size="sm"
                      onClick={handleSendFriendRequest}
                    >
                      Send Request
                    </Button>
                 </div>
              </div>
           </div>
         ) : null}

         {/* List Area */}
         <div className="flex-1 p-4 overflow-y-auto min-h-0">
            {filteredFriends.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <div className="w-48 h-48 mb-6 relative">
                     {/* Abstract Empty State Art */}
                     <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl" />
                     <div className="relative z-10 w-full h-full border border-white/5 rounded-full flex items-center justify-center">
                        <Users className="w-16 h-16 text-gray-600" />
                     </div>
                  </div>
                  <h3 className="text-gray-300 font-medium mb-1">No one's around to play with.</h3>
                  <p className="text-gray-500 text-sm">When you add friends, they'll show up here.</p>
               </div>
            ) : (
               <div className="space-y-2 max-w-5xl mx-auto pb-4">
                  {filteredFriends.map((friend) => (
                    <GlassCard 
                      key={friend.id}
                      onClick={() => setSelectedProfile(friend)}
                      className="p-4 hover:bg-white/10 transition-all border border-white/5 group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar with Status */}
                        <div className="relative flex-shrink-0">
                          <Avatar
                            src={friend.avatar}
                            alt={friend.username}
                            name={friend.username}
                            className="w-12 h-12"
                          />
                          <div className={cn(
                            "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0A0A0C]",
                            getStatusColor(friend.status)
                          )} />
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium truncate">{friend.username}</span>
                            {friend.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          {friend.statusText && (
                            <p className="text-sm text-gray-400 truncate">{friend.statusText}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {/* For pending incoming requests - show Accept/Decline */}
                          {friend.relationship === 'pending_incoming' ? (
                            <>
                              <button
                                onClick={() => handleAcceptFriendRequest(friend.id)}
                                className="px-4 h-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleDeclineFriendRequest(friend.id)}
                                className="w-9 h-9 rounded-full bg-[#111114] hover:bg-[#1a1a1f] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                                title="Decline"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          ) : friend.relationship === 'pending_outgoing' ? (
                            /* For pending outgoing requests - show Cancel */
                            <button
                              onClick={() => handleCancelFriendRequest(friend.id)}
                              className="px-4 h-9 rounded-md bg-[#111114] hover:bg-[#1a1a1f] border border-white/10 text-gray-300 hover:text-white font-medium transition-all"
                            >
                              Cancel Request
                            </button>
                          ) : (
                            /* For friends and blocked - show Message + More menu */
                            <>
                              <button
                                onClick={() => handleMessageFriend(friend)}
                                disabled={friend.relationship === 'blocked'}
                                className={cn(
                                  "w-9 h-9 rounded-full bg-[#111114] hover:bg-[#1a1a1f] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all",
                                  friend.relationship === 'blocked' && "opacity-50 cursor-not-allowed hover:bg-[#111114] hover:text-gray-400"
                                )}
                                title={friend.relationship === 'blocked' ? 'Unblock to message' : 'Message'}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                          
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="w-9 h-9 rounded-full bg-[#111114] hover:bg-[#1a1a1f] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                                    title="More"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#18181b] border-white/10">
                                  <DropdownMenuItem 
                                    onClick={() => handleCopyId(friend)}
                                    className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy User ID
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  
                                  {friend.relationship !== 'blocked' ? (
                                    <>
                                      <DropdownMenuItem 
                                        onClick={() => handleRemoveFriend(friend.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                      >
                                        <UserMinus className="w-4 h-4 mr-2" />
                                        Remove Friend
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleBlockUser(friend.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                      >
                                        <UserX className="w-4 h-4 mr-2" />
                                        Block User
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleUnblockUser(friend.id)}
                                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Unblock User
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* User Profile Modal */}
      {selectedProfile && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProfile(null)}
        >
          <div 
            className="bg-[#0A0A0C] rounded-xl border border-white/10 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner */}
            <div className="h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative flex-shrink-0">
              <button
                onClick={() => setSelectedProfile(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-8 -mt-16 min-h-0">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-28 h-28 rounded-full border-4 border-[#0A0A0C] overflow-hidden bg-[#111114]">
                  <Avatar
                    src={selectedProfile.avatar}
                    alt={selectedProfile.username}
                    name={selectedProfile.username}
                    className="w-full h-full"
                  />
                </div>
                <div className={cn(
                  "absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-[#0A0A0C]",
                  selectedProfile.status === 'online' && "bg-green-500",
                  selectedProfile.status === 'idle' && "bg-yellow-500",
                  selectedProfile.status === 'dnd' && "bg-red-500",
                  selectedProfile.status === 'offline' && "bg-gray-500"
                )}></div>
              </div>

              {/* Username and Status */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">{selectedProfile.username}</h2>
                  {selectedProfile.isVerified && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                {selectedProfile.statusText && (
                  <p className="text-gray-400 text-sm">{selectedProfile.statusText}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {selectedProfile.status === 'online' ? '🟢 Online' : 
                   selectedProfile.status === 'idle' ? '🟡 Idle' :
                   selectedProfile.status === 'dnd' ? '🔴 Do Not Disturb' : '⚫ Offline'}
                </p>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Member Since</span>
                  </div>
                  <p className="text-white font-medium">January 2024</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Hash className="w-3.5 h-3.5" />
                    <span>User ID</span>
                  </div>
                  <p className="text-white font-medium text-sm truncate">{selectedProfile.id}</p>
                </div>
              </div>

              {/* About */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide opacity-70">About Me</h3>
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <p className="text-gray-400 text-sm">
                    Hey! I'm {selectedProfile.username}. I love gaming and chatting with friends. Feel free to message me anytime! 🎮
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {/* Primary Actions */}
                <div className="flex gap-3">
                  {selectedProfile.relationship !== 'blocked' && (
                    <Button
                      onClick={() => {
                        handleMessageFriend(selectedProfile);
                        setSelectedProfile(null);
                      }}
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleCopyId(selectedProfile);
                    }}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy ID
                  </Button>
                </div>

                {/* Call Actions */}
                {selectedProfile.relationship !== 'blocked' && (
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        playOutgoingCall();
                        setOutgoingCall(selectedProfile);
                        setCallStartTime(Date.now());
                        setSelectedProfile(null);
                      }}
                      className="flex-1"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Voice Call
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        playOutgoingCall();
                        setIsVideoOn(true);
                        setOutgoingCall(selectedProfile);
                        setCallStartTime(Date.now());
                        setSelectedProfile(null);
                      }}
                      className="flex-1"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Video Call
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 max-w-md w-full shadow-2xl overflow-hidden">
            {/* Animated Background */}
            <div className="h-48 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping">
                    <div className="w-32 h-32 rounded-full bg-white/20"></div>
                  </div>
                  <div className="relative w-32 h-32 rounded-full border-4 border-white/30 overflow-hidden bg-[#111114]">
                    <Avatar
                      src={incomingCall.avatar}
                      alt={incomingCall.username}
                      name={incomingCall.username}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Call Info */}
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{incomingCall.username}</h2>
                {incomingCall.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-gray-400 mb-1">Incoming Call</p>
              <div className="flex items-center justify-center gap-2 text-green-500 mb-6">
                <PhoneIncoming className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Ringing...</span>
              </div>

              {/* Call Actions */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    playCallDisconnected();
                    toast.info('Call declined');
                    setIncomingCall(null);
                  }}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-red-500/50"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    playCallConnected();
                    setCallStartTime(Date.now());
                    setIsVideoOn(false);
                    toast.success('Call accepted', {
                      description: `Connected with ${incomingCall.username}`
                    });
                    const callInfo = {
                      id: incomingCall.id,
                      username: incomingCall.username,
                      avatar: incomingCall.avatar,
                      isVerified: incomingCall.isVerified
                    };
                    setIncomingCall(null);
                    onStartCall?.(callInfo);
                  }}
                  className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-green-500/50 animate-pulse"
                >
                  <Phone className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    playCallConnected();
                    setCallStartTime(Date.now());
                    setIsVideoOn(true);
                    toast.success('Video call accepted', {
                      description: `Video call with ${incomingCall.username}`
                    });
                    const callInfo = {
                      id: incomingCall.id,
                      username: incomingCall.username,
                      avatar: incomingCall.avatar,
                      isVerified: incomingCall.isVerified
                    };
                    setIncomingCall(null);
                    onStartCall?.(callInfo);
                  }}
                  className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-blue-500/50"
                >
                  <Video className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                <p>Decline • Voice • Video</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing Call Modal */}
      {outgoingCall && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 max-w-md w-full shadow-2xl overflow-hidden">
            {/* Animated Background */}
            <div className="h-48 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse">
                    <div className="w-32 h-32 rounded-full bg-white/10"></div>
                  </div>
                  <div className="relative w-32 h-32 rounded-full border-4 border-white/30 overflow-hidden bg-[#111114]">
                    <Avatar
                      src={outgoingCall.avatar}
                      alt={outgoingCall.username}
                      name={outgoingCall.username}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Call Info */}
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{outgoingCall.username}</h2>
                {outgoingCall.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
              </div>
              {callStartTime ? (
                <div className="mb-6">
                  <p className="text-green-500 font-semibold text-lg">{callTimer}</p>
                  <p className="text-gray-400 text-sm">Connected</p>
                </div>
              ) : (
                <p className="text-gray-400 mb-6">Calling...</p>
              )}

              {/* Quick Actions */}
              <div className="flex gap-3 justify-center mb-6">
                <button 
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={cn(
                    "w-12 h-12 rounded-full border flex items-center justify-center transition-all",
                    isMicOn 
                      ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" 
                      : "bg-red-600 border-red-500 text-white hover:bg-red-500"
                  )}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={cn(
                    "w-12 h-12 rounded-full border flex items-center justify-center transition-all",
                    isVideoOn 
                      ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-500" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  )}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>

              {/* End Call / Start Call */}
              {!callStartTime ? (
                <button
                  onClick={() => {
                    playCallConnected();
                    setCallStartTime(Date.now());
                    toast.success('Call connected', {
                      description: `Connected with ${outgoingCall.username}`
                    });
                    const callInfo = {
                      id: outgoingCall.id,
                      username: outgoingCall.username,
                      avatar: outgoingCall.avatar,
                      isVerified: outgoingCall.isVerified
                    };
                    setTimeout(() => {
                      setOutgoingCall(null);
                      onStartCall?.(callInfo);
                    }, 500);
                  }}
                  className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-green-500/50 mx-auto animate-pulse"
                >
                  <Phone className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    toast.info('Call ended');
                    setOutgoingCall(null);
                    setCallStartTime(null);
                    setCallTimer("00:00");
                  }}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-red-500/50 mx-auto"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              )}

              <div className="mt-4 text-xs text-gray-500">
                {!callStartTime ? (
                  <p>Tap green button to simulate connection</p>
                ) : (
                  <p>Tap red button to end call</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
