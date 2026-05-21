import { useState, useEffect, FormEvent } from "react";
import { Settings, RefreshCw, Layers, Shield, Key, Check, AlertCircle } from "lucide-react";

interface SettingsPageProps {
  onResetDatabase: () => void;
  resetting: boolean;
}

export default function SettingsPage({ onResetDatabase, resetting }: SettingsPageProps) {
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/gemini-status")
      .then((r) => r.json())
      .then((d) => setGeminiConfigured(!!d.configured))
      .catch(() => setGeminiConfigured(false));
  }, []);

  const handleSaveGeminiKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!geminiKey.trim()) {
      setKeyMessage({ type: "err", text: "Cole sua chave da API Gemini." });
      return;
    }
    setSavingKey(true);
    setKeyMessage(null);
    try {
      const res = await fetch("/api/settings/gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: geminiKey.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeminiConfigured(true);
        setGeminiKey("");
        setKeyMessage({ type: "ok", text: "Chave salva! O marketing IA já pode gerar textos." });
      } else {
        setKeyMessage({ type: "err", text: data.error || "Falha ao salvar a chave." });
      }
    } catch {
      setKeyMessage({ type: "err", text: "Não foi possível conectar ao servidor. Rode npm run dev." });
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#faf6f2] text-[#2c2221] font-sans" id="settings-page">
      <div className="max-w-2xl bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm space-y-6">
        
        <div className="flex items-center gap-3 border-b border-[#eee7de] pb-4">
          <div className="p-2 bg-[#faf7f2] text-[#b3543d] border border-[#e5dec9]/40 rounded-lg">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2e2624]">Configurações da Plataforma</h3>
            <p className="text-xs text-[#7d6f6b]">Ajustes globais do Studio</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[#faf7f2] border border-[#e5dec9]/60 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#b3543d] uppercase tracking-wider flex items-center gap-1.5">
              <Key size={14} />
              <span>Chave Gemini (Marketing IA)</span>
              {geminiConfigured === true && (
                <span className="ml-auto flex items-center gap-1 text-emerald-700 font-semibold normal-case tracking-normal">
                  <Check size={12} /> Ativa
                </span>
              )}
              {geminiConfigured === false && (
                <span className="ml-auto flex items-center gap-1 text-amber-700 font-semibold normal-case tracking-normal">
                  <AlertCircle size={12} /> Pendente
                </span>
              )}
            </h4>
            <p className="text-xs text-[#7d6f6b] leading-relaxed">
              Obtenha sua chave gratuita em{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#b3543d] font-semibold underline"
              >
                aistudio.google.com/apikey
              </a>
              {" "}e cole abaixo. A chave fica apenas no seu computador (<code className="font-mono text-[10px]">.env.local</code>).
            </p>
            <form onSubmit={handleSaveGeminiKey} className="space-y-2">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-3 py-2 text-sm border border-[#e5dec9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b3543d]/30 font-mono"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={savingKey}
                className="px-4 py-2 bg-[#b3543d] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
              >
                {savingKey ? "Salvando..." : "Salvar chave Gemini"}
              </button>
            </form>
            {keyMessage && (
              <p className={`text-xs font-medium ${keyMessage.type === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
                {keyMessage.text}
              </p>
            )}
          </div>

          <div className="p-4 bg-[#faf7f2] border border-[#e5dec9]/60 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#b3543d] uppercase tracking-wider flex items-center gap-1.5">
              <Key size={14} />
              <span>Conexão de Inteligência Artificial</span>
            </h4>
            <div className="text-xs text-[#7d6f6b] space-y-1.5 leading-relaxed">
              <p>• API Selecionada: <strong className="font-mono text-[#b3543d] font-semibold">@google/genai SDK v1.29</strong></p>
              <p>• Modelo Ativo: <strong className="font-mono text-[#b3543d] font-semibold">gemini-3.5-flash</strong></p>
              <p>• Telemetria: <strong className="font-mono text-[#b3543d] font-semibold">aistudio-build user-agent</strong></p>
            </div>
          </div>

          <div className="p-4 bg-[#faf7f2] border border-[#e5dec9]/60 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#b3543d] uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} />
              <span>Infraestrutura do Servidor</span>
            </h4>
            <div className="text-xs text-[#7d6f6b] space-y-1.5 leading-relaxed">
              <p>• Driver de Banco: <strong className="font-mono text-[#b3543d] font-semibold">SQLite 3 (Drives SQL e relacionais nativos)</strong></p>
              <p>• Servidor: <strong className="font-mono text-[#b3543d] font-semibold">NodeJS / Express v4.21</strong></p>
              <p>• Modo: <strong className="font-mono text-[#b3543d] font-semibold">Híbrido Full-Stack (Express + Vite SPA)</strong></p>
            </div>
          </div>

          <div className="p-4 bg-rose-50/50 border border-[#b3543d]/20 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#b3543d] uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} />
              <span>Operações Avançadas</span>
            </h4>
            <div className="space-y-3">
              <p className="text-xs text-[#7d6f6b] leading-relaxed">
                Se você fez testes intensos alterando, excluindo ou cadastrando novas matérias-primas e receitas, você pode reiniciar o banco de dados SQL para as configurações de dados default a qualquer momento.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Você deseja apagar todos os registros do banco SQL local e reinicializar com as receitas/estoques mostrados nas telas originais?")) {
                    onResetDatabase();
                  }
                }}
                disabled={resetting}
                className="px-4 py-2 bg-[#b3543d] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#b3543d]/10"
              >
                <RefreshCw size={13} className={resetting ? "animate-spin" : ""} />
                <span>{resetting ? "Reiniciando tabelas..." : "Reiniciar tabelas SQL"}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
