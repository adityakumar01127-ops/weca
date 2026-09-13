"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PenSquare,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  Camera,
  CheckCheck,
  X,
  Plus,
  Music,
  Pin,
  Send,
  UserCheck,
  UserX,
  Volume2,
  Search,
  MessageCircle,
} from "lucide-react";
import {
  getConversations,
  getConversationByUsername,
  createConversation,
  getOtherParticipant,
  formatMessageTime,
  getNotes,
  saveSelfNote,
  deleteSelfNote,
  acceptRequest,
  declineRequest,
  togglePinConversation,
  markAllAsRead,
  getAvailableUsers,
  sendMessage,
  UserNote,
  Conversation,
  ConversationParticipant,
  DEMO_PARTICIPANTS,
} from "@/lib/messages";
import { CameraCaptureModal } from "@/components/messages/CameraCaptureModal";
import { useAuth } from "@/context/AuthContext";
import { getRegisteredSpotters } from "@/lib/supabase/data";

type TabType = "primary" | "requests" | "general";

export const MessagesInbox: React.FC = () => {
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentUserId = user?.id || profile?.id || DEMO_PARTICIPANTS.self.id;
  const currentAvatarUrl =
    profile?.avatar_url ||
    (profile?.username
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`
      : "https://api.dicebear.com/7.x/bottts/svg?seed=explorer");
  const currentDisplayName = profile?.display_name || profile?.username || "You";

  // State
  const [activeTab, setActiveTab] = useState<TabType>("primary");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [activeNoteToView, setActiveNoteToView] = useState<UserNote | null>(null);
  const [noteReplyText, setNoteReplyText] = useState("");
  const [isSendingNoteReply, setIsSendingNoteReply] = useState(false);

  // Note creation state
  const [noteText, setNoteText] = useState("");
  const [noteMusicTitle, setNoteMusicTitle] = useState("");
  const [noteMusicArtist, setNoteMusicArtist] = useState("");
  const [noteEmoji, setNoteEmoji] = useState("✨");

  // Camera snap recipient (opens dedicated CameraCaptureModal)
  const [cameraRecipient, setCameraRecipient] = useState<ConversationParticipant | null>(null);

  // Force re-render on data change
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle ?user= query param safely
  // Directly keeps user on message inbox and ensures the conversation is created/ready at top
  useEffect(() => {
    const targetUser = searchParams.get("user");
    if (targetUser && targetUser !== "user" && targetUser !== "weca_explorer") {
      const existing = getConversationByUsername(targetUser);
      if (!existing) {
        createConversation({
          id: `u-${targetUser.toLowerCase()}`,
          username: targetUser,
          displayName: targetUser,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser}`,
        });
      }
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/messages");
      }
      refresh();
      showToast(`Conversation with @${targetUser} ready in inbox`);
    } else if (targetUser) {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/messages");
      }
    }
  }, [searchParams]);

  // Load conversations & notes
  const conversations = useMemo(() => getConversations(), [tick]);
  const notes = useMemo(() => getNotes(), [tick]);
  const [availableUsers, setAvailableUsers] = useState<ConversationParticipant[]>([]);

  useEffect(() => {
    getRegisteredSpotters(50).then((profiles) => {
      const participants: ConversationParticipant[] = profiles
        .filter((p) => p.id !== currentUserId)
        .map((p) => ({
          id: p.id,
          username: p.username || "explorer",
          displayName: p.display_name || p.username || "Explorer",
          avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.username || "explorer"}`,
          isVerified: (p.credits_balance ?? 0) >= 500 || Boolean(p.is_admin),
        }));
      setAvailableUsers(participants);
    });
  }, [currentUserId]);

  // Search filter for Accounts
  const searchedAccounts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return availableUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(q) ||
        user.displayName.toLowerCase().includes(q)
    );
  }, [searchQuery, availableUsers]);

  // Search filter for Conversations
  const searchedConversations = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((conv) => {
      const other = getOtherParticipant(conv, currentUserId);
      const matchesUser =
        other.username.toLowerCase().includes(q) ||
        other.displayName.toLowerCase().includes(q);
      const matchesMsg = conv.lastMessage?.text?.toLowerCase().includes(q);
      return matchesUser || matchesMsg;
    });
  }, [searchQuery, conversations, currentUserId]);

  const selfNote = useMemo(
    () => notes.find((n) => n.isSelf || n.userId === currentUserId),
    [notes, currentUserId]
  );
  const otherNotes = useMemo(
    () => notes.filter((n) => !n.isSelf && n.userId !== currentUserId),
    [notes, currentUserId]
  );

  const primaryConversations = useMemo(
    () => conversations.filter((c) => !c.isRequest && (c.category === "primary" || !c.category)),
    [conversations]
  );
  const requestConversations = useMemo(
    () => conversations.filter((c) => c.isRequest),
    [conversations]
  );
  const generalConversations = useMemo(
    () => conversations.filter((c) => !c.isRequest && c.category === "general"),
    [conversations]
  );

  const totalUnread = useMemo(
    () => primaryConversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [primaryConversations]
  );
  const requestCount = requestConversations.length;

  // Filtered list
  const displayedConversations = useMemo(() => {
    let list: Conversation[] = [];
    if (activeTab === "primary") list = primaryConversations;
    else if (activeTab === "requests") list = requestConversations;
    else if (activeTab === "general") list = generalConversations;

    // Sort: pinned first, then by updatedAt
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [activeTab, primaryConversations, requestConversations, generalConversations]);

  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.lastMessage) return "Start a conversation";
    const msg = conv.lastMessage;
    const isSelf = msg.senderId === "00000000-0000-0000-0000-000000000001";
    const prefix = isSelf ? "You: " : "";

    switch (msg.type) {
      case "image":
        return `${prefix}Sent a photo`;
      case "shared_post":
        return `${prefix}Sent an anomaly by @${msg.sharedPost?.username || "unknown"}`;
      case "shared_reel":
        return `${prefix}Sent a reel by @${msg.sharedPost?.username || "unknown"}`;
      case "voice":
        return `${prefix}Voice message (${msg.voiceDuration || 12}s)`;
      case "coordinates":
        return `${prefix}Shared coordinates 📍`;
      case "battle_invite":
        return `${prefix}Challenged to a battle ⚔️`;
      case "call_log":
        return `${prefix}${msg.callInfo?.type === "video" ? "Video" : "Voice"} call (${msg.callInfo?.durationSeconds || 0}s)`;
      default:
        return `${prefix}${msg.text || ""}`;
    }
  };

  // Actions
  const handleMarkAllRead = () => {
    markAllAsRead();
    refresh();
    showToast("All conversations marked as read");
  };

  const handleTogglePin = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isPinned = togglePinConversation(convId);
    refresh();
    showToast(isPinned ? "Conversation pinned 📌" : "Conversation unpinned");
  };

  const handleAcceptRequest = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    acceptRequest(convId);
    refresh();
    showToast("Message request accepted");
  };

  const handleDeclineRequest = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    declineRequest(convId);
    refresh();
    showToast("Message request deleted");
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    saveSelfNote(noteText, noteMusicTitle, noteMusicArtist, noteEmoji);
    setIsCreateNoteOpen(false);
    setNoteText("");
    setNoteMusicTitle("");
    setNoteMusicArtist("");
    refresh();
    showToast("Your note has been posted!");
  };

  const handleDeleteSelfNote = () => {
    deleteSelfNote();
    setIsCreateNoteOpen(false);
    refresh();
    showToast("Your note has been removed");
  };

  const handleSendNoteReply = () => {
    if (!activeNoteToView || !noteReplyText.trim()) return;
    setIsSendingNoteReply(true);

    const participant: ConversationParticipant = {
      id: activeNoteToView.userId,
      username: activeNoteToView.username,
      displayName: activeNoteToView.displayName,
      avatarUrl: activeNoteToView.avatarUrl,
    };
    const conv = createConversation(participant);

    sendMessage(
      conv.id,
      "00000000-0000-0000-0000-000000000001",
      `Replied to your note "${activeNoteToView.text}": ${noteReplyText.trim()}`
    );

    setTimeout(() => {
      setIsSendingNoteReply(false);
      setActiveNoteToView(null);
      setNoteReplyText("");
      router.push(`/messages/${conv.id}`);
    }, 400);
  };

  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-white dark:bg-[#09090b] relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/90 dark:bg-white/90 text-white dark:text-zinc-900 text-xs font-medium backdrop-blur-md shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* ─── Header ─── */}
      <div
        className="sticky top-0 z-30 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/60"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="p-1.5 -ml-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Back to profile"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            {/* Username */}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 text-base font-bold text-zinc-900 dark:text-white font-sans tracking-tight hover:opacity-80 transition-opacity"
              title="View your profile"
            >
              <span>mr_adityakaushik</span>
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {/* Mark All Read Button */}
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-violet hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="w-5 h-5" />
            </button>

            {/* Compose Button */}
            <button
              type="button"
              onClick={() => setIsComposeOpen(true)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Compose new message"
            >
              <PenSquare className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Search Bar ─── */}
        <div className="max-w-lg mx-auto px-4 pb-2.5 pt-0.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              id="message-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts & messages..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200/60 dark:border-zinc-700/60 focus:border-violet dark:focus:border-violet outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                id="clear-message-search-btn"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ─── Notes Bar & Tabs (Visible when not actively searching) ─── */}
        {!searchQuery.trim() && (
          <>
            {/* ─── Notes Bar (Instagram Style from reference image) ─── */}
            <div className="max-w-lg mx-auto px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/40">
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                {/* Self Note Bubble */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative mb-1">
                    {/* Note Bubble */}
                    <button
                      type="button"
                      onClick={() => setIsCreateNoteOpen(true)}
                      className="max-w-[85px] px-2.5 py-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300 font-medium shadow-xs border border-zinc-200 dark:border-zinc-700/60 truncate cursor-pointer hover:scale-105 active:scale-95 transition-all text-center block"
                      title="Edit your note"
                    >
                      {selfNote ? selfNote.text : "Share a thought..."}
                    </button>
                    {/* Tail pointer */}
                    <div className="w-1.5 h-1.5 bg-zinc-100 dark:bg-zinc-800 border-r border-b border-zinc-200 dark:border-zinc-700/60 rotate-45 mx-auto -mt-1" />

                    {/* Avatar with + icon */}
                    <div
                      onClick={() => setIsCreateNoteOpen(true)}
                      className="w-14 h-14 rounded-full overflow-hidden mt-1 relative cursor-pointer group ring-2 ring-zinc-200 dark:ring-zinc-800"
                    >
                      <img
                        src={currentAvatarUrl}
                        alt="Your avatar"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-violet text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-[#09090b]">
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[70px]">
                    Your note
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                    Location off
                  </span>
                </div>

                {/* Other Explorers' Notes */}
                {otherNotes.map((note) => (
                  <div key={note.id} className="flex flex-col items-center shrink-0">
                    <div className="relative mb-1">
                      {/* Note Bubble with Music Icon */}
                      <button
                        type="button"
                        onClick={() => setActiveNoteToView(note)}
                        className="max-w-[90px] px-2 py-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-200 font-medium shadow-xs border border-zinc-200 dark:border-zinc-700/60 truncate cursor-pointer hover:scale-105 active:scale-95 transition-all text-center flex items-center gap-1 justify-center"
                        title={`View ${note.displayName}'s note`}
                      >
                        {note.music && (
                          <Volume2 className="w-2.5 h-2.5 text-violet shrink-0 animate-pulse" />
                        )}
                        <span className="truncate">{note.text}</span>
                      </button>
                      {/* Tail pointer */}
                      <div className="w-1.5 h-1.5 bg-zinc-100 dark:bg-zinc-800 border-r border-b border-zinc-200 dark:border-zinc-700/60 rotate-45 mx-auto -mt-1" />

                      {/* Avatar with Story Ring */}
                      <div
                        onClick={() => setActiveNoteToView(note)}
                        className="w-14 h-14 rounded-full overflow-hidden mt-1 cursor-pointer ring-2 ring-violet ring-offset-2 ring-offset-white dark:ring-offset-[#09090b] hover:scale-105 transition-transform"
                      >
                        <img
                          src={note.avatarUrl}
                          alt={note.displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[75px] text-center">
                      {note.displayName}
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-[70px]">
                      {note.music?.title || "Active"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Tabs ─── */}
            <div className="max-w-lg mx-auto px-4 pb-2 pt-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("primary")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "primary"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  Primary
                  {totalUnread > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet text-white">
                      {totalUnread}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("requests")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "requests"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  Requests
                  {requestCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white">
                      {requestCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "general"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  General
                  {generalConversations.length > 0 && (
                    <span className="ml-1.5 text-[10px] text-zinc-400">
                      ({generalConversations.length})
                    </span>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Conversation List or Search Results ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          {searchQuery.trim() ? (
            /* ─── Live Search View (Accounts & Chats) ─── */
            <div className="py-2">
              {/* Accounts Section */}
              {searchedAccounts.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <span>Accounts</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {searchedAccounts.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {searchedAccounts.map((account) => (
                      <li
                        key={account.id}
                        id={`search-account-${account.username}`}
                        onClick={() => {
                          const conv = createConversation(account);
                          router.push(`/messages/${conv.id}`);
                        }}
                        className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-800 group-hover:scale-105 transition-transform">
                            <img
                              src={account.avatarUrl}
                              alt={account.displayName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                {account.displayName}
                              </span>
                              {account.isVerified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-cyan shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono block">
                              @{account.username}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          id={`message-account-btn-${account.username}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const conv = createConversation(account);
                            router.push(`/messages/${conv.id}`);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0 ml-2 shadow-xs cursor-pointer active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Message</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conversations Section */}
              {searchedConversations.length > 0 && (
                <div>
                  <div className="px-4 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <span>Conversations</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {searchedConversations.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {searchedConversations.map((conv) => {
                      const other = getOtherParticipant(conv, currentUserId);
                      const preview = getLastMessagePreview(conv);
                      const timeStr = conv.lastMessage
                        ? formatMessageTime(conv.lastMessage.timestamp)
                        : "";
                      return (
                        <li
                          key={conv.id}
                          onClick={() => router.push(`/messages/${conv.id}`)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-800">
                            <img
                              src={other.avatarUrl}
                              alt={other.displayName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                {other.displayName}
                              </span>
                              {timeStr && (
                                <span className="text-[11px] text-zinc-400 font-mono shrink-0 ml-2">
                                  {timeStr}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate block mt-0.5">
                              {preview}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* No Search Results */}
              {searchedAccounts.length === 0 && searchedConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-3 text-zinc-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    No accounts or messages found
                  </p>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1">
                    Couldn&apos;t find any explorer accounts matching &ldquo;{searchQuery}&rdquo;.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      Clear search
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsComposeOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-violet text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      New message
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : displayedConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                <Camera className="w-7 h-7 text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {activeTab === "requests"
                  ? "No message requests"
                  : "No messages yet"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 max-w-xs">
                {activeTab === "requests"
                  ? "Message requests from explorers will appear here."
                  : "Start a conversation by tapping the compose button or exploring the network."}
              </p>
              {activeTab !== "requests" && (
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-violet text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Send a message
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {displayedConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const preview = getLastMessagePreview(conv);
                const timeStr = conv.lastMessage
                  ? formatMessageTime(conv.lastMessage.timestamp)
                  : "";
                const hasUnread = conv.unreadCount > 0;

                return (
                  <li key={conv.id} className="relative group">
                    <div
                      onClick={() => router.push(`/messages/${conv.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer text-left active:bg-zinc-100 dark:active:bg-zinc-800/60"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-13 h-13 rounded-full overflow-hidden ${
                            other.hasActiveStory
                              ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#09090b] ring-gradient-to-tr from-violet to-fuchsia-500 ring-violet"
                              : "ring-1 ring-zinc-200 dark:ring-zinc-800"
                          }`}
                        >
                          <img
                            src={other.avatarUrl}
                            alt={other.displayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Name + Message Preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-sm truncate ${
                                hasUnread
                                  ? "font-bold text-zinc-900 dark:text-white"
                                  : "font-medium text-zinc-800 dark:text-zinc-200"
                              }`}
                            >
                              {other.displayName}
                            </span>
                            {other.isVerified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-cyan shrink-0" />
                            )}
                            {conv.isPinned && (
                              <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                          {timeStr && (
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 font-mono ml-2">
                              {timeStr}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-0.5">
                          <span
                            className={`text-xs truncate max-w-[240px] sm:max-w-[320px] ${
                              hasUnread
                                ? "font-semibold text-zinc-900 dark:text-white"
                                : "text-zinc-500 dark:text-zinc-400"
                            }`}
                          >
                            {preview}
                          </span>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {/* Unread dot */}
                            {hasUnread && (
                              <div className="w-2.5 h-2.5 rounded-full bg-violet shrink-0" />
                            )}

                            {/* Camera quick reply button (Dedicated live camera snap) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCameraRecipient(other);
                              }}
                              className="p-1 rounded-md text-zinc-400 hover:text-violet transition-colors cursor-pointer"
                              title={`Snap photo to ${other.displayName}`}
                            >
                              <Camera className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>

                        {/* Direct Accept / Decline Buttons for Requests Tab */}
                        {activeTab === "requests" && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={(e) => handleAcceptRequest(conv.id, e)}
                              className="px-3 py-1 rounded-lg bg-violet text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeclineRequest(conv.id, e)}
                              className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ─── Compose New Message Modal ─── */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#09090b] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                New Message
              </h2>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* User List */}
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                Suggested Explorers
              </p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-2">
              {availableUsers.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-zinc-400 dark:text-zinc-500">
                  No other registered spotters found yet.
                </div>
              ) : (
                availableUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setIsComposeOpen(false);
                      const conv = createConversation(user);
                      router.push(`/messages/${conv.id}`);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                          {user.displayName}
                        </span>
                        {user.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">@{user.username}</p>
                    </div>
                    <span className="text-xs text-violet font-semibold">Chat →</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Create / Edit Note Modal ─── */}
      {isCreateNoteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#09090b] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {selfNote ? "Edit your note" : "Share a thought"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateNoteOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note Preview Bubble */}
            <div className="flex flex-col items-center mb-5">
              <div className="px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs border border-zinc-200 dark:border-zinc-700 text-center max-w-[200px]">
                {noteText.trim() || "Share what's on your mind..."}
              </div>
              <div className="w-2 h-2 bg-zinc-100 dark:bg-zinc-800 border-r border-b border-zinc-200 dark:border-zinc-700 rotate-45 mx-auto -mt-1" />
              <img
                src={currentAvatarUrl}
                alt="Avatar"
                className="w-14 h-14 rounded-full object-cover mt-2 ring-2 ring-violet"
              />
            </div>

            {/* Form Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Thought (max 60 chars)
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="Today's vibe... ✨"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-violet"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Add Song / Audio Track
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Track title (e.g. Starboy)"
                    value={noteMusicTitle}
                    onChange={(e) => setNoteMusicTitle(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-violet"
                  />
                  <input
                    type="text"
                    placeholder="Artist (e.g. The Weeknd)"
                    value={noteMusicArtist}
                    onChange={(e) => setNoteMusicArtist(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-violet"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-5">
              {selfNote && (
                <button
                  type="button"
                  onClick={handleDeleteSelfNote}
                  className="px-3 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsCreateNoteOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                  className="px-4 py-2 rounded-xl bg-violet text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── View & Reply to Note Modal ─── */}
      {activeNoteToView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#09090b] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-zinc-400">Explorer note</span>
              <button
                type="button"
                onClick={() => setActiveNoteToView(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center py-3">
              {/* Animated Note Cloud */}
              <div className="px-4 py-2 rounded-2xl bg-gradient-to-tr from-violet/10 to-fuchsia-500/10 border border-violet/30 text-xs font-bold text-zinc-900 dark:text-white text-center shadow-md">
                {activeNoteToView.text}
              </div>
              <div className="w-2 h-2 bg-violet/20 border-r border-b border-violet/30 rotate-45 mx-auto -mt-1 mb-2" />

              <img
                src={activeNoteToView.avatarUrl}
                alt={activeNoteToView.displayName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-violet ring-offset-2 ring-offset-white dark:ring-offset-[#09090b]"
              />
              <p className="text-sm font-bold text-zinc-900 dark:text-white mt-2">
                {activeNoteToView.displayName}
              </p>
              <p className="text-xs text-zinc-500 font-mono">@{activeNoteToView.username}</p>

              {activeNoteToView.music && (
                <div className="mt-3 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-violet animate-bounce" />
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    {activeNoteToView.music.title} · {activeNoteToView.music.artist}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Reply Input */}
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={`Reply to ${activeNoteToView.displayName}...`}
                  value={noteReplyText}
                  onChange={(e) => setNoteReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendNoteReply();
                  }}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-violet"
                />
                <button
                  type="button"
                  onClick={handleSendNoteReply}
                  disabled={!noteReplyText.trim() || isSendingNoteReply}
                  className="absolute right-2 p-1.5 rounded-full text-violet hover:text-violet/80 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REAL CAMERA SYSTEM MODAL (Click & Send from Inbox) ─── */}
      <CameraCaptureModal
        isOpen={Boolean(cameraRecipient)}
        onClose={() => setCameraRecipient(null)}
        onCaptureAndSend={(photoDataUrl) => {
          if (!cameraRecipient) return;
          const conv = createConversation(cameraRecipient);
          sendMessage(
            conv.id,
            "00000000-0000-0000-0000-000000000001",
            undefined,
            "image",
            photoDataUrl
          );
          refresh();
          showToast(`Photo captured & sent to ${cameraRecipient.displayName}! 📸`);
          setCameraRecipient(null);
        }}
        recipientName={cameraRecipient?.displayName}
      />
    </div>
  );
};
