import { useState, useEffect, MouseEvent, FormEvent } from "react";
import { 
  Truck, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  PhoneCall, 
  Tag, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  PlusCircle, 
  X, 
  AlertCircle,
  Building,
  Info
} from "lucide-react";
import { motion } from "motion/react";
import { Supplier } from "../types";
import { withThemeQuery } from "../lib/api";

interface SuppliersPageProps {
  themeId: string;
}

export default function SuppliersPage({ themeId }: SuppliersPageProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Selected Supplier for displaying detailed products
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  // Form state for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Input fields for form
  const [formName, setFormName] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formItemsText, setFormItemsText] = useState(""); // Comma separated raw string

  // State to add a single product to selected supplier details inline
  const [nextItemText, setNextItemText] = useState("");

  // Load suppliers from express db on mount
  const fetchSuppliers = () => {
    setLoading(true);
    fetch(withThemeQuery("/api/suppliers", themeId))
      .then((res) => {
        if (!res.ok) throw new Error("Não foi possível carregar os fornecedores.");
        return res.json();
      })
      .then((data) => {
        const formatted = data.map((item: any) => ({
          ...item,
          items: Array.isArray(item.items) ? item.items : (typeof item.items === "string" ? JSON.parse(item.items) : [])
        }));
        setSuppliers(formatted);
        if (formatted.length > 0 && selectedSupplierId === null) {
          setSelectedSupplierId(formatted[0].id || null);
        }
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao conectar com o servidor.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSuppliers();
  }, [themeId]);

  // Filter list
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.items.some(it => it.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = 
      selectedCategory === "all" || 
      supplier.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Unique categories list for the filter select
  const categoriesList = Array.from(
    new Set(suppliers.map((s) => s.category).filter(Boolean))
  );

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  // Handle edit initiation
  const handleStartEdit = (supplier: Supplier, e: MouseEvent) => {
    e.stopPropagation();
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormContact(supplier.contact);
    setFormCategory(supplier.category);
    setFormActive(supplier.active === 1);
    setFormItemsText(supplier.items.join(", "));
    setIsFormOpen(true);
  };

  const handleStartAdd = () => {
    setEditingSupplier(null);
    setFormName("");
    setFormContact("");
    setFormCategory("");
    setFormActive(true);
    setFormItemsText("");
    setIsFormOpen(true);
  };

  // Submit supplier additions & modifications
  const handleSaveSupplier = (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Por favor, preencha o nome do fornecedor!");
      return;
    }

    // Process comma separated items
    const parsedItems = formItemsText
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const payload = {
      name: formName.trim(),
      contact: formContact.trim(),
      category: formCategory.trim() || "Geral",
      active: formActive ? 1 : 0,
      items: parsedItems
    };

    const isEditing = editingSupplier !== null;
    const url = isEditing ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers";
    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao salvar dados.");
        return res.json();
      })
      .then((data) => {
        // Hydrate data items parsed structure
        const hydrated = {
          ...data,
          items: Array.isArray(data.items) ? data.items : (typeof data.items === "string" ? JSON.parse(data.items) : [])
        };

        if (isEditing) {
          setSuppliers(prev => prev.map(s => s.id === hydrated.id ? hydrated : s));
        } else {
          setSuppliers(prev => [hydrated, ...prev]);
          setSelectedSupplierId(hydrated.id);
        }
        setIsFormOpen(false);
        setEditingSupplier(null);
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  // Delete Supplier
  const handleDeleteSupplier = (id: number, name: string, e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza absoluta de que deseja remover o fornecedor "${name}"?`)) {
      fetch(`/api/suppliers/${id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error("Não foi possível excluir.");
          setSuppliers(prev => prev.filter(s => s.id !== id));
          if (selectedSupplierId === id) {
            setSelectedSupplierId(null);
          }
        })
        .catch((err) => alert(err.message));
    }
  };

  // Add a quick product/raw material to selected supplier
  const handleAddProductToSupplier = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !nextItemText.trim()) return;

    const updatedItems = [...selectedSupplier.items, nextItemText.trim()];
    const payload = {
      ...selectedSupplier,
      items: updatedItems
    };

    fetch(`/api/suppliers/${selectedSupplier.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro de atualização");
        return res.json();
      })
      .then((data) => {
        const hydrated = {
          ...data,
          items: Array.isArray(data.items) ? data.items : (typeof data.items === "string" ? JSON.parse(data.items) : [])
        };
        setSuppliers(prev => prev.map(s => s.id === hydrated.id ? hydrated : s));
        setNextItemText("");
      })
      .catch((err) => console.error("Falha ao salvar item fornecido:", err));
  };

  // Remove a product/raw material from supplier list
  const handleRemoveProductFromSupplier = (itemToRemove: string) => {
    if (!selectedSupplier) return;

    const updatedItems = selectedSupplier.items.filter(it => it !== itemToRemove);
    const payload = {
      ...selectedSupplier,
      items: updatedItems
    };

    fetch(`/api/suppliers/${selectedSupplier.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao remover item");
        return res.json();
      })
      .then((data) => {
        const hydrated = {
          ...data,
          items: Array.isArray(data.items) ? data.items : (typeof data.items === "string" ? JSON.parse(data.items) : [])
        };
        setSuppliers(prev => prev.map(s => s.id === hydrated.id ? hydrated : s));
      })
      .catch((err) => console.error(err));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-grow p-4 md:p-8 flex flex-col min-h-0 relative font-sans text-[#2e2624]"
      id="suppliers-page-container"
    >
      {/* Upper header action area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6" id="suppliers-header-section">
        <div>
          <h1 className="text-2xl font-black text-[#2e2624] tracking-tight flex items-center gap-2">
            <Truck className="text-brand shrink-0" size={26} />
            Gestão de Fornecedores
          </h1>
          <p className="text-xs text-[#7d6f6b] mt-0.5">
            Cadastre seus distribuidores parceiros, marque mercadorias fornecidas e monitore insumos facilmente.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="bg-brand hover:bg-brand-hover text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-sm select-none cursor-pointer"
          id="btn-register-supplier"
        >
          <Plus size={16} />
          Cadastrar Fornecedor
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200/50 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left is Suppliers list, Right is selected details */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column: Suppliers Directory & Filters */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-3xl border border-[#eee7de] shadow-xs overflow-hidden min-h-[400px]">
          {/* Header filter tools */}
          <div className="p-4 bg-[#faf7f2] border-b border-[#eee7de] space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a76]" size={14} />
              <input 
                type="text" 
                placeholder="Buscar por nome, produto ou contato..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#e5dec9] rounded-xl pl-9 pr-4 py-2 text-xs placeholder-[#8a7a76] focus:outline-none focus:border-brand transition-all"
                id="supplier-search-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#7d6f6b] uppercase shrink-0">Filtrar Ramo:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 bg-white border border-[#e5dec9] rounded-lg py-1 px-2.5 text-xs focus:outline-none focus:border-brand"
                id="supplier-category-select"
              >
                <option value="all">Todos os setores</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Suppliers scrollable list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#eee7de]" id="suppliers-list">
            {loading ? (
              <div className="p-12 text-center text-xs text-[#7d6f6b]">Carregando directório de parceiros...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center">
                <Building className="mx-auto text-[#eee7de] mb-3" size={32} />
                <p className="text-xs font-bold text-[#7d6f6b]">Nenhum fornecedor localizado</p>
                <p className="text-[11px] text-[#7d6f6b]/85 mt-1">Experimente buscar por outros termos ou limpe o filtro.</p>
              </div>
            ) : (
              filteredSuppliers.map((supplier) => {
                const isSelected = supplier.id === selectedSupplierId;
                const isActive = supplier.active === 1;

                return (
                  <div
                    key={supplier.id}
                    onClick={() => setSelectedSupplierId(supplier.id || null)}
                    className={`p-4 transition-all cursor-pointer flex justify-between items-center relative ${
                      isSelected 
                        ? "bg-brand/5 border-l-4 border-brand" 
                        : "hover:bg-[#faf7f2]/50 bg-white"
                    }`}
                    id={`supplier-item-${supplier.id}`}
                  >
                    {/* Primary Info */}
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xs text-[#2e2624] truncate max-w-[200px]">
                          {supplier.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full ${
                          isActive 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <p className="text-[10px] text-brand font-semibold mt-1 flex items-center gap-1">
                        <Tag size={10} />
                        {supplier.category}
                      </p>
                      <p className="text-[10px] text-[#7d6f6b] truncate mt-0.5">
                        {supplier.contact || "Sem informações de contato"}
                      </p>
                    </div>

                    {/* Secondary action tools */}
                    <div className="flex items-center gap-1 border-l border-[#eee7de] pl-2.5 shrink-0">
                      <button
                        onClick={(e) => handleStartEdit(supplier, e)}
                        className="p-1.5 text-[#7d6f6b] hover:text-brand hover:bg-brand/10 rounded-lg transition-colors cursor-pointer"
                        title="Modificar Dados"
                        id={`btn-edit-supplier-${supplier.id}`}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSupplier(supplier.id!, supplier.name, e)}
                        className="p-1.5 text-[#7d6f6b] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Fornecedor"
                        id={`btn-delete-supplier-${supplier.id}`}
                      >
                        <Trash2 size={12} />
                      </button>
                      <ChevronRight size={14} className="text-[#8a7a76]/60 ml-1 hidden sm:block" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Suppliers Details (Exibe materias-primas / produtos) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl border border-[#eee7de] shadow-xs overflow-hidden min-h-[400px]">
          {selectedSupplier ? (
            <div className="p-6 flex flex-col h-full justify-between" id="supplier-details-panel">
              <div className="space-y-6">
                
                {/* Visual Banner Block */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#eee7de] pb-5 gap-3">
                  <div>
                    <span className="text-[9px] font-bold tracking-wider text-brand uppercase">{selectedSupplier.category}</span>
                    <h2 className="text-lg font-black text-[#2e2624] tracking-tight">{selectedSupplier.name}</h2>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[#7d6f6b]">
                      <PhoneCall size={12} className="text-brand shrink-0" />
                      <span className="text-xs font-medium font-mono">{selectedSupplier.contact || "Não informado"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#7d6f6b]">Status Comercial:</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${
                      selectedSupplier.active === 1
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-gray-150 text-gray-500"
                    }`}>
                      {selectedSupplier.active === 1 ? (
                        <>
                          <CheckCircle size={13} className="stroke-[2.5]" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} className="stroke-[2.5]" />
                          <span>Inativo</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Subtitle list header */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#7d6f6b] flex items-center gap-1.5">
                      <span>Insumos & Produtos Fornecidos</span>
                      <span className="bg-[#faf7f2] border border-[#e5dec9] text-[10px] text-[#2e2624] font-mono px-1.5 rounded">
                        {selectedSupplier.items.length} itens
                      </span>
                    </h4>
                  </div>

                  <p className="text-xs text-[#7d6f6b] leading-tight">
                    Essas são as matérias-primas e artigos que você compra deste fornecedor. Clique no ícone de "remover" caso tenha descontinuado algum suprimento.
                  </p>

                  {/* Tag List of supplies */}
                  {selectedSupplier.items.length === 0 ? (
                    <div className="p-8 border border-dashed border-[#e5dec9] rounded-2xl text-center bg-[#faf7f2]/30">
                      <p className="text-xs font-bold text-[#7d6f6b]">Nenhum item cadastrado ainda para este fornecedor.</p>
                      <p className="text-[11px] text-[#7d6f6b]/80 mt-1">Adicione itens no campo abaixo para listar as matérias-primas.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5 max-h-[220px] overflow-y-auto p-1" id="supplier-supplied-items-container">
                      {selectedSupplier.items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-[#faf7f2] border border-[#e5dec9] text-[#2e2624] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 group transition-all hover:bg-brand/5 hover:border-brand/55 shadow-2xs"
                        >
                          <span>{item}</span>
                          <button
                            onClick={() => handleRemoveProductFromSupplier(item)}
                            className="text-[#7d6f6b] hover:text-[#b3543d] rounded-full p-0.5 hover:bg-[#b3543d]/10 transition-colors cursor-pointer shrink-0"
                            title="Remover matéria-prima"
                          >
                            <X size={10} className="stroke-[2.5]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline form to add product/supply */}
                <form onSubmit={handleAddProductToSupplier} className="bg-[#faf7f2] border border-[#eee7de] p-4 rounded-2xl relative" id="add-provided-item-form">
                  <h5 className="text-[10px] uppercase font-extrabold tracking-widest text-[#7d6f6b] mb-2.5 flex items-center gap-1.5">
                    <PlusCircle size={12} className="text-brand shrink-0" />
                    Adicionar no catálogo deste fornecedor
                  </h5>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Coca-cola zero lata, Polpa de morango, Açúcar 1kg..."
                      value={nextItemText}
                      onChange={(e) => setNextItemText(e.target.value)}
                      className="flex-grow bg-white border border-[#e5dec9] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand"
                    />
                    <button
                      type="submit"
                      disabled={!nextItemText.trim()}
                      className="bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:hover:scale-100 text-white px-4 py-2 rounded-xl text-xs font-bold transition-transform cursor-pointer"
                    >
                      Inserir
                    </button>
                  </div>
                </form>

              </div>

              {/* Informative advice label */}
              <div className="flex gap-2 p-3 bg-brand/5 border border-brand/10 rounded-xl text-[10px] text-[#7d6f6b] mt-5 self-end w-full leading-tight select-none">
                <Info size={14} className="text-brand shrink-0" />
                <span>Os produtos registrados auxiliam o Gestify a alertá-lo automaticamente quando as matérias-primas atingirem o estoque de alerta mínimo!</span>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center my-auto" id="no-supplier-selected-state">
              <Truck className="mx-auto text-[#eee7de] mb-4 stroke-[1.5]" size={42} />
              <p className="text-xs font-bold text-[#7d6f6b]">Selecione um fornecedor para visualizar os produtos e matérias-primas</p>
              <p className="text-[11px] text-[#7d6f6b]/80 mt-1">Ao selecionar um parceiro do painel lateral, você poderá gerenciar todo o histórico de distribuição.</p>
            </div>
          )}
        </div>

      </div>

      {/* POPUP MODAL: Add/Edit Supplier */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="supplier-form-modal">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border border-[#eee7de] shadow-2xl w-full max-w-lg overflow-hidden text-left"
          >
            {/* Modal Header */}
            <div className="p-5 bg-[#faf7f2] border-b border-[#eee7de] flex justify-between items-center select-none">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#2e2624] flex items-center gap-2">
                <Truck size={14} className="text-brand shrink-0" />
                {editingSupplier ? "Modificar Fornecedor" : "Cadastrar Novo Fornecedor"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-[#7d6f6b] hover:text-[#2e2624] rounded-lg p-1 hover:bg-[#faf7f2] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs font-medium">
              
              <div className="space-y-1">
                <label className="text-[#7d6f6b] font-bold">Nome da Distribuidora/Fornecedor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Distribuidor Coca-Cola, Mercado Central Frutas"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-[#e5dec9] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#7d6f6b] font-bold">Ramo de Atuação / Setor</label>
                  <input
                    type="text"
                    placeholder="Ex: Bebidas, Laticínios, Embalagens"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-white border border-[#e5dec9] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#7d6f6b] font-bold">Contato Comercial (Tel/E-mail)</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 9999-9999 / sac@email.com"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full bg-white border border-[#e5dec9] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#7d6f6b] font-bold">Matérias-primas Iniciais (separadas por vírgula)</label>
                <textarea
                  placeholder="Ex: Manteiga extra, Creme de leite 35%, Leite integral"
                  rows={2}
                  value={formItemsText}
                  onChange={(e) => setFormItemsText(e.target.value)}
                  className="w-full bg-white border border-[#e5dec9] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand resize-none"
                />
                <p className="text-[10px] text-[#7d6f6b]/80">Deixe em branco ou separe por vírgulas para preencher rapidamente.</p>
              </div>

              {/* Toggle switch slider active */}
              <div className="flex items-center gap-3 pt-2 select-none">
                <input
                  type="checkbox"
                  id="supplier-active-form-switch"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-brand focus:ring-brand accent-brand border-[#e5dec9] rounded cursor-pointer"
                />
                <label htmlFor="supplier-active-form-switch" className="text-[#2e2624] font-bold cursor-pointer">
                  Fornecedor Ativo e Operando Comercialização
                </label>
              </div>

              {/* Dialog foot Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-[#eee7de] select-none">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-[#eee7de] text-[#7d6f6b] rounded-xl hover:bg-[#faf7f2] font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
