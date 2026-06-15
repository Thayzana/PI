import { FormEvent, useEffect, useRef, useState } from "react";
import { BrainCircuit, Send, Loader2, Bot, User } from "lucide-react";
import InsightPanel from "../components/InsightPanel";
import { isAutoModeEnabled, setAutoModeEnabled } from "../lib/automation";
import { apiFetch } from "../lib/api";

interface ChatMessage {
  role: "user" | "model";
  text: string;
  fromAi?: boolean;
}

interface AssistantPageProps {
  onNavigate: (tab: string, payload?: Record<string, unknown>) => void;
}

export default function AssistantPage({ onNavigate }: AssistantPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Olá! Sou o Assistente Gestify. Pergunte sobre estoque, vendas, lucro, produtos, horários ou clientes.",
      fromAi: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoMode, setAutoMode] = useState(isAutoModeEnabled());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.role === "user" || m.role === "model")
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await apiFetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [
          ...m,
          { role: "model", text: data.reply, fromAi: data.fromAi },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "model", text: data.error || "Erro ao processar pergunta." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "model", text: "Não foi possível conectar à API. Inicie o backend." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const runAutomation = async () => {
    setAutoRunning(true);
    try {
      const res = await apiFetch("/api/automation/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const summary = (data.logs as { step: string; detail: string }[])
          .map((l) => `• ${l.step}: ${l.detail}`)
          .join("\n");
        setMessages((m) => [
          ...m,
          {
            role: "model",
            text: `Modo automático executado:\n${summary}`,
            fromAi: true,
          },
        ]);
      }
    } finally {
      setAutoRunning(false);
    }
  };

  useEffect(() => {
    if (!autoMode) return;
    void runAutomation();
    const id = window.setInterval(() => void runAutomation(), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [autoMode]);

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#faf6f2] font-sans space-y-6" id="assistant-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-[#b3543d]" size={24} />
          <div>
            <h2 className="text-lg font-bold text-[#2e2624]">Assistente Inteligente</h2>
            <p className="text-xs text-[#7d6f6b]">Insights, ações rápidas e chat com contexto do negócio</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#2e2624] cursor-pointer">
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => {
              setAutoMode(e.target.checked);
              setAutoModeEnabled(e.target.checked);
            }}
            className="accent-[#b3543d]"
          />
          Modo automático (simulação)
        </label>
      </div>

      <div className="bg-white border border-[#eee7de] rounded-2xl p-5 shadow-sm">
        <InsightPanel onNavigate={onNavigate} />
      </div>

      <div className="bg-white border border-[#eee7de] rounded-2xl shadow-sm flex flex-col h-[min(520px,60vh)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "model" && (
                <Bot size={16} className="text-[#b3543d] shrink-0 mt-1" />
              )}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#b3543d] text-white"
                    : "bg-[#faf7f2] border border-[#eee7de] text-[#2e2624]"
                }`}
              >
                {msg.text}
              </div>
              {msg.role === "user" && (
                <User size={16} className="text-[#7d6f6b] shrink-0 mt-1" />
              )}
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-[#7d6f6b]">
              <Loader2 size={14} className="animate-spin" />
              Pensando...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-[#eee7de] flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte à IA sobre estoque, vendas, lucro..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#faf7f2] border border-[#e5dec9]/60 text-sm focus:outline-none focus:border-[#b3543d]"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2.5 rounded-xl bg-[#b3543d] text-white font-bold text-sm flex items-center gap-1 cursor-pointer disabled:opacity-60"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {autoMode && (
        <p className="text-[10px] text-[#7d6f6b] text-center">
          Modo automático ativo: ciclos a cada 5 min (promoções reais; WhatsApp/Instagram simulados).
          {autoRunning && " Executando agora..."}
        </p>
      )}
    </div>
  );
}