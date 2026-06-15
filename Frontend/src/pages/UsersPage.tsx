import { FormEvent, useEffect, useState } from "react";
import { Shield, UserPlus, Trash2, Edit2, X, Check } from "lucide-react";
import { apiFetch } from "../lib/api";
import { AuthUser } from "../lib/auth";

export default function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "operator" as "admin" | "operator",
    active: true,
  });

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/auth/users");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao carregar usuários.");
      }
      setUsers(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "operator",
      active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        const res = await apiFetch(`/api/auth/users/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            active: form.active,
            password: form.password || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Falha ao atualizar.");
        }
      } else {
        const res = await apiFetch("/api/auth/users", {
          method: "POST",
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Falha ao criar usuário.");
        }
      }
      resetForm();
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  };

  const handleEdit = (user: AuthUser) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      password: "",
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este usuário?")) return;
    const res = await apiFetch(`/api/auth/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Falha ao remover.");
      return;
    }
    await loadUsers();
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-page-bg">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#2e2624] flex items-center gap-2">
              <Shield size={20} className="text-brand" />
              Gerenciamento de Usuários
            </h2>
            <p className="text-xs text-[#7d6f6b] mt-1">
              Operadores e administradores com acesso validado no servidor.
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold cursor-pointer"
            >
              <UserPlus size={14} />
              Novo usuário
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#eee7de] rounded-2xl p-5 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{editingId ? "Editar usuário" : "Novo usuário"}</h3>
              <button type="button" onClick={resetForm} className="text-[#7d6f6b] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {!editingId && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7d6f6b]">Usuário (4–8 dígitos)</label>
                  <input
                    inputMode="numeric"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value.replace(/\D/g, "").slice(0, 8) })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7d6f6b]">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7d6f6b]">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7d6f6b]">
                  {editingId ? "Nova senha (opcional)" : "Senha"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                  required={!editingId}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7d6f6b]">Perfil</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as "admin" | "operator" })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                >
                  <option value="operator">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {editingId && (
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Conta ativa
                </label>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold cursor-pointer"
            >
              <Check size={14} />
              Salvar
            </button>
          </form>
        )}

        <div className="bg-white border border-[#eee7de] rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <p className="p-6 text-sm text-[#7d6f6b]">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-sm text-[#7d6f6b]">Nenhum usuário cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#faf7f2] text-[10px] uppercase text-[#7d6f6b]">
                <tr>
                  <th className="text-left p-3">Usuário</th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Perfil</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-[#eee7de]">
                    <td className="p-3 font-mono">{user.username}</td>
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.role === "admin"
                            ? "bg-brand/10 text-brand"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Operador"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-[#7d6f6b] hover:text-brand cursor-pointer inline-flex"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 text-[#7d6f6b] hover:text-red-600 cursor-pointer inline-flex ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
