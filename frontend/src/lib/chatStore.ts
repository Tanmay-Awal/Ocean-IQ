import { useState, useEffect } from "react";

export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  imagePath?: string;
  graphJson?: any;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

// Simple in-memory store for a single session (vanishes on reload)
let recentChats: ChatSession[] = [];
let listeners: Array<() => void> = [];

const notifyListeners = () => {
  listeners.forEach((l) => l());
};

export const chatStore = {
  getChats: () => [...recentChats].sort((a, b) => b.updatedAt - a.updatedAt),
  
  getChat: (id: string) => recentChats.find(c => c.id === id),
  
  saveChat: (chat: ChatSession) => {
    const existingIndex = recentChats.findIndex(c => c.id === chat.id);
    if (existingIndex >= 0) {
      recentChats[existingIndex] = { ...chat, updatedAt: Date.now() };
    } else {
      recentChats.unshift({ ...chat, updatedAt: Date.now() });
    }
    notifyListeners();
  },
  
  clearChats: () => {
    recentChats = [];
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
  const [chats, setChats] = useState(chatStore.getChats());

  useEffect(() => {
    return chatStore.subscribe(() => {
      setChats(chatStore.getChats());
    });
  }, []);

  return chats;
}
