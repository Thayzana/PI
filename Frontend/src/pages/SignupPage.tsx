import { FormEvent, useState } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { register } from "../lib/auth";

interface SignupPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function SignupPage({ onSuccess, onBack }: SignupPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await register({ username, password, name, email });
    setLoading(false);
    if (result.ok) {
      onSuccess();
      return;
    }
    setError(result.error);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-900 text-zinc-50 font-sans">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&auto=format&fit=crop&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-black/65" />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="bg-white/10 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden">
          <div className="p-7">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-white mb-4 cursor-pointer"
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </button>

            <h1 className="text-lg font-bold text-zinc-50">Crie sua conta</h1>
            <p className="text-[11px] text-zinc-200/80 mt-1">
              Cadastro de operador — conta validada no servidor com senha criptografada.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-200/70">Nome completo</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-zinc-900/35 border border-white/10 text-sm text-zinc-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-200/70">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-zinc-900/35 border border-white/10 text-sm text-zinc-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-200/70">Usuário (4–8 dígitos)</label>
                <input
                  inputMode="numeric"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-zinc-900/35 border border-white/10 text-sm text-zinc-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-200/70">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-zinc-900/35 border border-white/10 text-sm text-zinc-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#b3543d] hover:bg-[#93412f] text-white text-sm font-bold disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? "Criando..." : "Criar conta e entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
