import { useState } from "react";
import type { ChatContext } from "../config/ai";
import { todayKey } from "../lib/dates";
import { AiServiceError, sendChatMessage } from "../services/ai";
import { useChatStore } from "./chat";

export function useChat(uid: string, context: ChatContext) {
  const { messages, setMessages } = useChatStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const reply = await sendChatMessage(uid, todayKey(), history, text, context);
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      setError(err instanceof AiServiceError ? err.message : "Bir şeyler ters gitti.");
      // Gönderilemeyen mesajı geri al ki tekrar denenebilsin.
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    input,
    loading,
    error,
    setInput,
    send,
    clear: () => {
      setMessages(() => []);
      setError(null);
    },
  };
}
