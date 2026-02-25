import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Hash, Volume2, Plus, ChevronDown, Settings, Send, Trash2, Mic, MicOff, PhoneOff, User, Search, Upload, Edit2, Video, VideoOff, Monitor, Headphones, Wifi, Paperclip, Square, Play, Pause, X, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/design-system/Input";
import { Button } from "@/app/components/design-system/Button";
import { Switch } from "@/app/components/ui/switch";
import { toast } from "sonner";
import { ServerSettings } from "@/app/pages/ServerSettings";
import { generateServerInviteLink, copyToClipboard } from "@/app/utils/linkGenerator";

interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  serverId: string;
  unread?: number;
}

interface Message {
  id: string;
  channelId: string;
  text: string;
  timestamp: Date;
  author: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  audioUrl?: string;
  audioDuration?: number;
}

interface Server {
  id: string;
  name: string;
  icon?: string;
  color: string;
  inviteCode: string;
}

interface AudioDevice {
  id: string;
  name: string;
}

// AudioPlayer component for voice messages
interface AudioPlayerProps {
  audioUrl: string;
  duration: number;
  isMe: boolean;
}

function AudioPlayer({ audioUrl, duration, isMe }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg min-w-[250px]",
      isMe ? "bg-blue-500/20" : "bg-white/10"
    )}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      <button
        onClick={togglePlay}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
          isMe 
            ? "bg-blue-500 hover:bg-blue-600 text-white" 
            : "bg-white/20 hover:bg-white/30 text-white"
        )}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        <div className="flex justify-between text-xs text-white/60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

interface ChannelsProps {
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  servers: Server[];
  channels: Channel[];
  selectedServer: string | null;
  onServerSelect: (serverId: string | null) => void;
  onBack: () => void;
  onCreateServer: (data: { name: string; icon?: string; description?: string }) => string | null;
  onCreateChannel: (name: string, type: "text" | "voice", serverId?: string) => void;
  onUpdateServer: (serverId: string, updates: { name?: string; icon?: string; description?: string }) => void;
  onDeleteServer: (serverId: string) => void;
  onLeaveServer: (serverId: string) => void;
  onUpdateChannel: (channelId: string, newName: string) => void;
  onDeleteChannel: (channelId: string) => void;
}

export function Channels({ 
  showCreateDialog, 
  setShowCreateDialog,
  servers,
  channels,
  selectedServer,
  onServerSelect,
  onBack,
  onCreateServer,
  onCreateChannel,
  onUpdateServer,
  onDeleteServer,
  onLeaveServer,
  onUpdateChannel,
  onDeleteChannel
}: ChannelsProps) {
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<"text" | "voice">("text");
  const [showCreateServerDialog, setShowCreateServerDialog] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [newServerIcon, setNewServerIcon] = useState<string | null>(null);
  const [newServerDescription, setNewServerDescription] = useState("");
  const [isServersCollapsed, setIsServersCollapsed] = useState(true);
  const [isChannelsCollapsed, setIsChannelsCollapsed] = useState(false);
  const [serverSearch, setServerSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [settingsChannelName, setSettingsChannelName] = useState("");
  const [inVoiceChannel, setInVoiceChannel] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showCallSettings, setShowCallSettings] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  // Voice settings
  const [selectedMicrophone, setSelectedMicrophone] = useState('default');
  const [selectedCamera, setSelectedCamera] = useState('default');
  const [selectedSpeaker, setSelectedSpeaker] = useState('default');
  const [devices, setDevices] = useState<{ microphones: AudioDevice[]; cameras: AudioDevice[]; speakers: AudioDevice[] }>({
    microphones: [],
    cameras: [],
    speakers: []
  });

  // File and voice message states
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoQuality, setVideoQuality] = useState<'auto' | 'high' | 'medium' | 'low'>('auto');
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);

  const serverIconInputRef = useRef<HTMLInputElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  
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

  // ESC key handler to close channel and collapse/expand panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedChannel) {
          // If channel is open, close it and expand panel
          setSelectedChannel(null);
          setIsChannelsCollapsed(false);
        } else if (!isChannelsCollapsed) {
          // If no channel open but panel is expanded, go back to servers
          onBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedChannel, isChannelsCollapsed, onBack]);

  const handleChannelClick = (channelId: string) => {
    setSelectedChannel(channelId);
    setIsChannelsCollapsed(true);
  };

  // File handling
  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFile({
          url: reader.result as string,
          name: file.name,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice recording
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check your permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelVoiceRecording = () => {
    stopVoiceRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const sendVoiceMessage = () => {
    if (!audioBlob || !selectedChannel) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        channelId: selectedChannel,
        text: '',
        timestamp: new Date(),
        author: 'You',
        audioUrl: reader.result as string,
        audioDuration: recordingTime
      };

      setMessages([...messages, newMessage]);
      setAudioBlob(null);
      setRecordingTime(0);
      audioChunksRef.current = [];
    };
    reader.readAsDataURL(audioBlob);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!selectedChannel) return;
    if (!messageText.trim() && !selectedFile && !audioBlob) return;

    // Handle voice message
    if (audioBlob) {
      sendVoiceMessage();
      return;
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      channelId: selectedChannel,
      text: messageText,
      timestamp: new Date(),
      author: "You",
      fileUrl: selectedFile?.url,
      fileName: selectedFile?.name,
      fileType: selectedFile?.type
    };
    
    setMessages([...messages, newMessage]);
    setMessageText("");
    setSelectedFile(null);
  };

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const currentChannel = channels.find(ch => ch.id === selectedChannel);
  const channelMessages = messages.filter(msg => msg.channelId === selectedChannel);

  const handleCreateServer = () => {
    if (newServerName.trim()) {
      const serverId = onCreateServer({
        name: newServerName,
        icon: newServerIcon || undefined,
        description: newServerDescription || undefined
      });
      setNewServerName("");
      setNewServerIcon(null);
      setNewServerDescription("");
      setShowCreateServerDialog(false);
      if (serverId) {
        onServerSelect(serverId);
      }
    } else {
      toast.error("Please enter a server name");
    }
  };

  const handleCreateChannel = () => {
    if (!selectedServer) {
      toast.error("Please select a server first");
      return;
    }
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName, newChannelType, selectedServer);
      setNewChannelName("");
      setNewChannelType("text");
      setShowCreateDialog(false);
    } else {
      toast.error("Please enter a channel name");
    }
  };

  const handleOpenServerSettings = () => {
    if (!currentServer) return;
    setShowServerSettings(true);
  };

  const handleDeleteServerConfirm = () => {
    if (!selectedServer) return;
    onDeleteServer(selectedServer);
    setShowServerSettings(false);
  };

  const handleLeaveServerConfirm = () => {
    if (!selectedServer) return;
    onLeaveServer(selectedServer);
    setShowServerSettings(false);
  };

  const handleOpenChannelSettings = () => {
    if (!currentChannel) return;
    setSettingsChannelName(currentChannel.name);
    setShowChannelSettings(true);
  };

  const handleUpdateChannelName = () => {
    if (!selectedChannel || !settingsChannelName.trim()) return;
    onUpdateChannel(selectedChannel, settingsChannelName);
    setShowChannelSettings(false);
  };

  const handleDeleteChannelConfirm = () => {
    if (!selectedChannel) return;
    onDeleteChannel(selectedChannel);
    setShowChannelSettings(false);
    setSelectedChannel(null);
  };

  const handleJoinVoice = () => {
    if (!selectedChannel) return;
    setInVoiceChannel(true);
    toast.success(`Joined voice channel: ${currentChannel?.name}`);
  };

  const handleLeaveVoice = () => {
    setInVoiceChannel(false);
    setIsMuted(false);
    setIsVideoOn(false);
    setIsDeafened(false);
    toast.info("Left voice channel");
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? "Unmuted" : "Muted");
  };

  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    if (newDeafened) {
      setIsMuted(true);
    }
    toast.info(newDeafened ? "Deafened" : "Undeafened");
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
  
  const handleMicrophoneChange = (deviceId: string) => {
    setSelectedMicrophone(deviceId);
    toast.success(`Microphone changed to ${devices.microphones.find(m => m.id === deviceId)?.name}`);
  };
  
  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    toast.success(`Camera changed to ${devices.cameras.find(c => c.id === deviceId)?.name}`);
  };
  
  const handleSpeakerChange = (deviceId: string) => {
    setSelectedSpeaker(deviceId);
    toast.success(`Speaker changed to ${devices.speakers.find(s => s.id === deviceId)?.name}`);
  };
  
  const handleSaveCallSettings = () => {
    toast.success('Call settings saved successfully');
    setShowCallSettings(false);
  };
  
  const handleVideoQualityChange = (quality: 'auto' | 'high' | 'medium' | 'low') => {
    setVideoQuality(quality);
    const qualityLabels = {
      auto: 'Auto (Adaptive)',
      high: 'High (1080p)',
      medium: 'Medium (720p)',
      low: 'Low (480p)'
    };
    toast.success(`Video quality set to ${qualityLabels[quality]}`);
  };

  const handleCopyInviteCode = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentServer?.inviteCode) {
      toast.error("No invite code available");
      return;
    }
    
    // Generate full invite link using the server's invite code
    const inviteLink = generateServerInviteLink(currentServer.id, currentServer.inviteCode);
    console.log("Generated invite link:", inviteLink);
    
    const success = await copyToClipboard(inviteLink);
    
    if (success) {
      toast.success("Invite link copied!", {
        description: inviteLink
      });
    } else {
      toast.error("Failed to copy invite link");
    }
  };

  const voiceChannels = channels.filter(ch => ch.type === "voice" && ch.serverId === selectedServer);
  const textChannels = channels.filter(ch => ch.type === "text" && ch.serverId === selectedServer);

  const currentServer = servers.find(s => s.id === selectedServer);

  return (
    <div className="h-full flex bg-[#0A0A0C] animate-in fade-in duration-500">
      {/* Servers List */}
      <div 
        className={cn(
          "flex h-full flex-col items-center border-r border-white/5 bg-[#0A0A0C] py-6 transition-all duration-300",
          isServersCollapsed ? "w-[72px]" : "w-60"
        )}
        onDoubleClick={() => setIsServersCollapsed(!isServersCollapsed)}
      >
        <div className={cn(
          "flex w-full flex-1 flex-col gap-4 transition-all",
          isServersCollapsed ? "px-2 items-center" : "px-4 items-stretch"
        )}>
          {/* Create Server Button */}
          <button
            onClick={() => setShowCreateServerDialog(true)}
            className={cn(
              "relative flex items-center rounded-2xl bg-[#0e0e11] hover:bg-white/5 text-gray-500 hover:text-white transition-all duration-200",
              isServersCollapsed ? "justify-center w-12 h-12" : "justify-start w-full h-12 px-3 gap-3"
            )}
            title="Create Server"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!isServersCollapsed && (
              <span className="font-medium text-sm">Create Server</span>
            )}
          </button>

          {/* Search */}
          {isServersCollapsed ? (
            <button
              className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0e0e11] hover:bg-white/5 text-gray-500 hover:text-white transition-all duration-200"
              title="Search"
              onClick={() => setIsServersCollapsed(false)}
            >
              <Search className="w-5 h-5" />
            </button>
          ) : (
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search servers..."
                value={serverSearch}
                onChange={(e) => setServerSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-3 bg-[#0e0e11] text-white text-sm rounded-2xl border border-white/5 focus:border-white/20 outline-none transition-colors placeholder:text-gray-500"
              />
            </div>
          )}

          {/* Divider */}
          <div className={cn(
            "h-[2px] bg-white/10 rounded-full transition-all",
            isServersCollapsed ? "w-8" : "w-full"
          )}></div>

          {/* Server Buttons */}
          {servers
            .filter(server => 
              serverSearch.trim() === "" || 
              server.name.toLowerCase().includes(serverSearch.toLowerCase())
            )
            .map((server) => (
            <button
              key={server.id}
              onClick={() => onServerSelect(server.id)}
              className={cn(
                "relative flex items-center rounded-2xl transition-all duration-200",
                isServersCollapsed ? "justify-center w-12 h-12" : "justify-start w-full h-12 px-3 gap-3",
                selectedServer === server.id
                  ? "bg-white/10 text-white"
                  : "bg-[#0e0e11] hover:bg-white/5 text-gray-500 hover:text-white"
              )}
              title={server.name}
            >
              {server.icon ? (
                <img 
                  src={server.icon} 
                  alt={server.name}
                  className={cn(
                    "rounded-xl object-cover flex-shrink-0",
                    isServersCollapsed ? "w-full h-full" : "w-10 h-10"
                  )}
                />
              ) : (
                <div className={cn(
                  "text-lg font-bold bg-gradient-to-br rounded-xl flex items-center justify-center flex-shrink-0",
                  isServersCollapsed ? "w-full h-full" : "w-10 h-10",
                  server.color
                )}>
                  {server.name.charAt(0)}
                </div>
              )}
              {!isServersCollapsed && (
                <span className="font-medium text-sm truncate">{server.name}</span>
              )}
              {selectedServer === server.id && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Channels Panel */}
      {selectedServer ? (
        <>
          <div 
            className={cn(
              "bg-[#0e0e11] border-r border-white/5 flex flex-col transition-all duration-300",
              isChannelsCollapsed ? "w-20" : "w-80"
            )}
            onDoubleClick={() => setIsChannelsCollapsed(!isChannelsCollapsed)}
          >
          {/* Server Header */}
          <div className="h-14 px-3 flex items-center justify-center border-b border-white/10 bg-[#111114]">
            {!isChannelsCollapsed ? (
              <div className="flex-1 flex items-center justify-between px-3">
                <div className="flex items-center gap-3">
                  {currentServer?.icon ? (
                    <img 
                      src={currentServer.icon} 
                      alt={currentServer.name}
                      className="w-10 h-10 rounded-xl object-cover shadow-lg"
                    />
                  ) : (
                    <div className={cn(
                      "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg",
                      currentServer?.color
                    )}>
                      {currentServer?.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-white font-semibold text-sm">{currentServer?.name}</h2>
                  </div>
                </div>
                <button 
                  onClick={handleOpenServerSettings}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            ) : (
              currentServer?.icon ? (
                <img 
                  src={currentServer.icon} 
                  alt={currentServer.name}
                  className="w-12 h-12 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg",
                  currentServer?.color
                )}>
                  {currentServer?.name.charAt(0)}
                </div>
              )
            )}
          </div>

          {/* Channels List */}
          <div className={cn("flex-1 overflow-y-auto bg-[#0A0A0C]", isChannelsCollapsed ? "px-3 py-3" : "px-6 py-4")}>
            {!isChannelsCollapsed ? (
              <>
                {/* Text Channels */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3 group">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300">
                      <ChevronDown className="w-3 h-3" />
                      <span>Text Channels</span>
                    </div>
                    <button 
                      onClick={() => setShowCreateDialog(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded flex items-center justify-center hover:bg-white/10"
                      title="Create Channel"
                    >
                      <Plus className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    {textChannels.map((channel) => (
                      <GlassCard
                        key={channel.id}
                        className={cn(
                          "p-3 flex items-center gap-3 transition-all border border-white/5 group",
                          selectedChannel === channel.id
                            ? "bg-white/15 hover:bg-white/20"
                            : channel.unread 
                              ? "bg-white/10 hover:bg-white/15" 
                              : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <Hash 
                          className="w-5 h-5 text-gray-500 flex-shrink-0 cursor-pointer" 
                          onClick={() => handleChannelClick(channel.id)}
                        />
                        <span 
                          onClick={() => handleChannelClick(channel.id)}
                          className={cn(
                            "flex-1 text-sm cursor-pointer",
                            selectedChannel === channel.id || channel.unread ? "text-white font-medium" : "text-gray-400"
                          )}
                        >
                          {channel.name}
                        </span>
                        {channel.unread && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                            {channel.unread}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChannel(channel.id);
                            handleOpenChannelSettings();
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded flex items-center justify-center hover:bg-white/10"
                        >
                          <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                        </button>
                      </GlassCard>
                    ))}
                  </div>
                </div>

                {/* Voice Channels */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3 group">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300">
                      <ChevronDown className="w-3 h-3" />
                      <span>Voice Channels</span>
                    </div>
                    <button 
                      onClick={() => setShowCreateDialog(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded flex items-center justify-center hover:bg-white/10"
                      title="Create Channel"
                    >
                      <Plus className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    {voiceChannels.map((channel) => (
                      <GlassCard
                        key={channel.id}
                        className={cn(
                          "p-3 flex items-center gap-3 transition-all border border-white/5 group",
                          selectedChannel === channel.id
                            ? "bg-white/15 hover:bg-white/20"
                            : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <Volume2 
                          className="w-5 h-5 text-gray-500 flex-shrink-0 cursor-pointer" 
                          onClick={() => handleChannelClick(channel.id)}
                        />
                        <span 
                          onClick={() => handleChannelClick(channel.id)}
                          className={cn(
                            "flex-1 text-sm cursor-pointer",
                            selectedChannel === channel.id ? "text-white font-medium" : "text-gray-400"
                          )}
                        >
                          {channel.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChannel(channel.id);
                            handleOpenChannelSettings();
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded flex items-center justify-center hover:bg-white/10"
                        >
                          <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                        </button>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {textChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelClick(channel.id)}
                    className={cn(
                      "w-full flex items-center justify-center py-2 rounded-xl transition-all relative group",
                      selectedChannel === channel.id ? "bg-white/15" : "hover:bg-white/5"
                    )}
                    title={channel.name}
                  >
                    <Hash className={cn(
                      "w-6 h-6",
                      selectedChannel === channel.id ? "text-white" : "text-gray-500 group-hover:text-gray-400"
                    )} />
                    {selectedChannel === channel.id && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
                {voiceChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelClick(channel.id)}
                    className={cn(
                      "w-full flex items-center justify-center py-2 rounded-xl transition-all relative group",
                      selectedChannel === channel.id ? "bg-white/15" : "hover:bg-white/5"
                    )}
                    title={channel.name}
                  >
                    <Volume2 className={cn(
                      "w-6 h-6",
                      selectedChannel === channel.id ? "text-white" : "text-gray-500 group-hover:text-gray-400"
                    )} />
                    {selectedChannel === channel.id && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedChannel && currentChannel && (
          <div className="flex-1 flex flex-col bg-[#0A0A0C]">
            {/* Channel Header */}
            <div className="h-14 px-6 flex items-center justify-between border-b border-white/10 bg-[#111114]">
              <div className="flex items-center gap-3">
                {currentChannel.type === "text" ? (
                  <Hash className="w-5 h-5 text-gray-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-400" />
                )}
                <h2 className="text-white font-semibold">{currentChannel.name}</h2>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {currentChannel.type === "text" ? (
                <>
                  {channelMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                      <Hash className="w-16 h-16 text-gray-500 mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Welcome to #{currentChannel.name}</h3>
                      <p className="text-gray-500">This is the beginning of the #{currentChannel.name} channel.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {channelMessages.map((message) => (
                        <div key={message.id} className="flex gap-3 hover:bg-white/5 -mx-2 px-2 py-1 rounded transition-colors">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {message.author.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-semibold text-white">{message.author}</span>
                              <span className="text-xs text-gray-500">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {/* File attachment */}
                            {message.fileUrl && (
                              <div className="mb-2">
                                {message.fileType?.startsWith('image/') ? (
                                  <div className="relative group max-w-sm">
                                    <img 
                                      src={message.fileUrl} 
                                      alt={message.fileName}
                                      className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(message.fileUrl, '_blank')}
                                    />
                                    {message.text && (
                                      <p className="mt-2 text-gray-300 text-sm">{message.text}</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 max-w-sm">
                                    <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                      <FileText className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-white font-medium truncate">{message.fileName}</div>
                                      <div className="text-xs text-gray-400">Click to download</div>
                                    </div>
                                    <a
                                      href={message.fileUrl}
                                      download={message.fileName}
                                      className="flex-shrink-0 w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                    >
                                      <Download className="w-4 h-4 text-white" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Voice message */}
                            {message.audioUrl && (
                              <AudioPlayer 
                                audioUrl={message.audioUrl} 
                                duration={message.audioDuration || 0}
                                isMe={message.author === 'You'}
                              />
                            )}

                            {/* Text message */}
                            {message.text && !message.fileUrl && (
                              <p className="text-gray-300 text-sm">{message.text}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col h-full">
                  {!inVoiceChannel ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                      <Volume2 className="w-16 h-16 text-gray-500 mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">{currentChannel.name}</h3>
                      <p className="text-gray-500">Voice channel - Click to join</p>
                      <button 
                        onClick={handleJoinVoice}
                        className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Join Voice
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <Volume2 className="w-6 h-6 text-green-500" />
                          <div>
                            <h3 className="text-lg font-semibold text-white">{currentChannel.name}</h3>
                            <p className="text-sm text-gray-400">Voice Channel</p>
                          </div>
                        </div>
                        <button
                          onClick={handleLeaveVoice}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <PhoneOff className="w-4 h-4" />
                          Leave
                        </button>
                      </div>

                      {/* Screen Share Display */}
                      {isScreenSharing && screenStream ? (
                        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)] group">
                            {/* Gradient border */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-pink-500/30 rounded-2xl p-[2px]">
                              <div className="w-full h-full bg-[#0A0A0C] rounded-2xl overflow-hidden">
                                <video 
                                  ref={screenVideoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                            
                            {/* Indicator */}
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm border border-white/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                              <Monitor className="w-3.5 h-3.5" />
                              <span className="text-xs font-semibold">Sharing</span>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex-1 overflow-y-auto">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Voice Participants — 1</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">You</p>
                              <p className="text-xs text-gray-400">Connected</p>
                            </div>
                            <div className="flex gap-2">
                              {isMuted ? (
                                <MicOff className="w-5 h-5 text-red-500" />
                              ) : (
                                <Mic className="w-5 h-5 text-green-500" />
                              )}
                              {isVideoOn ? (
                                <Video className="w-5 h-5 text-green-500" />
                              ) : (
                                <VideoOff className="w-5 h-5 text-gray-500" />
                              )}
                              {isDeafened && (
                                <Headphones className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-6 mt-4">
                        <div className="flex items-center justify-center gap-4">
                          {/* 1. Микрофон */}
                          <button
                            onClick={toggleMute}
                            className={cn(
                              "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-2xl w-12 h-12",
                              isMuted
                                ? "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30"
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            )}
                            title={isMuted ? "Unmute" : "Mute"}
                          >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </button>

                          {/* 2. Звук в наушниках */}
                          <button
                            onClick={toggleDeafen}
                            className={cn(
                              "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-2xl w-12 h-12",
                              isDeafened
                                ? "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30"
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            )}
                            title={isDeafened ? "Undeafen" : "Deafen"}
                          >
                            <Headphones className="w-5 h-5" />
                          </button>

                          {/* 3. Демонстрация экрана */}
                          <button
                            onClick={toggleScreenShare}
                            className={cn(
                              "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-2xl w-12 h-12",
                              isScreenSharing
                                ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                                : "text-white border border-white/10 hover:border-white/20 backdrop-blur-md bg-white/10 hover:bg-white/20"
                            )}
                            title={isScreenSharing ? "Stop sharing" : "Share screen"}
                          >
                            <Monitor className="w-5 h-5" />
                          </button>

                          {/* 4. Камера */}
                          <button
                            onClick={() => setIsVideoOn(!isVideoOn)}
                            className={cn(
                              "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-2xl w-12 h-12",
                              !isVideoOn
                                ? "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30"
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            )}
                            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                          >
                            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                          </button>

                          {/* 5. Настройки */}
                          <button
                            onClick={() => setShowCallSettings(true)}
                            className="relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden text-white border border-white/10 hover:border-white/20 backdrop-blur-md rounded-2xl w-12 h-12 bg-white/10 hover:bg-white/20"
                            title="Settings"
                          >
                            <Settings className="w-5 h-5" />
                          </button>

                          <div className="w-px h-8 bg-white/10 mx-1" />

                          <button
                            onClick={handleLeaveVoice}
                            className="relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-2xl w-16 h-12"
                            title="Leave call"
                          >
                            <PhoneOff className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Input - Only for text channels */}
            {currentChannel.type === "text" && (
              <div className="sticky bottom-0 p-4 border-t border-white/5 bg-[#0A0A0C] z-10">
                <form 
                  onSubmit={(e) => {
                    handleSendMessage(e);
                  }} 
                  className="relative max-w-4xl mx-auto"
                >
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* File Preview */}
                  {selectedFile && (
                    <div className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      {selectedFile.type.startsWith('image/') ? (
                        <div className="flex items-center gap-3">
                          <img 
                            src={selectedFile.url} 
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium">Image selected</div>
                            <div className="text-xs text-gray-400">Add caption below (optional)</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedFile(null)}
                            className="text-gray-400 hover:text-red-400 flex-shrink-0"
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium truncate">{selectedFile.name}</div>
                            <div className="text-xs text-gray-400">File ready to send</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedFile(null)}
                            className="text-gray-400 hover:text-red-400 flex-shrink-0"
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recording UI */}
                  {isRecording && (
                    <div className="mb-3 p-4 bg-red-500/10 rounded-xl border border-red-500/30 flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">Recording...</span>
                        <span className="text-white/60 text-sm">{formatTime(recordingTime)}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelVoiceRecording}
                        className="text-gray-400 hover:text-red-400"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Voice Message Preview */}
                  {!isRecording && audioBlob && (
                    <div className="mb-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Mic className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">Voice Message</div>
                        <div className="text-xs text-gray-400">{formatTime(recordingTime)}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={cancelVoiceRecording}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="relative flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleFileAttach}
                      className="text-gray-400 hover:text-white"
                    >
                       <Paperclip className="w-5 h-5" />
                    </Button>
                    
                    {!isRecording && !audioBlob && (
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as any);
                          }
                        }}
                        placeholder={selectedFile ? (selectedFile.type.startsWith('image/') ? "Add a caption..." : "Add a message...") : `Message #${currentChannel.name}`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                      />
                    )}

                    {isRecording && (
                      <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">{formatTime(recordingTime)}</span>
                      </div>
                    )}

                    {!isRecording && audioBlob && (
                      <div className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex items-center justify-center">
                        <span className="text-white font-medium">Voice message ready to send</span>
                      </div>
                    )}
                    
                    {/* Voice recording button - show when no text and no file */}
                    {!messageText.trim() && !selectedFile && !audioBlob && (
                      <Button 
                        type="button" 
                        variant={isRecording ? "destructive" : "ghost"}
                        size="icon" 
                        onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                        className={cn(
                          "transition-all",
                          isRecording 
                            ? "bg-red-500 hover:bg-red-600 text-white" 
                            : "text-gray-400 hover:text-white"
                        )}
                      >
                        {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </Button>
                    )}

                    {/* Send button - show when has text, file, or voice message */}
                    {(messageText.trim() || selectedFile || audioBlob) && (
                      <Button 
                        type="submit" 
                        variant="primary" 
                        size="icon" 
                        disabled={!messageText.trim() && !selectedFile && !audioBlob}
                        className="transition-all opacity-100 scale-100"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no channel selected */}
        {!selectedChannel && (
          <div className="flex-1 flex items-center justify-center bg-[#0A0A0C]">
            <div className="text-center opacity-50">
              <Hash className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Select a channel</h3>
              <p className="text-gray-500">Choose a channel to start chatting</p>
            </div>
          </div>
        )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center opacity-50">
            <Hash className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Select a server</h3>
            <p className="text-gray-500">Choose a server to view its channels</p>
          </div>
        </div>
      )}

      {/* Create Channel Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#18181b] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Channel Name</label>
              <Input
                placeholder="Enter channel name..."
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateChannel();
                  }
                }}
                className="bg-[#0A0A0C] border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Channel Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewChannelType("text")}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    newChannelType === "text"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  <span className="text-sm font-medium">Text</span>
                </button>
                <button
                  onClick={() => setNewChannelType("voice")}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    newChannelType === "voice"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Voice</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowCreateDialog(false)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateChannel}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Server Dialog */}
      <Dialog open={showCreateServerDialog} onOpenChange={setShowCreateServerDialog}>
        <DialogContent className="bg-[#0e0e11] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Customize your server</DialogTitle>
            <p className="text-gray-400 text-sm">Give your new server a personality with a name and an icon. You can always change it later.</p>
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
                        setNewServerIcon(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {newServerIcon ? (
                  <div className="relative">
                    <img 
                      src={newServerIcon} 
                      alt="Server icon"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center cursor-pointer" onClick={() => serverIconInputRef.current?.click()}>
                      <Edit2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => serverIconInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-dashed border-white/20 hover:border-white/40 flex items-center justify-center cursor-pointer transition-all group"
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors mx-auto mb-1" />
                      <span className="text-xs text-gray-500 group-hover:text-gray-400">Upload</span>
                    </div>
                  </div>
                )}
              </div>
              {newServerIcon && (
                <button
                  onClick={() => setNewServerIcon(null)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove Icon
                </button>
              )}
            </div>

            {/* Server Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Server Name</label>
              <Input
                placeholder="Enter server name..."
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newServerName.trim()) {
                    handleCreateServer();
                  }
                }}
                className="bg-[#18181b] border-white/10 text-white placeholder:text-gray-500 h-11"
                autoFocus
              />
            </div>

            {/* Server Description (Optional) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description <span className="text-gray-600 normal-case">(optional)</span></label>
              <textarea
                placeholder="What's your server about?"
                value={newServerDescription}
                onChange={(e) => setNewServerDescription(e.target.value)}
                className="w-full bg-[#18181b] border border-white/10 text-white placeholder:text-gray-500 rounded-lg p-3 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                onClick={() => {
                  setShowCreateServerDialog(false);
                  setNewServerName("");
                  setNewServerIcon(null);
                  setNewServerDescription("");
                }}
                className="bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border-0"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateServer}
                disabled={!newServerName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-6"
              >
                Create Server
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Server Settings */}
      {showServerSettings && currentServer && (
        <ServerSettings
          server={currentServer}
          onClose={() => setShowServerSettings(false)}
          onUpdateServer={onUpdateServer}
          onDeleteServer={handleDeleteServerConfirm}
          onLeaveServer={handleLeaveServerConfirm}
          onCopyInviteCode={() => handleCopyInviteCode({} as React.MouseEvent<HTMLButtonElement>)}
        />
      )}

      {/* Channel Settings Dialog */}
      <Dialog open={showChannelSettings} onOpenChange={setShowChannelSettings}>
        <DialogContent className="bg-[#18181b] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-500" />
              Channel Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Channel Name</label>
              <Input
                placeholder="Enter channel name..."
                value={settingsChannelName}
                onChange={(e) => setSettingsChannelName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateChannelName();
                  }
                }}
                className="bg-[#0A0A0C] border-white/10 text-white"
              />
            </div>

            <div className="flex gap-3 justify-between pt-4">
              <Button
                onClick={handleDeleteChannelConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Channel
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowChannelSettings(false)}
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateChannelName}
                  disabled={!settingsChannelName.trim()}
                  className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Voice Call Settings Dialog */}
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
              onClick={handleSaveCallSettings}
              className="bg-blue-500 hover:bg-blue-600 text-white border-none"
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
