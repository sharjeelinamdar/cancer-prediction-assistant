import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "react-router-dom";

import ChatBubble from "../components/ChatBubble";
import { sendChatMessage } from "../lib/api";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export default function ChatPage() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hello. Share your symptoms, and I can provide general information to discuss with your doctor.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const state = location.state as { prefillMessage?: string } | null;
    if (!state?.prefillMessage) {
      return;
    }
    setInput(state.prefillMessage);
  }, [location.state]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = input.trim();
    if (!text || loading) {
      return;
    }

    setError("");
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: response.response },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch a response.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Symptom Chat Assistant</h1>
        <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900 border border-brand-100">
          This assistant shares general information only and cannot diagnose conditions. Please consult a doctor for medical advice.
        </p>
      </div>

      <div className="h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        {messages.map((message) => (
          <ChatBubble key={message.id} role={message.role} text={message.text} />
        ))}
        {loading && <p className="text-sm text-slate-500">Assistant is typing...</p>}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="Describe symptoms or concerns..."
            maxLength={2000}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-brand-600 px-5 py-2 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
