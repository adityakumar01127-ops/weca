// ==============================================================================
// WECA MESSAGING DATA LAYER
// Types, messaging helpers, notes, and localStorage persistence helpers
// ==============================================================================

export type MessageType =
  | "text"
  | "image"
  | "shared_post"
  | "shared_reel"
  | "voice"
  | "call_log"
  | "coordinates"
  | "battle_invite";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  imageUrl?: string;
  sharedPost?: {
    id: string;
    imageUrl: string;
    caption?: string;
    username: string;
  };
  voiceDuration?: number; // duration in seconds
  callInfo?: {
    type: "voice" | "video";
    durationSeconds: number;
    status: "completed" | "missed";
  };
  coordinates?: {
    lat: number;
    lng: number;
    locationName: string;
  };
  battleInvite?: {
    battleId: string;
    title: string;
    category: string;
    status: "pending" | "accepted" | "declined";
  };
  reactions?: Record<string, string>; // userId -> emoji
  timestamp: string; // ISO string
  read: boolean;
}

export interface ConversationParticipant {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified?: boolean;
  hasActiveStory?: boolean;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isRequest?: boolean;
  isMuted?: boolean;
  theme?: "violet" | "cyan" | "neon" | "rose";
  category?: "primary" | "general";
  updatedAt: string; // ISO string
}

export interface UserNote {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  text: string;
  music?: {
    title: string;
    artist: string;
  };
  emoji?: string;
  createdAt: string;
  isSelf?: boolean;
}

// ==============================================================================
// DEFAULT PARTICIPANT FALLBACK
// ==============================================================================

export const DEFAULT_PARTICIPANT: ConversationParticipant = {
  id: "self",
  username: "explorer",
  displayName: "Explorer",
  avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=explorer",
  isVerified: false,
  hasActiveStory: false,
};

// ==============================================================================
// STORAGE KEYS
// ==============================================================================

const CONVERSATIONS_KEY = "weca_dm_conversations_v2";
const MESSAGES_KEY = "weca_dm_messages_v2";
const NOTES_KEY = "weca_dm_notes_v2";
const SEEDED_KEY = "weca_dm_seeded_v2";

// ==============================================================================
// INITIALIZATION
// ==============================================================================

function ensureSeeded(): void {
  // Empty clean start for production messaging
  return;
}

// ==============================================================================
// PUBLIC API: CONVERSATIONS
// ==============================================================================

export function getConversations(): Conversation[] {
  ensureSeeded();
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CONVERSATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function getConversation(id: string): Conversation | null {
  const convs = getConversations();
  return convs.find((c) => c.id === id) || null;
}

export function getConversationByUsername(username: string): Conversation | null {
  const convs = getConversations();
  return convs.find((c) =>
    c.participants.some(
      (p) =>
        p.username.toLowerCase() === username.toLowerCase() &&
        p.id !== "self"
    )
  ) || null;
}

export function createConversation(
  otherUser: ConversationParticipant,
  currentUser?: Partial<ConversationParticipant>
): Conversation {
  ensureSeeded();
  const selfParticipant: ConversationParticipant = {
    id: currentUser?.id || DEFAULT_PARTICIPANT.id,
    username: currentUser?.username || DEFAULT_PARTICIPANT.username,
    displayName: currentUser?.displayName || DEFAULT_PARTICIPANT.displayName,
    avatarUrl: currentUser?.avatarUrl || DEFAULT_PARTICIPANT.avatarUrl,
    isVerified: currentUser?.isVerified || false,
    hasActiveStory: currentUser?.hasActiveStory || false,
  };
  const convId = `conv-${otherUser.username.replace(/[^a-z0-9_]/gi, "").toLowerCase()}`;

  const existing = getConversation(convId);
  if (existing) return existing;

  const newConv: Conversation = {
    id: convId,
    participants: [selfParticipant, otherUser],
    unreadCount: 0,
    isRequest: false,
    category: "primary",
    theme: "violet",
    updatedAt: new Date().toISOString(),
  };

  const convs = getConversations();
  convs.unshift(newConv);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  notifyMessagesUpdated();

  return newConv;
}

export function togglePinConversation(conversationId: string): boolean {
  const convs = getConversations();
  let newState = false;
  const updated = convs.map((c) => {
    if (c.id === conversationId) {
      newState = !c.isPinned;
      return { ...c, isPinned: newState };
    }
    return c;
  });
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  return newState;
}

export function toggleMuteConversation(conversationId: string): boolean {
  const convs = getConversations();
  let newState = false;
  const updated = convs.map((c) => {
    if (c.id === conversationId) {
      newState = !c.isMuted;
      return { ...c, isMuted: newState };
    }
    return c;
  });
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  return newState;
}

export function setConversationTheme(
  conversationId: string,
  theme: "violet" | "cyan" | "neon" | "rose"
): void {
  const convs = getConversations();
  const updated = convs.map((c) => (c.id === conversationId ? { ...c, theme } : c));
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
}

export function acceptRequest(conversationId: string): void {
  const convs = getConversations();
  const updated = convs.map((c) =>
    c.id === conversationId ? { ...c, isRequest: false, category: "primary" as const } : c
  );
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
}

export function declineRequest(conversationId: string): void {
  deleteConversation(conversationId);
}

export function deleteConversation(conversationId: string): void {
  const convs = getConversations().filter((c) => c.id !== conversationId);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));

  // Also remove its messages
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (raw) {
    const all: Message[] = JSON.parse(raw);
    const filtered = all.filter((m) => m.conversationId !== conversationId);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(filtered));
  }
}

export function clearMessages(conversationId: string): void {
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (raw) {
    const all: Message[] = JSON.parse(raw);
    const filtered = all.filter((m) => m.conversationId !== conversationId);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(filtered));
  }

  const convs = getConversations().map((c) =>
    c.id === conversationId
      ? { ...c, lastMessage: undefined, unreadCount: 0, updatedAt: new Date().toISOString() }
      : c
  );
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
}

export function markAsRead(conversationId: string): void {
  ensureSeeded();
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (raw) {
    const all: Message[] = JSON.parse(raw);
    const updated = all.map((m) =>
      m.conversationId === conversationId ? { ...m, read: true } : m
    );
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  }

  const convs = getConversations();
  const updatedConvs = convs.map((c) =>
    c.id === conversationId ? { ...c, unreadCount: 0 } : c
  );
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updatedConvs));
  notifyMessagesUpdated();
}

export function markAllAsRead(): void {
  ensureSeeded();
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (raw) {
    const all: Message[] = JSON.parse(raw);
    const updated = all.map((m) => ({ ...m, read: true }));
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  }

  const convs = getConversations();
  const updatedConvs = convs.map((c) => ({ ...c, unreadCount: 0 }));
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updatedConvs));
  notifyMessagesUpdated();
}

export function notifyMessagesUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("weca_messages_updated"));
  }
}

export function getTotalUnreadCount(): number {
  const convs = getConversations();
  return convs.reduce((sum, c) => sum + c.unreadCount, 0);
}

export function getAvailableUsers(): ConversationParticipant[] {
  return [];
}

// ==============================================================================
// PUBLIC API: MESSAGES
// ==============================================================================

export function getMessages(conversationId: string): Message[] {
  ensureSeeded();
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (!raw) return [];
  try {
    const all = JSON.parse(raw) as Message[];
    return all
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch {
    return [];
  }
}

export function sendMessage(
  conversationId: string,
  senderId: string,
  text?: string,
  type: MessageType = "text",
  imageUrl?: string,
  extra?: {
    voiceDuration?: number;
    callInfo?: { type: "voice" | "video"; durationSeconds: number; status: "completed" | "missed" };
    coordinates?: { lat: number; lng: number; locationName: string };
    battleInvite?: { battleId: string; title: string; category: string; status: "pending" | "accepted" | "declined" };
  }
): Message {
  ensureSeeded();
  const newMsg: Message = {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    senderId,
    type,
    text: type === "text" ? text : undefined,
    imageUrl: type === "image" ? imageUrl : undefined,
    voiceDuration: extra?.voiceDuration,
    callInfo: extra?.callInfo,
    coordinates: extra?.coordinates,
    battleInvite: extra?.battleInvite,
    timestamp: new Date().toISOString(),
    read: true,
  };

  const raw = localStorage.getItem(MESSAGES_KEY);
  const all: Message[] = raw ? JSON.parse(raw) : [];
  all.push(newMsg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));

  const convs = getConversations();
  const updated = convs.map((c) => {
    if (c.id === conversationId) {
      return { ...c, lastMessage: newMsg, updatedAt: newMsg.timestamp };
    }
    return c;
  });
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  notifyMessagesUpdated();

  return newMsg;
}

export function toggleReaction(
  messageId: string,
  userId: string,
  emoji: string
): Message | null {
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (!raw) return null;
  const all: Message[] = JSON.parse(raw);
  let updatedMsg: Message | null = null;

  const next = all.map((m) => {
    if (m.id === messageId) {
      const reactions = { ...(m.reactions || {}) };
      if (reactions[userId] === emoji) {
        delete reactions[userId];
      } else {
        reactions[userId] = emoji;
      }
      updatedMsg = { ...m, reactions };
      return updatedMsg;
    }
    return m;
  });

  localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
  return updatedMsg;
}

export function updateBattleInviteStatus(
  messageId: string,
  status: "accepted" | "declined"
): void {
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (!raw) return;
  const all: Message[] = JSON.parse(raw);
  const next = all.map((m) => {
    if (m.id === messageId && m.battleInvite) {
      return {
        ...m,
        battleInvite: {
          ...m.battleInvite,
          status,
        },
      };
    }
    return m;
  });
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
}

// ==============================================================================
// PUBLIC API: NOTES
// ==============================================================================

export function getNotes(): UserNote[] {
  ensureSeeded();
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(NOTES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as UserNote[];
  } catch {
    return [];
  }
}

export function saveSelfNote(
  text: string,
  musicTitle?: string,
  musicArtist?: string,
  emoji?: string,
  currentUser?: Partial<ConversationParticipant>
): UserNote {
  ensureSeeded();
  const notes = getNotes();
  const selfUser: ConversationParticipant = {
    id: currentUser?.id || DEFAULT_PARTICIPANT.id,
    username: currentUser?.username || DEFAULT_PARTICIPANT.username,
    displayName: currentUser?.displayName || DEFAULT_PARTICIPANT.displayName,
    avatarUrl: currentUser?.avatarUrl || DEFAULT_PARTICIPANT.avatarUrl,
    isVerified: currentUser?.isVerified || false,
    hasActiveStory: currentUser?.hasActiveStory || false,
  };

  const newNote: UserNote = {
    id: `note-self-${Date.now()}`,
    userId: selfUser.id,
    username: selfUser.username,
    displayName: selfUser.displayName,
    avatarUrl: selfUser.avatarUrl,
    text: text.trim(),
    music:
      musicTitle?.trim() && musicArtist?.trim()
        ? { title: musicTitle.trim(), artist: musicArtist.trim() }
        : undefined,
    emoji: emoji || "✨",
    createdAt: new Date().toISOString(),
    isSelf: true,
  };

  const filtered = notes.filter((n) => !n.isSelf && n.userId !== selfUser.id);
  const updated = [newNote, ...filtered];
  localStorage.setItem(NOTES_KEY, JSON.stringify(updated));

  return newNote;
}

export function deleteSelfNote(currentUserId?: string): void {
  const notes = getNotes();
  const targetId = currentUserId || DEFAULT_PARTICIPANT.id;
  const updated = notes.filter((n) => !n.isSelf && n.userId !== targetId);
  localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
}

// ==============================================================================
// TIME & FORMATTING HELPERS
// ==============================================================================

export function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const nowDate = new Date();
  const diffMs = nowDate.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return `${diffDay}d`;
}

export function formatChatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateSeparator(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffDay === 0) return "TODAY";
  if (diffDay === 1) return "YESTERDAY";
  return (
    date
      .toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      })
      .toUpperCase() +
    " AT " +
    date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase()
  );
}

export function getOtherParticipant(
  conversation: Conversation,
  selfId: string = "self",
  selfUsername?: string
): ConversationParticipant {
  if (!conversation.participants || conversation.participants.length === 0) {
    return DEFAULT_PARTICIPANT;
  }
  return (
    conversation.participants.find(
      (p) =>
        p.id !== selfId &&
        p.id !== "self" &&
        (!selfUsername || p.username.toLowerCase() !== selfUsername.toLowerCase())
    ) ||
    conversation.participants.find(
      (p) =>
        p.id !== selfId &&
        (!selfUsername || p.username.toLowerCase() !== selfUsername.toLowerCase())
    ) ||
    conversation.participants.find((p) => p.id !== selfId) ||
    conversation.participants[0]
  );
}
