const TOKEN_KEY = "gestify_token";
const USER_KEY = "gestify_user";

export type UserRole = "admin" | "operator";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  active?: boolean;
}

function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken() && getCurrentUser());
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === "admin";
}

export function getCurrentUsername(): string | null {
  return getCurrentUser()?.username ?? null;
}

export async function login(
  username: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || "Usuário ou senha incorretos." };
    }
    saveSession(data.token, data.user);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível conectar ao servidor." };
  }
}

export async function register(data: {
  username: string;
  password: string;
  name: string;
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const username = data.username.trim();
  const password = data.password;
  const name = data.name.trim();
  const email = data.email.trim();

  if (!/^\d{4,8}$/.test(username)) {
    return { ok: false, error: "Usuário deve ter entre 4 e 8 dígitos numéricos." };
  }
  if (password.length < 5) {
    return { ok: false, error: "Senha deve ter no mínimo 5 caracteres." };
  }
  if (!name || !email.includes("@")) {
    return { ok: false, error: "Preencha nome e e-mail válidos." };
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, name, email }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false, error: body.error || "Falha no cadastro." };
    }
    saveSession(body.token, body.user);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível conectar ao servidor." };
  }
}

export async function refreshSession(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      logout();
      return false;
    }
    const data = await res.json();
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return true;
    }
    logout();
    return false;
  } catch {
    return isAuthenticated();
  }
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Link WhatsApp para suporte (número da loja ou padrão Gestify). */
export function getContactWhatsAppUrl(phone?: string): string {
  const digits = (phone || "5563990000000").replace(/\D/g, "");
  const text = encodeURIComponent("Olá! Preciso de ajuda com o Gestify.");
  return `https://wa.me/${digits}?text=${text}`;
}
