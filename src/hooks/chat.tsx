import { createContext, useContext, useState, type ReactNode } from "react";
import type { ChatMessage } from "../types";

interface ChatStore {
  messages: ChatMessage[];
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
}

const ChatContext = createContext<ChatStore | null>(null);

/** Sohbet geçmişi yalnızca bellekte tutulur; sayfalar arasında gezinirken kaybolmaz, çıkışta silinir. */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  return <ChatContext.Provider value={{ messages, setMessages }}>{children}</ChatContext.Provider>;
}

export function useChatStore(): ChatStore {
  const store = useContext(ChatContext);
  if (!store) throw new Error("useChatStore, ChatProvider dışında kullanıldı");
  return store;
}
