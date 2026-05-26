import { FormEvent, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { login } from "../lib/auth";

interface LoginPageProps {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    // Cookie banner é exibido apenas na primeira visita (persistido no localStorage).
    try {
      const accepted = localStorage.getItem("gestify_cookie_consent");
      setShowCookieBanner(accepted !== "accepted");
    } catch {
      // Se o storage falhar, não bloqueamos a navegação.
      setShowCookieBanner(true);
    }
  }, []);

  useEffect(() => {
    // Fundo com troca suave (mantém o “modelo” com duas imagens alternando).
    const bgCafe = document.getElementById("bg-cafe");
    const bgVarejo = document.getElementById("bg-varejo");
    if (!bgCafe || !bgVarejo) return;

    // Inicia com cafe visível.
    bgCafe.classList.add("opacity-100");
    bgCafe.classList.remove("opacity-0");
    bgVarejo.classList.add("opacity-0");
    bgVarejo.classList.remove("opacity-100");

    const id = window.setInterval(() => {
      const cafeVisible = bgCafe.classList.contains("opacity-100");
      if (cafeVisible) {
        bgCafe.classList.remove("opacity-100");
        bgCafe.classList.add("opacity-0");
        bgVarejo.classList.remove("opacity-0");
        bgVarejo.classList.add("opacity-100");
      } else {
        bgCafe.classList.remove("opacity-0");
        bgCafe.classList.add("opacity-100");
        bgVarejo.classList.remove("opacity-100");
        bgVarejo.classList.add("opacity-0");
      }
    }, 3800);

    return () => window.clearInterval(id);
  }, []);

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

  const handleAcceptCookies = () => {
    try {
      localStorage.setItem("gestify_cookie_consent", "accepted");
    } catch {
      // Ignora se falhar.
    }
    setShowCookieBanner(false);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-900 text-zinc-50 font-sans">
      {/* Background photos (modelo) */}
      <div
        id="bg-cafe"
        className="absolute inset-0 bg-cover bg-center opacity-100 transition-opacity duration-1000 filter blur-[1px]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1541167760496-1628856ab772?w=1920&auto=format&fit=crop&q=80')",
        }}
      />
      <div
        id="bg-varejo"
        className="absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-1000 filter blur-[1px]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&auto=format&fit=crop&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Cookie banner (modelo) */}
      {showCookieBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(720px,calc(100%-2rem))]">
          <div
            className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-4"
            id="lpd-banner"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] text-zinc-200 leading-relaxed">
                Usamos cookies para melhorar sua experiência em conformidade com a sua{" "}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="underline text-zinc-50 hover:text-white"
                >
                  Política de Cookies
                </a>
                .
              </p>

              <button
                type="button"
                onClick={handleAcceptCookies}
                className="px-4 py-2 rounded-2xl bg-[#b3543d] hover:bg-[#93412f] text-white text-[11px] font-extrabold transition-colors shadow cursor-pointer whitespace-nowrap"
              >
                ACEITAR
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-[380px]">
        <div className="bg-white/10 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden">
          <div className="p-7">
            <div className="flex items-center gap-3 justify-center mb-5">
              <div className="w-10 h-10 rounded-2xl bg-zinc-950/60 border border-white/10 flex items-center justify-center font-black">
                Gy
              </div>
            </div>

            <h1 className="text-center text-lg font-bold text-zinc-50">
              Seja bem-vindo ao Gestify
            </h1>
            <p className="text-center text-[11px] text-zinc-200/80 mt-1">
              Acesse com login e senha
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-200/70">
                  Usuário
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/35 border border-white/10 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#b3543d]/40 focus:border-[#b3543d]/50 transition"
                  placeholder="Usuário"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-200/70">
                  Senha
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/35 border border-white/10 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#b3543d]/40 focus:border-[#b3543d]/50 transition"
                  placeholder="Senha"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#b3543d] hover:bg-[#93412f] text-white text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Verificando..." : "Entrar"}
              </button>

              <div className="text-center text-[11px] text-zinc-200/80 pt-1 leading-relaxed">
                <p>
                  Novo por aqui?{" "}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="underline hover:text-white"
                  >
                    Crie conta
                  </a>
                </p>
                <p>
                  Precisa de ajuda?{" "}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="underline hover:text-white"
                  >
                    Fale Conosco
                  </a>
                </p>
              </div>
            </form>

            <p className="text-center text-[10px] text-zinc-300/60 mt-6">
              © {new Date().getFullYear()} Gestify. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
