import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Avatar } from "@/app/components/design-system/Avatar";
import { Button } from "@/app/components/design-system/Button";
import { Send, Phone, Video, MoreVertical, Paperclip, MessageSquareDashed, CheckCircle2, FileText, Download, X, Image as ImageIcon, Search, UserPlus, ChevronDown, Mic, Square, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { playMessageReceived } from "@/app/utils/sounds";
import { getFriends, type Friend as FriendType } from "@/app/utils/friends";

interface User {
  id: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
}

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
  status?: "online" | "idle" | "dnd" | "offline";
  statusText?: string;
}

interface ChatProps {
  currentUser: User;
  selectedFriendId?: string | null;
  onOpenAddFriend?: () => void;
  onStartCall?: (friend: Friend, isVideo: boolean) => void;
}

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  isVerified?: boolean;
  avatar?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  audioUrl?: string;
  audioDuration?: number;
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

export function Chat({ currentUser, selectedFriendId, onOpenAddFriend, onStartCall }: ChatProps) {
  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  // Load friends from Supabase
  useEffect(() => {
    const loadFriends = async () => {
      setIsLoadingFriends(true);
      const friendsData = await getFriends();
      setFriends(friendsData.filter(f => f.relationship === 'friend'));
      setIsLoadingFriends(false);
    };
    loadFriends();
  }, []);
  
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(() => {
    const savedId = localStorage.getItem('connecta_selected_friend');
    if (savedId) {
      const saved = localStorage.getItem('connecta_friends_v2');
      if (saved) {
        const friendsList = JSON.parse(saved);
        return friendsList.find((f: Friend) => f.id === savedId) || null;
      }
    }
    return null;
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load messages for selected friend
  useEffect(() => {
    if (selectedFriend) {
      const saved = localStorage.getItem(`connecta_messages_${selectedFriend.id}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [selectedFriend]);

  // Save messages when they change
  useEffect(() => {
    if (selectedFriend && messages.length > 0) {
      localStorage.setItem(`connecta_messages_${selectedFriend.id}`, JSON.stringify(messages));
    }
  }, [messages, selectedFriend]);

  // Save friends to localStorage
  useEffect(() => {
    localStorage.setItem('connecta_friends_v2', JSON.stringify(friends));
  }, [friends]);

  // Save selected friend to localStorage
  useEffect(() => {
    if (selectedFriend) {
      localStorage.setItem('connecta_selected_friend', selectedFriend.id);
    } else {
      localStorage.removeItem('connecta_selected_friend');
    }
  }, [selectedFriend]);

  // Auto-select friend from props
  useEffect(() => {
    if (selectedFriendId) {
      const friend = friends.find(f => f.id === selectedFriendId);
      if (friend) {
        setSelectedFriend(friend);
        setIsPanelCollapsed(true);
      }
    }
  }, [selectedFriendId, friends]);

  // Handle ESC key to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPanelCollapsed(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsPanelCollapsed(true); // Collapse panel when friend is selected
  };

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileAttach = () => {
    console.log('File attach clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('File selected:', file.name, file.type, file.size);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const fileUrl = event.target?.result as string;
          console.log('File loaded, ready to send');
          
          setSelectedFile({
            url: fileUrl,
            name: file.name,
            type: file.type
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
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
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
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
  };

  const sendVoiceMessage = () => {
    if (!audioBlob || !selectedFriend) return;

    const reader = new FileReader();
    reader.onload = () => {
      const audioUrl = reader.result as string;
      const newMessage = {
        id: messages.length + 1,
        sender: currentUser.username,
        text: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        avatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
        audioUrl: audioUrl,
        audioDuration: recordingTime
      };
      
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      
      // Сразу сохраняем для правильного друга
      localStorage.setItem(`connecta_messages_${selectedFriend.id}`, JSON.stringify(updatedMessages));
      
      setAudioBlob(null);
      setRecordingTime(0);
    };
    reader.readAsDataURL(audioBlob);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSend called, inputText:', inputText, 'selectedFile:', selectedFile);
    
    // Проверяем что выбран друг
    if (!selectedFriend) {
      console.log('No friend selected, not sending');
      return;
    }
    
    if (!inputText.trim() && !selectedFile && !audioBlob) {
      console.log('Input, file and audio are empty, not sending');
      return;
    }
    
    if (audioBlob) {
      sendVoiceMessage();
      return;
    }
    
    console.log('Adding message to state');
    const newMessage = {
      id: messages.length + 1,
      sender: currentUser.username,
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      avatar: currentUser.avatar,
      isVerified: currentUser.isVerified,
      fileUrl: selectedFile?.url,
      fileName: selectedFile?.name,
      fileType: selectedFile?.type
    };
    
    // Обновляем сообщения
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // Сразу сохраняем для правильного друга
    localStorage.setItem(`connecta_messages_${selectedFriend.id}`, JSON.stringify(updatedMessages));
    
    setInputText("");
    setSelectedFile(null);
    
    // Simulate incoming message from friend for testing (only in dev mode)
    if (import.meta.env?.VITE_DEV_MODE === 'true') {
      setTimeout(() => {
        const incomingMessage = {
          id: updatedMessages.length + 1,
          sender: selectedFriend.username,
          text: "Got your message!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          avatar: selectedFriend.avatar,
          isVerified: selectedFriend.isVerified
        };
        
        const messagesWithIncoming = [...updatedMessages, incomingMessage];
        setMessages(messagesWithIncoming);
        localStorage.setItem(`connecta_messages_${selectedFriend.id}`, JSON.stringify(messagesWithIncoming));
        playMessageReceived();
      }, 2000);
    }
  };

  return (
    <div className="h-full flex bg-[#0A0A0C]">
      {/* Friends Panel */}
      <div className={cn(
        "h-full bg-[#111114] flex flex-col border-r border-white/5 transition-all duration-300",
        isPanelCollapsed ? "w-20" : "w-60"
      )}>
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
          {!isPanelCollapsed && (
            <h2 className="text-white font-semibold text-sm">Direct Messages</h2>
          )}
          <button 
            onClick={() => onOpenAddFriend?.()}
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all",
              isPanelCollapsed && "mx-auto"
            )}
            title="Add Friend"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        {!isPanelCollapsed && (
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
        )}

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="mb-2">
            {!isPanelCollapsed && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span>Friends — {filteredFriends.length}</span>
              </div>
            )}
            
            <div className="space-y-0.5 mt-1">
              {filteredFriends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleSelectFriend(friend)}
                  title={isPanelCollapsed ? friend.username : undefined}
                  className={cn(
                    "w-full flex items-center transition-all group",
                    isPanelCollapsed ? "justify-center px-2 py-2" : "gap-3 px-2 py-2 rounded text-sm",
                    selectedFriend?.id === friend.id 
                      ? "bg-white/10 text-white" 
                      : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    {friend.avatar ? (
                      <img 
                        src={friend.avatar} 
                        alt={friend.username}
                        className={cn(
                          "rounded-full object-cover",
                          isPanelCollapsed ? "w-10 h-10" : "w-8 h-8"
                        )}
                      />
                    ) : (
                      <div className={cn(
                        "rounded-full bg-gradient-to-br from-blue-500 to-purple-600",
                        isPanelCollapsed ? "w-10 h-10" : "w-8 h-8"
                      )} />
                    )}
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111114]",
                      getStatusColor(friend.status)
                    )} />
                  </div>
                  {!isPanelCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{friend.username}</span>
                        {friend.isVerified && (
                          <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 flex-shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      {friend.statusText && (
                        <div className="text-xs text-gray-500 truncate">{friend.statusText}</div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Panel at Bottom */}
        <div className={cn(
          "h-14 px-2 py-2 bg-[#0d0d0f] border-t border-white/5 flex items-center gap-2",
          isPanelCollapsed && "justify-center"
        )}>
          {currentUser.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.username}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0" />
          )}
          {!isPanelCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{currentUser.username}</div>
              <div className="text-[10px] text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Online
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-[#0A0A0C] sticky top-0 z-10">
          {selectedFriend ? (
            <>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedFriend.avatar ? (
                    <img 
                      src={selectedFriend.avatar} 
                      alt={selectedFriend.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                  )}
                  <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0C]",
                    getStatusColor(selectedFriend.status)
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{selectedFriend.username}</h3>
                    {selectedFriend.isVerified && (
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 capitalize">{selectedFriend.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onStartCall?.(selectedFriend, false)}
                  title="Start voice call"
                >
                  <Phone className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onStartCall?.(selectedFriend, true)}
                  title="Start video call"
                >
                  <Video className="w-5 h-5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 opacity-50">
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-white/10 rounded" />
                  <div className="h-2 w-16 bg-white/5 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-50 pointer-events-none">
                <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
              </div>
            </>
          )}
        </div>

        {/* Messages Area - Empty State */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
          {!selectedFriend ? (
            <div className="text-center opacity-40">
              <MessageSquareDashed className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-1">Select a friend</h3>
              <p className="text-gray-500 text-sm">Choose a friend from the list to start chatting.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center opacity-40">
              <MessageSquareDashed className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-1">No messages yet</h3>
              <p className="text-gray-500 text-sm">This is the start of your conversation with {selectedFriend.username}.</p>
            </div>
          ) : (
          <div className="w-full space-y-6">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-3 max-w-[80%]",
                  msg.isMe ? "ml-auto flex-row-reverse" : ""
                )}
              >
                 {msg.avatar ? (
                   <img 
                     src={msg.avatar} 
                     alt={msg.sender}
                     className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                   />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0" />
                 )}
                 <div className="flex flex-col gap-1">
                   {!msg.isMe && (
                     <div className="flex items-center gap-1.5 px-1">
                       <span className="text-sm font-medium text-white">{msg.sender}</span>
                       {(msg.isVerified || selectedFriend?.isVerified) && (
                         <div className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500">
                           <CheckCircle2 className="w-3 h-3 text-white" />
                         </div>
                       )}
                       <span className="text-xs text-gray-500">{msg.time}</span>
                     </div>
                   )}
                   <div className={cn(
                     "rounded-2xl overflow-hidden",
                     msg.isMe 
                       ? "bg-blue-600 text-white rounded-tr-sm" 
                       : "bg-white/10 text-gray-200 rounded-tl-sm"
                   )}>
                     {msg.fileUrl ? (
                       <div>
                         {msg.fileType?.startsWith('image/') ? (
                           <div>
                             <img 
                               src={msg.fileUrl} 
                               alt={msg.fileName} 
                               className="max-w-sm max-h-96 object-contain rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                               onClick={() => {
                                 const link = document.createElement('a');
                                 link.href = msg.fileUrl!;
                                 link.download = msg.fileName || 'image';
                                 link.click();
                               }}
                             />
                             {msg.text && (
                               <div className="p-3 text-sm leading-relaxed">{msg.text}</div>
                             )}
                           </div>
                         ) : (
                           <button 
                             onClick={() => {
                               const link = document.createElement('a');
                               link.href = msg.fileUrl!;
                               link.download = msg.fileName || 'file';
                               link.click();
                             }}
                             className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors w-full text-left"
                           >
                             <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                               <FileText className="w-5 h-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="text-sm font-medium truncate">{msg.fileName}</div>
                               <div className="text-xs opacity-70">Click to download</div>
                             </div>
                             <Download className="w-4 h-4 opacity-50" />
                           </button>
                         )}
                       </div>
                     ) : msg.audioUrl ? (
                       <AudioPlayer 
                         audioUrl={msg.audioUrl} 
                         duration={msg.audioDuration || 0}
                         isMe={msg.isMe}
                       />
                     ) : (
                       <div className="p-3 text-sm leading-relaxed">
                         {msg.text}
                       </div>
                     )}
                   </div>
                   {msg.isMe && (
                     <span className="text-xs text-gray-500 text-right px-1">{msg.time}</span>
                   )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 p-4 border-t border-white/5 bg-[#0A0A0C] z-10">
        <form 
          onSubmit={(e) => {
            console.log('Form submitted');
            handleSend(e);
          }} 
          className="relative max-w-4xl mx-auto"
        >
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
                    onClick={() => {
                      console.log('Removing selected file');
                      setSelectedFile(null);
                    }}
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
                    onClick={() => {
                      console.log('Removing selected file');
                      setSelectedFile(null);
                    }}
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
                value={inputText}
                onChange={(e) => {
                  console.log('Input changed:', e.target.value);
                  setInputText(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    console.log('Enter pressed');
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
                placeholder={selectedFile ? (selectedFile.type.startsWith('image/') ? "Add a caption..." : "Add a message...") : "Type a message..."}
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
            {!inputText.trim() && !selectedFile && !audioBlob && (
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
            {(inputText.trim() || selectedFile || audioBlob) && (
              <Button 
                type="submit" 
                variant="primary" 
                size="icon" 
                disabled={!inputText.trim() && !selectedFile && !audioBlob}
                className="transition-all opacity-100 scale-100"
              >
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
