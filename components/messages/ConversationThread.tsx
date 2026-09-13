"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Phone,
  Video,
  Info,
  Send,
  Image as ImageIcon,
  Smile,
  Plus,
  Camera,
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  RotateCcw,
  X,
  Play,
  Pause,
  MapPin,
  Swords,
  Heart,
  Share2,
  Scissors,
  Trash2,
  Bell,
  Palette,
  Check,
  Sparkles,
  Compass,
  FolderOpen,
} from "lucide-react";
import {
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getOtherParticipant,
  formatChatTimestamp,
  formatDateSeparator,
  toggleReaction,
  updateBattleInviteStatus,
  clearMessages,
  setConversationTheme,
  toggleMuteConversation,
  Message,
  Conversation,
  ConversationParticipant,
  DEMO_PARTICIPANTS,
} from "@/lib/messages";
import { CameraCaptureModal } from "@/components/messages/CameraCaptureModal";
import { useAuth } from "@/context/AuthContext";

interface ConversationThreadProps {
  conversationId: string;
}

const EMOJI_REACTIONS = ["❤️", "😂", "🔥", "🛸", "😮", "👍"];

const WECA_STICKERS = [
  { id: "s1", label: "🛸 Anomaly Verified", icon: "🛸" },
  { id: "s2", label: "⚡ Reality Breach", icon: "⚡" },
  { id: "s3", label: "🌌 Void Signal", icon: "🌌" },
  { id: "s4", label: "🔥 94.2 Score", icon: "🔥" },
  { id: "s5", label: "🌱 Botanical Glitch", icon: "🌱" },
  { id: "s6", label: "🏆 Legendary Tier", icon: "🏆" },
];

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  conversationId,
}) => {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeTheme, setActiveTheme] = useState<"violet" | "cyan" | "neon" | "rose">("violet");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Call states
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isCameraFlipped, setIsCameraFlipped] = useState(false);

  // Voice note recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceMsgId, setPlayingVoiceMsgId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(0);

  // Message reaction picker
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user, profile } = useAuth();
  const SELF_ID = user?.id || profile?.id || "00000000-0000-0000-0000-000000000001";
  const currentAvatarUrl =
    profile?.avatar_url ||
    (profile?.username
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`
      : DEMO_PARTICIPANTS.self.avatarUrl);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load conversation and messages
  useEffect(() => {
    const conv = getConversation(conversationId);
    setConversation(conv);
    if (conv) {
      if (conv.theme) setActiveTheme(conv.theme);
      setMessages(getMessages(conversationId));
      markAsRead(conversationId);
    }
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const otherUser: ConversationParticipant | null = useMemo(
    () => (conversation ? getOtherParticipant(conversation) : null),
    [conversation]
  );

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Call duration timer
  useEffect(() => {
    if (isVoiceCallOpen || isVideoCallOpen) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((s) => s + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isVoiceCallOpen, isVideoCallOpen]);

  // Voice playback simulation
  useEffect(() => {
    if (!playingVoiceMsgId) return;
    setVoiceProgress(0);
    const interval = setInterval(() => {
      setVoiceProgress((prev) => {
        if (prev >= 100) {
          setPlayingVoiceMsgId(null);
          return 0;
        }
        return prev + 10;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [playingVoiceMsgId]);

  // Theme gradient mapping
  const themeClasses = useMemo(() => {
    switch (activeTheme) {
      case "cyan":
        return "bg-cyan-500 text-white";
      case "neon":
        return "bg-gradient-to-r from-fuchsia-600 via-pink-500 to-violet text-white shadow-md shadow-pink-500/20";
      case "rose":
        return "bg-rose-500 text-white";
      default:
        return "bg-violet text-white";
    }
  }, [activeTheme]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDateKey = "";

    for (const msg of messages) {
      const msgDate = new Date(msg.timestamp);
      const dateKey = `${msgDate.getFullYear()}-${msgDate.getMonth()}-${msgDate.getDate()}`;

      if (dateKey !== currentDateKey) {
        currentDateKey = dateKey;
        groups.push({ date: msg.timestamp, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  // Handle Text Send
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    const newMsg = sendMessage(conversationId, SELF_ID, trimmed);
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setIsSending(false);

    // Contextual simulated reply
    setTimeout(() => {
      if (otherUser) {
        const replies = [
          "That's wild! 🛸",
          "Sending you the coordinates now 📍",
          "I saw something similar near Sector 9...",
          "Reality-breaking tier for sure ✨",
          "Let's document this anomaly together!",
          "Whoa, look at that Weca score 🔥",
        ];
        const replyText = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg = sendMessage(conversationId, otherUser.id, replyText);
        setMessages((prev) => [...prev, replyMsg]);
      }
    }, 1200 + Math.random() * 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Reactions
  const handleToggleReaction = (msgId: string, emoji: string) => {
    const updated = toggleReaction(msgId, SELF_ID, emoji);
    if (updated) {
      setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
    }
    setReactionMsgId(null);
  };

  // End Voice Call
  const handleEndVoiceCall = () => {
    setIsVoiceCallOpen(false);
    const duration = Math.max(callDuration, 1);
    const logMsg = sendMessage(conversationId, SELF_ID, undefined, "call_log", undefined, {
      callInfo: { type: "voice", durationSeconds: duration, status: "completed" },
    });
    setMessages((prev) => [...prev, logMsg]);
    showToast(`Voice call ended (${duration}s)`);
  };

  // End Video Call
  const handleEndVideoCall = () => {
    setIsVideoCallOpen(false);
    const duration = Math.max(callDuration, 1);
    const logMsg = sendMessage(conversationId, SELF_ID, undefined, "call_log", undefined, {
      callInfo: { type: "video", durationSeconds: duration, status: "completed" },
    });
    setMessages((prev) => [...prev, logMsg]);
    showToast(`Video call ended (${duration}s)`);
  };

  // Send Voice Note
  const handleFinishVoiceRecord = () => {
    setIsRecordingVoice(false);
    const duration = Math.max(recordingSeconds, 2);
    const newMsg = sendMessage(conversationId, SELF_ID, undefined, "voice", undefined, {
      voiceDuration: duration,
    });
    setMessages((prev) => [...prev, newMsg]);
    showToast(`Voice message sent (${duration}s)`);
  };

  // Send Camera Clicked Photo
  const handleSendCameraPhoto = (photoDataUrl: string) => {
    const newMsg = sendMessage(conversationId, SELF_ID, undefined, "image", photoDataUrl);
    setMessages((prev) => [...prev, newMsg]);
    showToast("Photo captured & sent! 📸");
  };

  // Share from Photos / Files (Inside + icon)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newMsg = sendMessage(conversationId, SELF_ID, undefined, "image", dataUrl);
      setMessages((prev) => [...prev, newMsg]);
      setIsPlusMenuOpen(false);
      showToast("Photo sent from files 📁");
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected if needed
    e.target.value = "";
  };

  // Send Coordinates
  const handleSendCoordinates = () => {
    setIsPlusMenuOpen(false);
    const newMsg = sendMessage(conversationId, SELF_ID, undefined, "coordinates", undefined, {
      coordinates: {
        lat: 35.6762,
        lng: 139.6503,
        locationName: "Sector 9 · Shibuya Anomaly Rift",
      },
    });
    setMessages((prev) => [...prev, newMsg]);
    showToast("Shared GPS coordinates 📍");
  };

  // Send Battle Challenge
  const handleSendBattleInvite = () => {
    setIsPlusMenuOpen(false);
    const newMsg = sendMessage(conversationId, SELF_ID, undefined, "battle_invite", undefined, {
      battleInvite: {
        battleId: `battle-${Date.now()}`,
        title: "Chrono Drift vs. Botanical Rift",
        category: "Visual Anomalies",
        status: "pending",
      },
    });
    setMessages((prev) => [...prev, newMsg]);
    showToast("Battle challenge sent ⚔️");
  };

  // Send Sticker
  const handleSendSticker = (sticker: { label: string; icon: string }) => {
    setIsStickerDrawerOpen(false);
    const newMsg = sendMessage(
      conversationId,
      SELF_ID,
      `${sticker.icon} ${sticker.label}`
    );
    setMessages((prev) => [...prev, newMsg]);
  };

  // Clear chat
  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear all messages in this conversation?")) {
      clearMessages(conversationId);
      setMessages([]);
      setIsInfoDrawerOpen(false);
      showToast("Chat history cleared");
    }
  };

  // Theme Change
  const handleChangeTheme = (theme: "violet" | "cyan" | "neon" | "rose") => {
    setActiveTheme(theme);
    setConversationTheme(conversationId, theme);
    showToast(`Chat theme changed to ${theme}`);
  };

  if (!conversation || !otherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-white dark:bg-[#09090b]">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Conversation not found
        </p>
        <Link href="/messages" className="mt-3 text-xs text-violet hover:underline">
          ← Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-white dark:bg-[#09090b] overflow-hidden">
      {/* Hidden File Picker for "Photos / Files" option inside + icon */}
      <input
        ref={fileUploadInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/90 dark:bg-white/90 text-white dark:text-zinc-900 text-xs font-medium backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* ─── Thread Header (Clean Instagram Style — No Search Icon) ─── */}
      <div
        className="sticky top-0 z-30 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/60"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-lg mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => router.push("/messages")}
              className="p-1.5 -ml-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title="Back to inbox"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <Link
              href={`/profile/${otherUser.username}`}
              className="flex items-center gap-2 min-w-0 group"
            >
              <div
                className={`w-8.5 h-8.5 rounded-full overflow-hidden shrink-0 ${
                  otherUser.hasActiveStory
                    ? "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-[#09090b] ring-violet"
                    : "ring-1 ring-zinc-200 dark:ring-zinc-800"
                }`}
              >
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:underline">
                    {otherUser.displayName}
                  </span>
                  {otherUser.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                    Active now
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Action buttons: Phone, Video, Info */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Voice Call Button */}
            <button
              type="button"
              onClick={() => setIsVoiceCallOpen(true)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Voice call"
            >
              <Phone className="w-4.5 h-4.5" />
            </button>

            {/* Video Call Button */}
            <button
              type="button"
              onClick={() => setIsVideoCallOpen(true)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Video call"
            >
              <Video className="w-4.5 h-4.5" />
            </button>

            {/* Conversation Info / Details Button */}
            <button
              type="button"
              onClick={() => setIsInfoDrawerOpen(true)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Conversation details"
            >
              <Info className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Messages Area ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="max-w-lg mx-auto space-y-1">
          {/* Recipient Profile Banner */}
          <div className="flex flex-col items-center py-6 mb-3">
            <div
              className={`w-18 h-18 rounded-full overflow-hidden mb-2 ${
                otherUser.hasActiveStory
                  ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#09090b] ring-violet"
                  : "ring-1 ring-zinc-200 dark:ring-zinc-800"
              }`}
            >
              <img
                src={otherUser.avatarUrl}
                alt={otherUser.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1">
              <p className="text-base font-bold text-zinc-900 dark:text-white">
                {otherUser.displayName}
              </p>
              {otherUser.isVerified && (
                <ShieldCheck className="w-4 h-4 text-cyan" />
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              @{otherUser.username} · Weca Explorer
            </p>
            <Link
              href={`/profile/${otherUser.username}`}
              className="mt-2.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              View profile
            </Link>
          </div>

          {/* Grouped Messages */}
          {groupedMessages.map((group, gi) => (
            <div key={gi}>
              {/* Date Separator */}
              <div className="flex items-center justify-center py-3">
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 tracking-wider">
                  {formatDateSeparator(group.date)}
                </span>
              </div>

              {/* Message List */}
              {group.messages.map((msg, mi) => {
                const isSelf = msg.senderId === SELF_ID;
                const isLast =
                  mi === group.messages.length - 1 ||
                  group.messages[mi + 1]?.senderId !== msg.senderId;
                const isPlaying = playingVoiceMsgId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end ${
                      isSelf ? "justify-end" : "justify-start"
                    } ${isLast ? "mb-2" : "mb-0.5"} group relative`}
                  >
                    {/* Recipient avatar for incoming */}
                    {!isSelf && isLast && (
                      <div className="w-6 h-6 rounded-full overflow-hidden mr-1.5 mb-1 shrink-0">
                        <img
                          src={otherUser.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {!isSelf && !isLast && <div className="w-6 mr-1.5 shrink-0" />}

                    {/* Bubble Content Container */}
                    <div className="max-w-[75%] sm:max-w-[65%] relative">
                      {/* 1. TEXT MESSAGE */}
                      {msg.type === "text" && msg.text && (
                        <div
                          onDoubleClick={() => handleToggleReaction(msg.id, "❤️")}
                          className={`px-3.5 py-2 text-[13px] leading-relaxed select-text ${
                            isSelf
                              ? `${themeClasses} rounded-2xl rounded-br-md`
                              : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-bl-md"
                          }`}
                        >
                          {msg.text}
                        </div>
                      )}

                      {/* 2. IMAGE MESSAGE */}
                      {msg.type === "image" && msg.imageUrl && (
                        <div
                          onDoubleClick={() => handleToggleReaction(msg.id, "❤️")}
                          className={`rounded-2xl overflow-hidden border ${
                            isSelf
                              ? "border-violet/30 rounded-br-md"
                              : "border-zinc-200 dark:border-zinc-700 rounded-bl-md"
                          }`}
                        >
                          <img
                            src={msg.imageUrl}
                            alt="Shared photo"
                            className="w-52 h-52 sm:w-64 sm:h-64 object-cover"
                          />
                        </div>
                      )}

                      {/* 3. SHARED REEL / POST MESSAGE */}
                      {(msg.type === "shared_reel" || msg.type === "shared_post") &&
                        msg.sharedPost && (
                          <div className="relative group/reel">
                            <div
                              className={`rounded-2xl overflow-hidden border ${
                                isSelf
                                  ? "border-violet/30 rounded-br-md"
                                  : "border-zinc-200 dark:border-zinc-700 rounded-bl-md"
                              } bg-black text-white`}
                            >
                              <div className="relative aspect-9/14 sm:w-56 overflow-hidden">
                                <img
                                  src={msg.sharedPost.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center shadow-lg">
                                    <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                                  </div>
                                </div>
                                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md">
                                  <span className="text-[10px] font-mono font-bold">
                                    @{msg.sharedPost.username}
                                  </span>
                                </div>
                              </div>

                              {msg.sharedPost.caption && (
                                <div className="px-3 py-2 bg-zinc-900">
                                  <p className="text-[11px] text-zinc-300 line-clamp-2">
                                    {msg.sharedPost.caption}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => showToast("Shared reel to your story ✨")}
                                className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                                title="Share reel"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => showToast("Opening reel remix studio ✂️")}
                                className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                                title="Remix reel"
                              >
                                <Scissors className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                      {/* 4. VOICE NOTE MESSAGE */}
                      {msg.type === "voice" && (
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl ${
                            isSelf
                              ? `${themeClasses} rounded-br-md`
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md"
                          } flex items-center gap-3 w-56 sm:w-64 shadow-xs`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setPlayingVoiceMsgId(isPlaying ? null : msg.id)
                            }
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isSelf ? "bg-white text-violet" : "bg-violet text-white"
                            } transition-transform active:scale-90 cursor-pointer`}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current translate-x-0.5" />
                            )}
                          </button>

                          <div className="flex-1 flex items-center gap-0.5 h-6">
                            {[30, 65, 40, 80, 50, 95, 70, 45, 85, 60, 40, 75, 55, 90, 35].map(
                              (height, idx) => (
                                <div
                                  key={idx}
                                  className={`w-1 rounded-full transition-all ${
                                    isSelf ? "bg-white" : "bg-violet"
                                  }`}
                                  style={{
                                    height: `${height}%`,
                                    opacity:
                                      isPlaying && (idx / 15) * 100 <= voiceProgress
                                        ? 1
                                        : 0.4,
                                  }}
                                />
                              )
                            )}
                          </div>

                          <span className="text-[11px] font-mono shrink-0 opacity-80">
                            0:{msg.voiceDuration || 14}
                          </span>
                        </div>
                      )}

                      {/* 5. GPS COORDINATES MESSAGE */}
                      {msg.type === "coordinates" && msg.coordinates && (
                        <div
                          className={`p-3 rounded-2xl border ${
                            isSelf
                              ? "border-violet/30 bg-violet/5 rounded-br-md"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-bl-md"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5 text-violet dark:text-violet">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs font-bold">Anomaly Coordinates</span>
                          </div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                            {msg.coordinates.locationName}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {msg.coordinates.lat}° N, {msg.coordinates.lng}° E
                          </p>
                          <Link
                            href="/map"
                            className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet text-white text-[11px] font-semibold hover:opacity-90 transition-opacity"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>View on Radar Map</span>
                          </Link>
                        </div>
                      )}

                      {/* 6. BATTLE CHALLENGE MESSAGE */}
                      {msg.type === "battle_invite" && msg.battleInvite && (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-fuchsia-500/10 via-violet/10 to-amber-500/10 border border-fuchsia-500/30 w-64 shadow-md">
                          <div className="flex items-center gap-2 mb-1.5 text-fuchsia-600 dark:text-fuchsia-400">
                            <Swords className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Versus Challenge
                            </span>
                          </div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">
                            {msg.battleInvite.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Category: {msg.battleInvite.category}
                          </p>

                          <div className="mt-3 flex items-center gap-2">
                            {msg.battleInvite.status === "accepted" ? (
                              <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-500 text-xs font-bold">
                                Challenge Accepted ✓
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  updateBattleInviteStatus(msg.id, "accepted");
                                  setMessages(getMessages(conversationId));
                                  showToast("Accepted challenge! Entering Versus Arena...");
                                  setTimeout(() => router.push("/versus"), 800);
                                }}
                                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer text-center"
                              >
                                Accept Challenge
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 7. CALL LOG MESSAGE */}
                      {msg.type === "call_log" && msg.callInfo && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-xs font-mono">
                          {msg.callInfo.type === "video" ? (
                            <Video className="w-3.5 h-3.5 text-violet" />
                          ) : (
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span>
                            {msg.callInfo.type === "video" ? "Video" : "Voice"} call ended (
                            {msg.callInfo.durationSeconds}s)
                          </span>
                        </div>
                      )}

                      {/* REACTION BADGES */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div
                          className={`absolute -bottom-2 ${
                            isSelf ? "right-2" : "left-2"
                          } px-1.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs flex items-center gap-0.5 text-[11px]`}
                        >
                          {Object.values(msg.reactions).map((emoji, idx) => (
                            <span key={idx}>{emoji}</span>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      {isLast && (
                        <p
                          className={`text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-mono ${
                            isSelf ? "text-right" : "text-left"
                          }`}
                        >
                          {formatChatTimestamp(msg.timestamp)}
                        </p>
                      )}
                    </div>

                    {/* Quick Reaction Button (Hover/Tap) */}
                    <button
                      type="button"
                      onClick={() =>
                        setReactionMsgId(reactionMsgId === msg.id ? null : msg.id)
                      }
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-opacity cursor-pointer ${
                        isSelf ? "order-first mr-1" : "ml-1"
                      }`}
                      title="React with emoji"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>

                    {/* Emoji Reaction Floating Popover */}
                    {reactionMsgId === msg.id && (
                      <div
                        className={`absolute bottom-full mb-1 z-40 flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl animate-in zoom-in-95 ${
                          isSelf ? "right-0" : "left-0"
                        }`}
                      >
                        {EMOJI_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="p-1 hover:scale-125 transition-transform text-sm cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── Composer Bar ─── */}
      <div
        className="sticky bottom-0 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800/60 z-20"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 8px), 8px)",
        }}
      >
        {/* Voice Note Recording State */}
        {isRecordingVoice ? (
          <div className="max-w-lg mx-auto px-3 py-2 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                Recording audio: 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecordingVoice(false)}
                className="p-2 rounded-full text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Cancel recording"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              <button
                type="button"
                onClick={handleFinishVoiceRecord}
                className="px-4 py-2 rounded-full bg-violet text-white text-xs font-bold hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto px-3 py-2 flex items-center gap-2">
            {/* Camera Snap Button (Only Camera System: Click & Send) */}
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="p-2.5 rounded-full bg-gradient-to-tr from-violet to-cyan text-white shadow-sm shrink-0 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              title="Open camera to snap photo"
            >
              <Camera className="w-4.5 h-4.5" />
            </button>

            {/* Input Field Container */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                className="w-full pl-4 pr-24 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 font-sans focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {inputText.trim() ? (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className="p-1.5 rounded-full text-violet hover:text-violet/80 transition-colors cursor-pointer disabled:opacity-50"
                    title="Send message"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                ) : (
                  <>
                    {/* Voice Note / Mic Button */}
                    <button
                      type="button"
                      onClick={() => setIsRecordingVoice(true)}
                      className="p-1.5 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-violet transition-colors cursor-pointer"
                      title="Record voice note"
                    >
                      <Mic className="w-4.5 h-4.5" />
                    </button>

                    {/* Stickers & Emojis */}
                    <button
                      type="button"
                      onClick={() => setIsStickerDrawerOpen((s) => !s)}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                        isStickerDrawerOpen
                          ? "text-violet"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                      title="Emoji & Stickers"
                    >
                      <Smile className="w-4.5 h-4.5" />
                    </button>

                    {/* Plus Actions Button (Contains "Photos & Files", GPS, Battle, Scan) */}
                    <button
                      type="button"
                      onClick={() => setIsPlusMenuOpen((p) => !p)}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                        isPlusMenuOpen
                          ? "text-violet"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                      title="More actions: Photos & Files, GPS, Battle"
                    >
                      <Plus className="w-4.5 h-4.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Plus Action Sheet (Option 2: Photos/Files from Library/Storage) ─── */}
        {isPlusMenuOpen && (
          <div className="max-w-lg mx-auto px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/60 grid grid-cols-3 gap-2.5 animate-in fade-in">
            {/* 1. Share from Photos & Files */}
            <button
              type="button"
              onClick={() => {
                setIsPlusMenuOpen(false);
                fileUploadInputRef.current?.click();
              }}
              className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 hover:bg-emerald-500/10 hover:text-emerald-500 flex flex-col items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <FolderOpen className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-center leading-tight">
                Photos / Files
              </span>
            </button>

            {/* 2. Share GPS Coordinates */}
            <button
              type="button"
              onClick={() => {
                setIsPlusMenuOpen(false);
                handleSendCoordinates();
              }}
              className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 hover:bg-violet/10 hover:text-violet flex flex-col items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <MapPin className="w-5 h-5 text-violet group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-center leading-tight">
                Share GPS
              </span>
            </button>

            {/* 3. Versus Battle Challenge */}
            <button
              type="button"
              onClick={() => {
                setIsPlusMenuOpen(false);
                handleSendBattleInvite();
              }}
              className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 hover:bg-fuchsia-500/10 hover:text-fuchsia-500 flex flex-col items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <Swords className="w-5 h-5 text-fuchsia-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-center leading-tight">
                Versus Battle
              </span>
            </button>
          </div>
        )}

        {/* ─── Sticker & Emoji Popover ─── */}
        {isStickerDrawerOpen && (
          <div className="max-w-lg mx-auto px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/60 animate-in fade-in">
            <p className="text-[10px] font-mono text-zinc-400 mb-2">QUICK EMOJIS & STICKERS</p>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {["😂", "❤️", "🔥", "🛸", "😮", "👏", "💯", "✨", "👾", "🌌", "🌿", "⚡"].map(
                (emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((t) => t + emoji);
                      inputRef.current?.focus();
                    }}
                    className="text-xl hover:scale-125 transition-transform p-1 cursor-pointer"
                  >
                    {emoji}
                  </button>
                )
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
              {WECA_STICKERS.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => handleSendSticker(stk)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-left text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="text-base">{stk.icon}</span>
                  <span className="truncate text-[11px]">{stk.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── VOICE CALL MODAL ─── */}
      {isVoiceCallOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-8 text-white animate-in fade-in">
          <div className="text-center mt-10">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-cyan mb-2">
              <Phone className="w-3.5 h-3.5 animate-pulse" />
              <span>WECA SECURE VOICE LINK</span>
            </div>
            <h3 className="text-2xl font-bold">{otherUser.displayName}</h3>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              0:{callDuration < 10 ? `0${callDuration}` : callDuration}
            </p>
          </div>

          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-cyan/40 shadow-2xl relative z-10">
              <img
                src={otherUser.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-cyan/20 animate-ping" />
            <div className="absolute -inset-4 rounded-full bg-violet/10 animate-pulse" />
          </div>

          <div className="flex items-center gap-6 mb-12">
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className={`p-4 rounded-full transition-colors cursor-pointer ${
                isMuted ? "bg-red-500 text-white" : "bg-white/20 hover:bg-white/30"
              }`}
              title="Toggle mute"
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              type="button"
              onClick={handleEndVoiceCall}
              className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="End call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            <button
              type="button"
              onClick={() => setIsSpeakerOn((s) => !s)}
              className={`p-4 rounded-full transition-colors cursor-pointer ${
                isSpeakerOn ? "bg-white text-zinc-950" : "bg-white/20 hover:bg-white/30"
              }`}
              title="Toggle speaker"
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )}

      {/* ─── VIDEO CALL MODAL ─── */}
      {isVideoCallOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white animate-in fade-in">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src="/anom-3.jpg"
              alt="Remote feed"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
          </div>

          <div className="relative z-10 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/40">
                <img
                  src={otherUser.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold">{otherUser.displayName}</h4>
                <p className="text-[10px] font-mono text-cyan">
                  Live 0:{callDuration < 10 ? `0${callDuration}` : callDuration}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute top-6 right-6 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl z-10 bg-zinc-900">
            <img
              src={currentAvatarUrl}
              alt="Self preview"
              className={`w-full h-full object-cover ${
                isCameraFlipped ? "-scale-x-100" : ""
              }`}
            />
            <span className="absolute bottom-1 right-2 text-[9px] font-mono bg-black/60 px-1 rounded-xs">
              You
            </span>
          </div>

          <div className="relative z-10 p-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => setIsCameraFlipped((f) => !f)}
              className="p-3.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md cursor-pointer"
              title="Flip camera"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsVideoMuted((v) => !v)}
              className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                isVideoMuted ? "bg-red-500 text-white" : "bg-white/20 hover:bg-white/30"
              }`}
              title="Toggle camera"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleEndVideoCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="End video call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                isMuted ? "bg-red-500 text-white" : "bg-white/20 hover:bg-white/30"
              }`}
              title="Toggle mic"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* ─── CONVERSATION INFO DRAWER ─── */}
      {isInfoDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-white dark:bg-[#09090b] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Details
              </h3>
              <button
                type="button"
                onClick={() => setIsInfoDrawerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <img
                  src={otherUser.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover mb-2 ring-2 ring-violet"
                />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {otherUser.displayName}
                </h4>
                <p className="text-xs text-zinc-500 font-mono">@{otherUser.username}</p>
                <Link
                  href={`/profile/${otherUser.username}`}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200"
                >
                  View Profile
                </Link>
              </div>

              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-violet" />
                  <span>Theme Color</span>
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "violet", label: "Violet", bg: "bg-violet" },
                    { id: "cyan", label: "Cyan", bg: "bg-cyan-500" },
                    { id: "neon", label: "Neon", bg: "bg-gradient-to-r from-fuchsia-500 to-pink-500" },
                    { id: "rose", label: "Rose", bg: "bg-rose-500" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleChangeTheme(t.id as any)}
                      className={`h-10 rounded-xl ${t.bg} flex items-center justify-center text-white text-[10px] font-bold cursor-pointer ring-2 ${
                        activeTheme === t.id ? "ring-offset-2 ring-violet" : "ring-transparent"
                      }`}
                    >
                      {activeTheme === t.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Preferences
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const muted = toggleMuteConversation(conversationId);
                    showToast(muted ? "Messages muted" : "Messages unmuted");
                  }}
                  className="w-full flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 py-1"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-zinc-400" />
                    Mute messages
                  </span>
                  <span className="text-violet font-semibold">Toggle</span>
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white mb-2">
                  Shared Media
                </p>
                {(() => {
                  const sharedImages = messages
                    .filter((m) => m.type === "image" && m.imageUrl)
                    .map((m) => m.imageUrl!);
                  if (sharedImages.length === 0) {
                    return (
                      <p className="text-xs text-zinc-400 font-mono py-2">
                        No shared photos yet.
                      </p>
                    );
                  }
                  return (
                    <div className="grid grid-cols-3 gap-1.5">
                      {sharedImages.map((src, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800"
                        >
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Clear Chat History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Blocked @${otherUser.username}`);
                    setIsInfoDrawerOpen(false);
                  }}
                  className="w-full py-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Block Explorer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REAL CAMERA SYSTEM MODAL (Click & Send) ─── */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCaptureAndSend={handleSendCameraPhoto}
        recipientName={otherUser.displayName}
      />
    </div>
  );
};
