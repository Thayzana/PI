import { FormEvent, useState } from "react";
import { ShoppingBag, Lock, User, AlertCircle } from "lucide-react";
import { login } from "../lib/auth";

interface LoginPageProps {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const ok = login(username, password);
    if (ok) {
      setLoading(false);
      onSuccess();
      return;
    }

    setError("Usuário ou senha incorretos. Acesso restrito ao administrador.");
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans"
      style={{
        background:
          "linear-gradient(135deg, #faf6f2 0%, #f2ebda 45%, #faf0ed 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#b3543d] text-white shadow-lg mb-4">
            <ShoppingBag size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-[#2e2624] tracking-tight">Gestify</h1>
          <p className="text-sm text-[#7d6f6b] mt-1">Painel administrativo</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#eee7de] rounded-2xl shadow-xl p-8 space-y-5"
        >
          <div>
            <h2 className="text-lg font-bold text-[#2e2624]">Entrar</h2>
            <p className="text-xs text-[#7d6f6b] mt-1">
              Use suas credenciais de administrador para acessar o sistema.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-800 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#7d6f6b]">
              Usuário
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a76]"
              />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e5dec9]/80 bg-[#faf7f2] text-sm text-[#2e2624] focus:outline-none focus:border-[#b3543d] focus:ring-1 focus:ring-[#b3543d]"
                placeholder="Seu código de acesso"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#7d6f6b]">
              Senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a76]"
              />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e5dec9]/80 bg-[#faf7f2] text-sm text-[#2e2624] focus:outline-none focus:border-[#b3543d] focus:ring-1 focus:ring-[#b3543d]"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#b3543d] hover:bg-[#93412f] text-white text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Verificando…" : "Acessar painel"}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#8a7a76] mt-6">
          Gestify © {new Date().getFullYear()} — Acesso exclusivo para gestores
        </p>
      </div>
    </div>
  );
}
