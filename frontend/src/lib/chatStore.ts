import { useState, useEffect } from "react";

export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  imagePath?: string;
  graphJson?: any;
  isError?: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const STORAGE_KEY = "oceaniq_recent_chats_v1";

const getStoredChats = (): ChatSession[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load chat sessions from localStorage", e);
    return [];
  }
};

const persistChats = (chats: ChatSession[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error("Failed to persist chat sessions to localStorage", e);
  }
};

let recentChats: ChatSession[] = [];
let isInitialized = false;
let listeners: Array<() => void> = [];

const initStore = () => {
  if (!isInitialized && typeof window !== "undefined") {
    recentChats = getStoredChats();
    isInitialized = true;
  }
};

const notifyListeners = () => {
  listeners.forEach((l) => l());
};

export const chatStore = {
  getChats: () => {
    initStore();
    return [...recentChats].sort((a, b) => b.updatedAt - a.updatedAt);
  },
  
  getChat: (id: string) => {
    initStore();
    return recentChats.find(c => c.id === id);
  },
  
  saveChat: (chat: ChatSession) => {
    initStore();
    const existingIndex = recentChats.findIndex(c => c.id === chat.id);
    if (existingIndex >= 0) {
      recentChats[existingIndex] = { ...chat, updatedAt: Date.now() };
    } else {
      recentChats.unshift({ ...chat, updatedAt: Date.now() });
    }
    // Cap at 30 recent chats to keep storage lean
    if (recentChats.length > 30) {
      recentChats = recentChats.slice(0, 30);
    }
    persistChats(recentChats);
    notifyListeners();
  },

  deleteChat: (id: string) => {
    initStore();
    recentChats = recentChats.filter(c => c.id !== id);
    persistChats(recentChats);
    notifyListeners();
  },
  
  clearChats: () => {
    recentChats = [];
    persistChats(recentChats);
    notifyListeners();
  },

  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};

export function useRecentChats() {
  const [chats, setChats] = useState<ChatSession[]>([]);

  useEffect(() => {
    setChats(chatStore.getChats());
    const unsubscribe = chatStore.subscribe(() => {
      setChats(chatStore.getChats());
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        recentChats = getStoredChats();
        setChats(chatStore.getChats());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return chats;
}
