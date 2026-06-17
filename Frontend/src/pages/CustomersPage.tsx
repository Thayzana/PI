import { FormEvent, useEffect, useState } from "react";
import { UserCircle, UserPlus, Trash2, Edit2, X, Check, Phone } from "lucide-react";
import { apiFetch } from "../lib/api";
import { comparePt } from "../lib/sort";
import { DEFAULT_PAGE_SIZE, paginateItems } from "../lib/pagination";
import PaginationControls from "../components/PaginationControls";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const loadCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/customers");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao carregar clientes.");
      }
      setCustomers(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };
      const res = await apiFetch(
        editingId ? `/api/customers/${editingId}` : "/api/customers",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao salvar cliente.");
      }
      resetForm();
      await loadCustomers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este cliente?")) return;
    const res = await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Falha ao remover.");
      return;
    }
    await loadCustomers();
  };

  const filtered = customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.email || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => comparePt(a.name, b.name));

  const paginatedCustomers = paginateItems(filtered, page, DEFAULT_PAGE_SIZE);

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-page-bg">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#2e2624] flex items-center gap-2">
              <UserCircle size={20} className="text-brand" />
              Cadastro de Clientes
            </h2>
            <p className="text-xs text-[#7d6f6b] mt-1">
              Clientes finais salvos no banco — reutilize em pedidos e entregas.
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold cursor-pointer"
            >
              <UserPlus size={14} />
              Novo cliente
            </button>
          )}
        </div>

        <input
          type="search"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[#eee7de] bg-white text-sm"
        />

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
              <h3 className="text-sm font-bold">{editingId ? "Editar cliente" : "Novo cliente"}</h3>
              <button type="button" onClick={resetForm} className="text-[#7d6f6b] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7d6f6b]">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7d6f6b]">Telefone *</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7d6f6b]">Endereço</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-[#7d6f6b]">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border text-sm min-h-[72px]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold cursor-pointer"
            >
              <Check size={14} />
              Salvar cliente
            </button>
          </form>
        )}

        <div className="bg-white border border-[#eee7de] rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <p className="p-6 text-sm text-[#7d6f6b]">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-[#7d6f6b]">Nenhum cliente encontrado.</p>
          ) : (
            <ul className="divide-y divide-[#eee7de]">
              {paginatedCustomers.map((customer) => (
                <li
                  key={customer.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-[#2e2624]">{customer.name}</p>
                    <p className="text-xs text-[#7d6f6b] flex items-center gap-1 mt-0.5">
                      <Phone size={12} />
                      {customer.phone}
                      {customer.email && ` · ${customer.email}`}
                    </p>
                    {customer.address && (
                      <p className="text-xs text-[#7d6f6b] mt-0.5">{customer.address}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(customer)}
                      className="p-2 text-[#7d6f6b] hover:text-brand cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 text-[#7d6f6b] hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <PaginationControls
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            totalItems={filtered.length}
            onPageChange={setPage}
            className="p-4"
          />
        </div>
      </div>
    </div>
  );
}
