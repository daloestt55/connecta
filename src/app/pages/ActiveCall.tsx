import React, { useState, useEffect, useRef } from "react";
import { Waveform } from "@/app/components/design-system/Waveform";
import { Button } from "@/app/components/design-system/Button";
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Settings, Copy, UserPlus, Headphones, Wifi, Volume2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Switch } from "@/app/components/ui/switch";
import { generateCallInviteLink, copyToClipboard } from "@/app/utils/linkGenerator";

interface AudioDevice {
  id: string;
  name: string;
}

interface ActiveCallProps {
  isMuted?: boolean;
  isDeafened?: boolean;
  isVideoEnabled?: boolean;
  onToggleMute?: () => void;
  onToggleDeafen?: () => void;
  onToggleVideo?: () => void;
  caller?: {
    id: string;
    username: string;
    avatar?: string;
    isVerified?: boolean;
  };
}

export function ActiveCall({
  isMuted: globalIsMuted,
  isDeafened: globalIsDeafened,
  isVideoEnabled: globalIsVideoEnabled,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  caller
}: ActiveCallProps = {}) {
  const [isMuted, setIsMuted] = useState(globalIsMuted ?? false);
  const [isVideoOn, setIsVideoOn] = useState(globalIsVideoEnabled ?? false);
  const [isDeafened, setIsDeafened] = useState(globalIsDeafened ?? false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [showCallSettings, setShowCallSettings] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteFriends, setInviteFriends] = useState<Array<{id: string; username: string; avatar?: string; status: string}>>([]);
  
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  
  // Audio/Video devices - загружаем из localStorage
  const [selectedMicrophone, setSelectedMicrophone] = useState(() => {
    return localStorage.getItem('connecta_call_microphone') || 'default';
  });
  const [selectedCamera, setSelectedCamera] = useState(() => {
    return localStorage.getItem('connecta_call_camera') || 'default';
  });
  const [selectedSpeaker, setSelectedSpeaker] = useState(() => {
    return localStorage.getItem('connecta_call_speaker') || 'default';
  });
  const [devices, setDevices] = useState<{ microphones: AudioDevice[]; cameras: AudioDevice[]; speakers: AudioDevice[] }>({
    microphones: [],
    cameras: [],
    speakers: []
  });
  
  // Settings - загружаем из localStorage
  const [videoQuality, setVideoQuality] = useState<'auto' | 'high' | 'medium' | 'low'>(() => {
    const saved = localStorage.getItem('connecta_call_video_quality');
    return (saved as 'auto' | 'high' | 'medium' | 'low') || 'auto';
  });
  const [echoCancellation, setEchoCancellation] = useState(() => {
    const saved = localStorage.getItem('connecta_call_echo_cancellation');
    return saved !== null ? saved === 'true' : true;
  });
  const [noiseSuppression, setNoiseSuppression] = useState(() => {
    const saved = localStorage.getItem('connecta_call_noise_suppression');
    return saved !== null ? saved === 'true' : true;
  });
  const [autoGainControl, setAutoGainControl] = useState(() => {
    const saved = localStorage.getItem('connecta_call_auto_gain');
    return saved !== null ? saved === 'true' : true;
  });
  
  // Load real devices
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(deviceList => {
        const mics = deviceList.filter(d => d.kind === 'audioinput').map(d => ({ id: d.deviceId, name: d.label || 'Microphone' }));
        const cams = deviceList.filter(d => d.kind === 'videoinput').map(d => ({ id: d.deviceId, name: d.label || 'Camera' }));
        const spks = deviceList.filter(d => d.kind === 'audiooutput').map(d => ({ id: d.deviceId, name: d.label || 'Speaker' }));
        
        setDevices({
          microphones: mics.length > 0 ? mics : [{ id: 'default', name: 'Default Microphone' }],
          cameras: cams.length > 0 ? cams : [{ id: 'default', name: 'Default Camera' }],
          speakers: spks.length > 0 ? spks : [{ id: 'default', name: 'Default Speaker' }]
        });
      }).catch(() => {
        // Fallback to default devices
        setDevices({
          microphones: [{ id: 'default', name: 'Default Microphone' }],
          cameras: [{ id: 'default', name: 'Default Camera' }],
          speakers: [{ id: 'default', name: 'Default Speaker' }]
        });
      });
    } else {
      setDevices({
        microphones: [{ id: 'default', name: 'Default Microphone' }],
        cameras: [{ id: 'default', name: 'Default Camera' }],
        speakers: [{ id: 'default', name: 'Default Speaker' }]
      });
    }
  }, []);

  // Sync with global state from props
  useEffect(() => {
    if (globalIsMuted !== undefined) setIsMuted(globalIsMuted);
  }, [globalIsMuted]);

  useEffect(() => {
    if (globalIsDeafened !== undefined) setIsDeafened(globalIsDeafened);
  }, [globalIsDeafened]);

  useEffect(() => {
    if (globalIsVideoEnabled !== undefined) setIsVideoOn(globalIsVideoEnabled);
  }, [globalIsVideoEnabled]);

  // Connect screen stream to video element
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play().catch(err => {
        console.error("Error playing screen share video:", err);
      });
    } else if (screenVideoRef.current && !screenStream) {
      screenVideoRef.current.srcObject = null;
    }
  }, [screenStream]);

  const toggleDeafen = () => {
    if (onToggleDeafen) {
      onToggleDeafen();
    } else {
      const newDeafened = !isDeafened;
      setIsDeafened(newDeafened);
      if (newDeafened) {
        setIsMuted(true);
      }
    }
  };

  const toggleMute = () => {
    if (onToggleMute) {
      onToggleMute();
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (onToggleVideo) {
      onToggleVideo();
    } else {
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing && screenStream) {
      // Stop screen sharing
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      toast.success("Screen sharing stopped");
    } else {
      // Start screen sharing
      try {
        // Check if running in secure context
        if (!window.isSecureContext) {
          toast.error("Screen sharing requires HTTPS or localhost");
          return;
        }
        
        if (!navigator.mediaDevices) {
          toast.error("MediaDevices API not available");
          return;
        }
        
        if (!navigator.mediaDevices.getDisplayMedia) {
          toast.error("getDisplayMedia not supported in this browser");
          return;
        }
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          toast.info("Screen sharing stopped");
        };
        
        setScreenStream(stream);
        setIsScreenSharing(true);
        toast.success("Screen sharing started");
      } catch (error: any) {
        console.error("Error starting screen share:", error);
        if (error.name === "NotAllowedError") {
          toast.info("Screen sharing permission denied");
        } else if (error.name === "NotFoundError") {
          toast.error("No screen available to share");
        } else {
          toast.error("Failed to start screen sharing");
        }
        setIsScreenSharing(false);
      }
    }
  };

  const toggleSettings = () => {
    setShowCallSettings(!showCallSettings);
  };
  
  const handleMicrophoneChange = (deviceId: string) => {
    setSelectedMicrophone(deviceId);
    localStorage.setItem('connecta_call_microphone', deviceId);
    toast.success(`Microphone changed to ${devices.microphones.find(m => m.id === deviceId)?.name}`);
  };
  
  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    localStorage.setItem('connecta_call_camera', deviceId);
    toast.success(`Camera changed to ${devices.cameras.find(c => c.id === deviceId)?.name}`);
  };
  
  const handleSpeakerChange = (deviceId: string) => {
    setSelectedSpeaker(deviceId);
    localStorage.setItem('connecta_call_speaker', deviceId);
    toast.success(`Speaker changed to ${devices.speakers.find(s => s.id === deviceId)?.name}`);
  };
  
  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
    setShowCallSettings(false);
  };
  
  const handleVideoQualityChange = (quality: 'auto' | 'high' | 'medium' | 'low') => {
    setVideoQuality(quality);
    localStorage.setItem('connecta_call_video_quality', quality);
    const qualityLabels = {
      auto: 'Auto (Adaptive)',
      high: 'High (1080p)',
      medium: 'Medium (720p)',
      low: 'Low (480p)'
    };
    toast.success(`Video quality set to ${qualityLabels[quality]}`);
  };

  const handleLeaveCall = () => {
    toast.success("You left the call");
    // In real app, this would navigate away or close the call
    setTimeout(() => {
      window.history.back();
    }, 1000);
  };

  const handleCopyInviteLink = async () => {
    // Generate unique call invite link based on call ID and type
    const callId = `call-${Date.now()}`;
    const link = generateCallInviteLink(callId, isVideo);
    const success = await copyToClipboard(link);
    
    if (success) {
      toast.success("Invite link copied!", {
        description: link
      });
    } else {
      toast.error("Failed to copy link");
    }
  };

  const handleInviteParticipants = () => {
    // Load friends from localStorage
    const saved = localStorage.getItem('connecta_friends_v2');
    if (saved) {
      const friends = JSON.parse(saved);
      setInviteFriends(friends.filter((f: any) => f.relationship === 'friend'));
    }
    setShowInviteDialog(true);
  };

  const handleSendInvite = (friendId: string) => {
    const friend = inviteFriends.find(f => f.id === friendId);
    if (friend) {
      toast.success(`Invite sent to ${friend.username}!`);
      // In real app, would send call invite
    }
  };

  // Generate color from name (consistent with Avatar component)
  const getAvatarColor = (name: string) => {
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
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get initials from name
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  // Default: Empty state (Just me, or waiting)
  // Если есть собеседник, добавляем его в participants
  const participants: any[] = caller ? [{
    id: caller.id,
    name: caller.username,
    avatar: caller.avatar,
    isVerified: caller.isVerified,
    isMuted: false,
    isVideoOn: true
  }] : []; 

  return (
    <div className="relative h-full flex flex-col items-center justify-center p-6 overflow-hidden bg-[#0A0A0C]">
      
      {/* Central Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10">
        
        {/* Screen Share Display */}
        {isScreenSharing && screenStream ? (
          <div className="absolute inset-0 flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative w-full h-full max-w-7xl max-h-[85vh] rounded-3xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.6)] group">
              {/* Gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl p-[2px]">
                <div className="w-full h-full bg-[#0A0A0C] rounded-3xl overflow-hidden">
                  <video 
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              {/* Top indicator with animation */}
              <div className="absolute top-6 left-6 flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md border border-white/20 animate-pulse-slow">
                <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-semibold">Screen Sharing</span>
              </div>
              
              {/* Bottom gradient overlay for better contrast */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            </div>
          </div>
        ) : participants.length === 0 ? (
          <div className="flex flex-col items-center animate-in fade-in duration-700">
             {/* Main User Waveform (Self) */}
             <div className="h-32 w-full max-w-xl mb-8 flex items-center justify-center">
                 <Waveform 
                   barCount={30} 
                   height={60} 
                   isActive={!isMuted} 
                   intensity={0.3} 
                   color="bg-white"
                   className="opacity-50"
                 />
             </div>

             <div className="text-center space-y-4">
               <h2 className="text-2xl font-light text-white tracking-wide">Waiting for others...</h2>
               
               <div className="flex items-center gap-2 justify-center mt-6">
                 <GlassCard className="flex items-center gap-3 px-4 py-2 pr-2">
                    <span className="text-xs text-gray-400 font-mono">connecta.link/v/8f92-ka29</span>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-7 px-2 bg-white/5 hover:bg-white/10 border-none"
                      onClick={handleCopyInviteLink}
                    >
                       <Copy className="w-3 h-3" />
                    </Button>
                 </GlassCard>
               </div>
               
               <Button 
                 variant="ghost" 
                 className="text-blue-400 hover:text-blue-300 mt-2"
                 onClick={handleInviteParticipants}
               >
                 <UserPlus className="w-4 h-4 mr-2" /> Invite Participants
               </Button>
             </div>
          </div>
        ) : (
           <div className="flex flex-col items-center gap-6">
              {participants.map((participant) => (
                <div key={participant.id} className="flex flex-col items-center animate-in fade-in duration-700">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden bg-[#111114]">
                      {participant.avatar ? (
                        <img 
                          src={participant.avatar} 
                          alt={participant.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getAvatarColor(participant.name)}`}>
                          <span className="text-white text-4xl font-bold">
                            {getInitials(participant.name)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white">{participant.name}</h3>
                    {participant.isVerified && (
                      <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    )}
                  </div>

                  {/* Waveform */}
                  <div className="h-16 w-full max-w-sm mb-4 flex items-center justify-center">
                    <Waveform 
                      barCount={24} 
                      height={40} 
                      isActive={!participant.isMuted} 
                      intensity={0.5} 
                      color="bg-blue-500"
                    />
                  </div>

                  {/* Status indicators */}
                  <div className="flex gap-3">
                    {participant.isMuted && (
                      <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-500 text-xs flex items-center gap-1">
                        <MicOff className="w-3 h-3" />
                        <span>Muted</span>
                      </div>
                    )}
                    {!participant.isVideoOn && (
                      <div className="px-3 py-1 rounded-full bg-gray-500/20 border border-gray-500/30 text-gray-400 text-xs flex items-center gap-1">
                        <VideoOff className="w-3 h-3" />
                        <span>Video Off</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
           </div>
        )}

      </div>

      {/* Control Dock - Fixed Bottom */}
      <div className="w-full max-w-2xl mx-auto mb-6">
        <div className="border transition-all duration-300 p-3 flex items-center justify-center gap-6 rounded-3xl bg-[#131316]/90 backdrop-blur-2xl border-white/10 shadow-2xl">
             {/* 1. Микрофон */}
             <button 
               className={cn(
                 "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-2xl w-14 h-14",
                 isMuted 
                   ? "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30" 
                   : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
               )}
               onClick={toggleMute}
               title={isMuted ? "Unmute" : "Mute"}
             >
               {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
             </button>
             
             {/* 2. Звук в наушниках */}
             <button 
               className={cn(
                 "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-2xl w-14 h-14",
                 isDeafened 
                   ? "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30" 
                   : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
               )}
               onClick={toggleDeafen}
               title={isDeafened ? "Undeafen" : "Deafen"}
             >
               <Headphones className="w-6 h-6" />
             </button>

             {/* 3. Демонстрация экрана */}
             <button 
               className={cn(
                 "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-2xl w-14 h-14",
                 isScreenSharing
                   ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                   : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
               )}
               onClick={toggleScreenShare}
               title={isScreenSharing ? "Stop sharing" : "Share screen"}
             >
               <Monitor className="w-6 h-6" />
             </button>

             {/* 4. Камера */}
             <button 
               className={cn(
                 "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-2xl w-14 h-14",
                 !isVideoOn 
                   ? "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30" 
                   : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
               )}
               onClick={toggleVideo}
               title={isVideoOn ? "Turn off camera" : "Turn on camera"}
             >
               {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
             </button>

             {/* 5. Настройки */}
             <button 
               className="relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden text-white border border-white/10 hover:border-white/20 backdrop-blur-md rounded-2xl w-14 h-14 bg-white/10 hover:bg-white/20"
               onClick={toggleSettings}
               title="Settings"
             >
               <Settings className="w-6 h-6" />
             </button>

             <div className="w-px h-8 bg-white/10 mx-2" />

             <button 
               className="relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-2xl w-20 h-14"
               onClick={handleLeaveCall}
               title="Leave call"
             >
               <PhoneOff className="w-6 h-6" />
             </button>
        </div>
      </div>
      
      {/* Settings Dialog */}
      <Dialog open={showCallSettings} onOpenChange={setShowCallSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#131316]/95 backdrop-blur-2xl border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Settings className="w-5 h-5" />
              Call Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Audio Devices */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white">
                <Mic className="w-4 h-4" />
                Audio Devices
              </h3>
              
              <div className="space-y-4">
                {/* Microphone */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Microphone</label>
                  <select 
                    value={selectedMicrophone}
                    onChange={(e) => handleMicrophoneChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1F] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/20 transition-colors"
                  >
                    {devices.microphones.map(mic => (
                      <option key={mic.id} value={mic.id} className="bg-[#1A1A1F] text-white">{mic.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Speaker */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Speaker</label>
                  <select 
                    value={selectedSpeaker}
                    onChange={(e) => handleSpeakerChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1F] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/20 transition-colors"
                  >
                    {devices.speakers.map(spk => (
                      <option key={spk.id} value={spk.id} className="bg-[#1A1A1F] text-white">{spk.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Video Devices */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white">
                <Video className="w-4 h-4" />
                Video Devices
              </h3>
              
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Camera</label>
                <select 
                  value={selectedCamera}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1F] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/20 transition-colors"
                >
                  {devices.cameras.map(cam => (
                    <option key={cam.id} value={cam.id} className="bg-[#1A1A1F] text-white">{cam.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Video Quality */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white">
                <Wifi className="w-4 h-4" />
                Video Quality
              </h3>
              
              <div className="grid grid-cols-4 gap-2">
                {['auto', 'high', 'medium', 'low'].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => handleVideoQualityChange(quality as any)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      videoQuality === quality
                        ? "bg-blue-500 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Audio Processing */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white">
                <Volume2 className="w-4 h-4" />
                Audio Processing
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                  <div>
                    <div className="text-sm font-medium text-white">Echo Cancellation</div>
                    <div className="text-xs text-gray-400">Reduce echo during calls</div>
                  </div>
                  <Switch 
                    checked={echoCancellation}
                    onCheckedChange={(checked) => {
                      setEchoCancellation(checked);
                      localStorage.setItem('connecta_call_echo_cancellation', String(checked));
                      toast.success(`Echo cancellation ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                  <div>
                    <div className="text-sm font-medium text-white">Noise Suppression</div>
                    <div className="text-xs text-gray-400">Filter out background noise</div>
                  </div>
                  <Switch 
                    checked={noiseSuppression}
                    onCheckedChange={(checked) => {
                      setNoiseSuppression(checked);
                      localStorage.setItem('connecta_call_noise_suppression', String(checked));
                      toast.success(`Noise suppression ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                  <div>
                    <div className="text-sm font-medium text-white">Auto Gain Control</div>
                    <div className="text-xs text-gray-400">Automatically adjust volume</div>
                  </div>
                  <Switch 
                    checked={autoGainControl}
                    onCheckedChange={(checked) => {
                      setAutoGainControl(checked);
                      localStorage.setItem('connecta_call_auto_gain', String(checked));
                      toast.success(`Auto gain control ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer with Save/Cancel buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => setShowCallSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="bg-blue-500 hover:bg-blue-600 text-white border-none"
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Participants Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-[#1a1a1f] border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Invite to Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {inviteFriends.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No friends available to invite</p>
              </div>
            ) : (
              inviteFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      friend.username[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{friend.username}</div>
                    <div className="text-xs text-gray-400 capitalize">{friend.status}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSendInvite(friend.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white border-none"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Invite
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
