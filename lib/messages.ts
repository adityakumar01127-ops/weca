// ==============================================================================
// WECA MESSAGING DATA LAYER
// Types, demo seed data, notes, and localStorage persistence helpers
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
// DEMO PARTICIPANTS
// ==============================================================================

export const DEMO_PARTICIPANTS: Record<string, ConversationParticipant> = {
  self: {
    id: "00000000-0000-0000-0000-000000000001",
    username: "mr_adityakaushik",
    displayName: "Aditya Kaushik",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    hasActiveStory: true,
  },
  arkaios: {
    id: "u-arkaios",
    username: "arkaios_anomaly",
    displayName: "Arkaios",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    hasActiveStory: true,
  },
  puneet: {
    id: "u-puneet",
    username: "puneet_shahi",
    displayName: "Puneet Shahi",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: false,
  },
  pretty: {
    id: "u-pretty",
    username: "_pretty",
    displayName: "_pretty🦋",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: true,
  },
  aryan: {
    id: "u-aryan",
    username: "aryan_tiwari",
    displayName: "aryan tiwari",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: true,
  },
  luna: {
    id: "u-luna",
    username: "luna_glitch",
    displayName: "Luna ✨",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: false,
  },
  nova: {
    id: "u-nova",
    username: "nova_field",
    displayName: "Nova Researcher",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    hasActiveStory: true,
  },
  reiko: {
    id: "u-reiko",
    username: "reiko_tokyo",
    displayName: "Reiko 🌸",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: false,
  },
  cipher: {
    id: "u-cipher",
    username: "cipher_void",
    displayName: "Cipher",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: true,
  },
  zenith: {
    id: "u-zenith",
    username: "zenith_labs",
    displayName: "Zenith Labs",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    hasActiveStory: false,
  },
};

// ==============================================================================
// DEMO SEED DATA
// ==============================================================================

const now = Date.now();
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export const SEED_NOTES: UserNote[] = [
  {
    id: "note-self",
    userId: DEMO_PARTICIPANTS.self.id,
    username: DEMO_PARTICIPANTS.self.username,
    displayName: DEMO_PARTICIPANTS.self.displayName,
    avatarUrl: DEMO_PARTICIPANTS.self.avatarUrl,
    text: "Today's vibe...",
    music: {
      title: "Starboy",
      artist: "The Weeknd",
    },
    emoji: "✨",
    createdAt: new Date(now - 2 * HOUR).toISOString(),
    isSelf: true,
  },
  {
    id: "note-pretty",
    userId: DEMO_PARTICIPANTS.pretty.id,
    username: DEMO_PARTICIPANTS.pretty.username,
    displayName: DEMO_PARTICIPANTS.pretty.displayName,
    avatarUrl: DEMO_PARTICIPANTS.pretty.avatarUrl,
    text: "akira - Sanam Puri...",
    music: {
      title: "akira",
      artist: "Sanam Puri",
    },
    emoji: "✨",
    createdAt: new Date(now - 4 * HOUR).toISOString(),
  },
  {
    id: "note-aditya",
    userId: "u-adityakumar",
    username: "aditya_kumar_k",
    displayName: "Aditya Kumar K...",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    text: "Aaja Unplugged...",
    music: {
      title: "Aaja Unplugged",
      artist: "Arijit Singh",
    },
    emoji: "🌾",
    createdAt: new Date(now - 6 * HOUR).toISOString(),
  },
  {
    id: "note-harshal",
    userId: "u-harshal",
    username: "harshal_b",
    displayName: "HARSHAL B",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    text: "hawan KSW, Arijit...",
    music: {
      title: "hawan",
      artist: "KSW, Arijit",
    },
    emoji: "❤️🧿",
    createdAt: new Date(now - 8 * HOUR).toISOString(),
  },
  {
    id: "note-arkaios",
    userId: DEMO_PARTICIPANTS.arkaios.id,
    username: DEMO_PARTICIPANTS.arkaios.username,
    displayName: DEMO_PARTICIPANTS.arkaios.displayName,
    avatarUrl: DEMO_PARTICIPANTS.arkaios.avatarUrl,
    text: "Sector 9 signals detected 🛸",
    music: {
      title: "Solaris Glitch",
      artist: "Arkaios",
    },
    emoji: "🛸",
    createdAt: new Date(now - 12 * HOUR).toISOString(),
  },
];

const SEED_MESSAGES: Message[] = [
  // Conversation with Arkaios (pinned)
  {
    id: "m-1",
    conversationId: "conv-arkaios",
    senderId: "u-arkaios",
    type: "text",
    text: "An intriguing link. Is this a test like last time? 🛸",
    timestamp: new Date(now - 39 * 7 * DAY).toISOString(),
    read: true,
  },
  {
    id: "m-1b",
    conversationId: "conv-arkaios",
    senderId: "00000000-0000-0000-0000-000000000001",
    type: "text",
    text: "No this is legit — check the anomaly score on that refraction",
    timestamp: new Date(now - 39 * 7 * DAY + 5 * MIN).toISOString(),
    read: true,
  },
  {
    id: "m-1c",
    conversationId: "conv-arkaios",
    senderId: "u-arkaios",
    type: "text",
    text: "Whoa, that's a 94.2 Weca score. Legendary tier 🔥",
    reactions: { "00000000-0000-0000-0000-000000000001": "🔥" },
    timestamp: new Date(now - 2 * HOUR).toISOString(),
    read: false,
  },
  // Conversation with Puneet Shahi (Reel DM)
  {
    id: "m-puneet-1",
    conversationId: "conv-puneet",
    senderId: "u-puneet",
    type: "shared_reel",
    sharedPost: {
      id: "reel-fabifonseca",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
      caption: "Dost ka bachha akela mil gya 😂 Tag your dost 👶",
      username: "fabifonseca.ai",
    },
    timestamp: new Date(now - 11 * HOUR).toISOString(),
    read: false,
  },
  // Conversation with _pretty
  {
    id: "m-pretty-1",
    conversationId: "conv-pretty",
    senderId: "u-pretty",
    type: "text",
    text: "Byeee · 15h 👋",
    timestamp: new Date(now - 15 * HOUR).toISOString(),
    read: true,
  },
  // Conversation with Aryan Tiwari
  {
    id: "m-aryan-1",
    conversationId: "conv-aryan",
    senderId: "u-aryan",
    type: "shared_reel",
    sharedPost: {
      id: "reel-kittu",
      imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80",
      caption: "Chrono distortion recorded live in Mumbai 🌅",
      username: "kittu_gaadu_00",
    },
    timestamp: new Date(now - 3 * DAY).toISOString(),
    read: true,
  },
  // Conversation with Luna
  {
    id: "m-2a",
    conversationId: "conv-luna",
    senderId: "u-luna",
    type: "text",
    text: "Hey! Loved your bioluminescent botanical glitch post",
    timestamp: new Date(now - 6 * HOUR).toISOString(),
    read: true,
  },
  {
    id: "m-2b",
    conversationId: "conv-luna",
    senderId: "00000000-0000-0000-0000-000000000001",
    type: "text",
    text: "Thanks Luna! That one was crazy to capture at night 🌿",
    timestamp: new Date(now - 5 * HOUR - 45 * MIN).toISOString(),
    read: true,
  },
  {
    id: "m-2c",
    conversationId: "conv-luna",
    senderId: "u-luna",
    type: "image",
    imageUrl: "/anom-2.jpg",
    timestamp: new Date(now - 5 * HOUR).toISOString(),
    read: true,
  },
  {
    id: "m-2d",
    conversationId: "conv-luna",
    senderId: "u-luna",
    type: "text",
    text: "I found something similar in my garden!! What do you think? 🌱",
    timestamp: new Date(now - 5 * HOUR).toISOString(),
    read: false,
  },
  // Conversation with Nova
  {
    id: "m-3a",
    conversationId: "conv-nova",
    senderId: "u-nova",
    type: "shared_post",
    sharedPost: {
      id: "post-shared-1",
      imageUrl: "/anom-3.jpg",
      caption: "Atmospheric resonance captured at dusk",
      username: "nova_field",
    },
    timestamp: new Date(now - 3 * DAY).toISOString(),
    read: true,
  },
  {
    id: "m-3b",
    conversationId: "conv-nova",
    senderId: "u-nova",
    type: "text",
    text: "Sent a sighting from my field expedition — thoughts?",
    timestamp: new Date(now - 3 * DAY).toISOString(),
    read: true,
  },
  {
    id: "m-3c",
    conversationId: "conv-nova",
    senderId: "00000000-0000-0000-0000-000000000001",
    type: "text",
    text: "That atmospheric resonance is reality-breaking tier 🌅",
    timestamp: new Date(now - 2 * DAY - 20 * HOUR).toISOString(),
    read: true,
  },
  // Conversation with Reiko
  {
    id: "m-4a",
    conversationId: "conv-reiko",
    senderId: "u-reiko",
    type: "text",
    text: "Byeee 👋",
    timestamp: new Date(now - 15 * HOUR).toISOString(),
    read: false,
  },
  // Conversation with Cipher (request)
  {
    id: "m-5a",
    conversationId: "conv-cipher",
    senderId: "u-cipher",
    type: "text",
    text: "Hey, saw your anomaly documentation on the map — incredible coordinates! Would love to collaborate on a field expedition 🗺️",
    timestamp: new Date(now - 1 * DAY).toISOString(),
    read: false,
  },
  // Conversation with Zenith Labs
  {
    id: "m-6a",
    conversationId: "conv-zenith",
    senderId: "u-zenith",
    type: "text",
    text: "Sent on Wednesday",
    timestamp: new Date(now - 4 * DAY).toISOString(),
    read: true,
  },
  {
    id: "m-6b",
    conversationId: "conv-zenith",
    senderId: "u-zenith",
    type: "image",
    imageUrl: "/anom-1.jpg",
    timestamp: new Date(now - 4 * DAY + 2 * MIN).toISOString(),
    read: true,
  },
];

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-arkaios",
    participants: [DEMO_PARTICIPANTS.self, DEMO_PARTICIPANTS.arkaios],
    unreadCount: 1,
    isPinned: true,
    isRequest: false,
    category: "primary",
    theme: "violet",
    updatedAt: new Date(now - 2 * HOUR).toISOString(),
  },
  {
    id: "conv-puneet",
    participants: [DEMO_PARTICIPANTS.self, DEMO_PARTICIPANTS.puneet],
    unreadCount: 1,
    isRequest: false,
    category: "primary",
    updatedAt: new Date(now - 11 * HOUR).toISOString(),
  },
  {
    id: "conv-pretty",
    participants: [DEMO_PARTICIPANTS.self, DEMO_PARTICIPANTS.pretty],
    unreadCount: 0,
    isRequest: false,
    category: "primary",
    updatedAt: new Date(now - 15 * HOUR).toISOString(),
  },
  {
    id: "conv-aryan",
    participants: [DEMO_PARTICIPANTS.self, DEMO_PARTICIPANTS.aryan],
    unreadCount: 0,
    isRequest: false,
    category: "primary",
    updatedAt: new Date(now - 3 * DAY).toISOString(),
  },
  {
    id: "conv-luna",
    participants: [DEMO_PARTICIPANTS.self, DEMO_PARTICIPANTS.luna],
    unreadCount: 1,
    isRequest: false,
    category: "primary",
    updatedAt: new Date(now - 5 * HOUR).toISOString(),
  },
  {
    id: "conv-reiko",
    participants: [DEMO_PARTICIPANTS.self, DEMO_PARTICIPANTS.reiko],
    unreadCount: 1,
    isRequest: false,
    category: "primary",
    updatedAt: new Date(now - 15 * HOUR).toISOString(),
  },
  {
    id: "conv-nova",
    participants: [DEMO_PARTICIPANTS.self, DEMO_PARTICIPANTS.nova],
    unreadCount: 0,
    isRequest: false,
    category: "general",
    updatedAt: new Date(now - 2 * DAY - 20 * HOUR).toISOString(),
  },
  {
    id: "conv-zenith",
    participants: [DEMO_PARTICIPANTS.self, DEMO_PARTICIPANTS.zenith],
    unreadCount: 0,
    isRequest: false,
    category: "general",
    updatedAt: new Date(now - 4 * DAY).toISOString(),
  },
  {
    id: "conv-cipher",
    participants: [DEMO_PARTICIPANTS.self, DEMO_PARTICIPANTS.cipher],
    unreadCount: 1,
    isRequest: true,
    category: "primary",
    updatedAt: new Date(now - 1 * DAY).toISOString(),
  },
];

// ==============================================================================
// STORAGE KEYS
// ==============================================================================

const CONVERSATIONS_KEY = "weca_dm_conversations_v2";
const MESSAGES_KEY = "weca_dm_messages_v2";
const NOTES_KEY = "weca_dm_notes_v2";
const SEEDED_KEY = "weca_dm_seeded_v2";

// ==============================================================================
// INITIALIZATION: Seed demo data on first load
// ==============================================================================

function ensureSeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEEDED_KEY)) return;

  const messagesMap = new Map<string, Message[]>();
  for (const msg of SEED_MESSAGES) {
    const existing = messagesMap.get(msg.conversationId) || [];
    existing.push(msg);
    messagesMap.set(msg.conversationId, existing);
  }

  const conversations = SEED_CONVERSATIONS.map((conv) => {
    const msgs = messagesMap.get(conv.id) || [];
    const lastMsg = msgs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    return { ...conv, lastMessage: lastMsg };
  });

  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(SEED_MESSAGES));
  localStorage.setItem(NOTES_KEY, JSON.stringify(SEED_NOTES));
  localStorage.setItem(SEEDED_KEY, "1");
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
        p.id !== "00000000-0000-0000-0000-000000000001"
    )
  ) || null;
}

export function createConversation(
  otherUser: ConversationParticipant
): Conversation {
  ensureSeeded();
  const selfParticipant = DEMO_PARTICIPANTS.self;
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

export const ADDITIONAL_COMMUNITY_USERS: ConversationParticipant[] = [
  {
    id: "u-mara-ranger",
    username: "mara_ranger",
    displayName: "Mara Ranger",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    hasActiveStory: true,
  },
  {
    id: "u-bjork-scout",
    username: "bjork_scout",
    displayName: "Björk Scout",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: false,
  },
  {
    id: "u-highland-goth",
    username: "highland_goth",
    displayName: "Highland Goth",
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: true,
  },
  {
    id: "u-kiwi-mycologist",
    username: "kiwi_mycologist",
    displayName: "Kiwi Mycologist",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    hasActiveStory: false,
  },
  {
    id: "u-tokyo-drifter",
    username: "tokyo_drifter",
    displayName: "Tokyo Drifter",
    avatarUrl: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: true,
  },
  {
    id: "u-maldives-diver",
    username: "maldives_diver",
    displayName: "Maldives Diver",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    hasActiveStory: false,
  },
  {
    id: "u-zapote-relic",
    username: "zapote_relic",
    displayName: "Zapote Relic Hunter",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isVerified: false,
    hasActiveStory: false,
  },
];

export function getAvailableUsers(): ConversationParticipant[] {
  const baseUsers = Object.values(DEMO_PARTICIPANTS).filter(
    (p) => p.id !== DEMO_PARTICIPANTS.self.id
  );
  const combined = [...baseUsers, ...ADDITIONAL_COMMUNITY_USERS];
  const seen = new Set<string>();
  return combined.filter((user) => {
    const key = user.username.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  emoji?: string
): UserNote {
  ensureSeeded();
  const notes = getNotes();
  const selfUser = DEMO_PARTICIPANTS.self;

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

export function deleteSelfNote(): void {
  const notes = getNotes();
  const selfUser = DEMO_PARTICIPANTS.self;
  const updated = notes.filter((n) => !n.isSelf && n.userId !== selfUser.id);
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
  selfId: string = "00000000-0000-0000-0000-000000000001"
): ConversationParticipant {
  return conversation.participants.find((p) => p.id !== selfId) || conversation.participants[0];
}
