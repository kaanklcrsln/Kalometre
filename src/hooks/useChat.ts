import { useState } from "react";
import type { ChatContext } from "../config/ai";
import { analysisSummary, entryFromSuggestion, suggestionFromAnalysis, suggestionFromText, type FoodSuggestion } from "../lib/chatFood";
import { MAX_ITEM_KCAL, MEAL_LABELS } from "../lib/calculations";
import { todayKey } from "../lib/dates";
import { ImageError, prepareFoodImage } from "../lib/image";
import { AiServiceError, analyzeFoodImage, sendChatMessage } from "../services/ai";
import { addEntry } from "../services/db";
import type { Meal } from "../types";
import { useChatStore } from "./chat";

/** Fotoğraf mesajının modele geçmiş olarak giden metni. */
const PHOTO_MESSAGE_TEXT = "(Yemek fotoğrafı gönderdim.)";

export function useChat(uid: string, context: ChatContext) {
  const { messages, setMessages } = useChatStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Anlatılan ya da fotoğrafı gönderilen yemek: "öğüne ekleyelim mi?" kutusu. */
  const [suggestion, setSuggestion] = useState<FoodSuggestion | null>(null);
  /** Kullanıcının seçtiği öğün: ekleme paneli açık. */
  const [addingMeal, setAddingMeal] = useState<Meal | null>(null);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  /** Eklendikten sonra kutuda kısa süre görünen onay. */
  const [added, setAdded] = useState<string | null>(null);

  const showError = (err: unknown) =>
    setError(err instanceof AiServiceError || err instanceof ImageError ? err.message : "Bir şeyler ters gitti.");

  const newSuggestion = (s: FoodSuggestion | null) => {
    setSuggestion(s);
    setAddingMeal(null);
    setAdded(null);
  };

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
      setMessages((prev) => [...prev, { role: "model", text: reply.text }]);
      if (reply.food) newSuggestion(suggestionFromText(reply.food.name, reply.food.kcal, text));
    } catch (err) {
      showError(err);
      // Gönderilemeyen mesajı geri al ki tekrar denenebilsin.
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const sendPhoto = async (file: File) => {
    if (loading) return;
    setError(null);
    setLoading(true);
    let shown = false;
    try {
      const image = await prepareFoodImage(file);
      setMessages((prev) => [...prev, { role: "user", text: PHOTO_MESSAGE_TEXT, imageUrl: image.dataUrl }]);
      shown = true;
      const analysis = await analyzeFoodImage(uid, todayKey(), image.base64, image.mimeType);
      setMessages((prev) => [...prev, { role: "model", text: analysisSummary(analysis) }]);
      const s = suggestionFromAnalysis(analysis);
      if (s) newSuggestion(s);
    } catch (err) {
      showError(err);
      if (shown) setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const saveSuggestion = async (name: string, kcal: number) => {
    if (!suggestion || !addingMeal || saving) return;
    if (!(kcal > 0) || kcal > MAX_ITEM_KCAL) {
      setAddError(`Kalori 1–${MAX_ITEM_KCAL} arasında olmalı.`);
      return;
    }
    setSaving(true);
    setAddError(null);
    try {
      await addEntry(uid, todayKey(), entryFromSuggestion(suggestion, name, kcal, addingMeal));
      const label = MEAL_LABELS[addingMeal];
      setSuggestion(null);
      setAddingMeal(null);
      setAdded(`${label} öğününe eklendi.`);
      setTimeout(() => setAdded(null), 2500);
    } catch (err) {
      console.error(err);
      setAddError("Kaydedilemedi. Tekrar dene.");
    } finally {
      setSaving(false);
    }
  };

  return {
    messages,
    input,
    loading,
    error,
    setInput,
    send,
    sendPhoto,
    suggestion,
    addingMeal,
    saving,
    addError,
    added,
    /** Kutudaki öğün butonu: ekleme panelini açar. */
    chooseMeal: (meal: Meal) => {
      setAddError(null);
      setAddingMeal(meal);
    },
    /** Paneldeki "Geri": kutuya döner, öneri kalır. */
    cancelAdd: () => {
      setAddError(null);
      setAddingMeal(null);
    },
    dismissSuggestion: () => newSuggestion(null),
    saveSuggestion,
    clear: () => {
      setMessages(() => []);
      setError(null);
      newSuggestion(null);
    },
  };
}
