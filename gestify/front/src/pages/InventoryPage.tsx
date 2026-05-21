import React, { useState } from "react";
import { Package, AlertTriangle, Clock, Search, Plus, Trash2, Calendar, Barcode } from "lucide-react";
import { Product, UNIT_TYPE_OPTIONS, UnitType, isRetailSector } from "../types";

interface InventoryPageProps {
  products: Product[];
  onProductsUpdated: () => void;
  loading: boolean;
  themeId: string;
}

function formatUnitLabel(unit?: UnitType): string {
  if (!unit || unit === "Unidade") return "un";
  if (unit === "Kg") return "kg";
  if (unit === "Litro") return "L";
  return unit.toLowerCase();
}

export default function InventoryPage({ products, onProductsUpdated, loading, themeId }: InventoryPageProps) {
  const isRetail = isRetailSector(themeId);
  // Local list filter toggles
  const [filterType, setFilterType] = useState<"all" | "low" | "expiry">("all");
  const [search, setSearch] = useState("");

  // Product Formulation Form toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState(10);
  const [newMinimum, setNewMinimum] = useState(5);
  const [newExpiration, setNewExpiration] = useState(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // default 10 days out
  );
  const [newBarcode, setNewBarcode] = useState("");
  const [newUnitType, setNewUnitType] = useState<UnitType>("Unidade");
  const [newWholesalePrice, setNewWholesalePrice] = useState<number | "">("");

  const [saving, setSaving] = useState(false);

  // Helper date calculator
  const checkNearExpiry = (dateStr: string) => {
    if (isRetail && dateStr.startsWith("LOTE-")) {
      return false;
    }
    const today = new Date();
    const expDate = new Date(dateStr);
    if (Number.isNaN(expDate.getTime())) return false;
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Compute stats on current loaded products
  const totalSkusCount = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.minimum).length;
  const nearExpiryCount = products.filter(p => checkNearExpiry(p.expiration)).length;

  // Filter products based on search and toggled category
  const filteredProducts = products.filter(p => {
    // Search query
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(search.trim()));
    
    // Category tabs
    if (filterType === "low") {
      return matchSearch && (p.stock <= p.minimum);
    }
    if (filterType === "expiry") {
      return matchSearch && checkNearExpiry(p.expiration);
    }
    return matchSearch;
  });

  // Calculate status badge dynamically
  const getProductStatus = (p: Product) => {
    if (checkNearExpiry(p.expiration)) {
      return { label: "Vencendo", colorClass: "bg-rose-50 text-rose-600 border-rose-100" };
    }
    if (p.stock <= p.minimum) {
      return { label: "Baixo", colorClass: "bg-amber-50 text-amber-600 border-amber-100" };
    }
    return { label: "OK", colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100" };
  };

  // Add submission handler
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim() || !newExpiration) {
      alert("Por favor preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      // Determine status
      let calculatedStatus = "OK";
      if (checkNearExpiry(newExpiration)) {
        calculatedStatus = "Vencendo";
      } else if (newStock <= newMinimum) {
        calculatedStatus = "Baixo";
      }

      const payload: Record<string, unknown> = {
        sku: newSku.toUpperCase().trim(),
        name: newName.trim(),
        stock: Number(newStock),
        minimum: Number(newMinimum),
        expiration: newExpiration,
        status: calculatedStatus,
      };
      if (isRetail) {
        payload.barcode = newBarcode.trim();
        payload.unit_type = newUnitType;
        if (newWholesalePrice !== "" && Number(newWholesalePrice) > 0) {
          payload.wholesale_price = Number(newWholesalePrice);
        }
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onProductsUpdated();
        setShowAddForm(false);
        // Reset state
        setNewSku("");
        setNewName("");
        setNewStock(10);
        setNewMinimum(5);
        setNewBarcode("");
        setNewUnitType("Unidade");
        setNewWholesalePrice("");
      } else {
        const err = await res.json();
        alert("Erro ao inserir: " + (err.error || "SKU duplicado ou inválido."));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Deseja realmente excluir "${name}" do inventário?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        onProductsUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickAddSku = (skuPrefix: string) => {
    const randomN = Math.floor(100 + Math.random() * 900);
    setNewSku(`${skuPrefix}-${randomN}`);
  };

  const handleQuickEan = () => {
    const prefix = "789";
    const body = String(Math.floor(1000000000 + Math.random() * 9000000000)).slice(0, 10);
    setNewBarcode(`${prefix}${body}`);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-page-bg text-[#2c2221] font-sans space-y-6" id="inventory-page">
      
      {/* Upper Quick Summary counter cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* SKUs Counter */}
        <div className="bg-white border border-[#eee7de] p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#7d6f6b]">
              {isRetail ? "Total de SKUs no catálogo" : "Total de SKUS catalogados"}
            </span>
            <h4 className="text-2xl font-bold font-mono text-[#2e2624]">{totalSkusCount}</h4>
          </div>
          <div className="p-3 bg-brand-bg text-brand rounded-xl">
            <Package size={20} />
          </div>
        </div>

        {/* Low stocks total cards */}
        <div className="bg-white border border-[#eee7de] p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#7d6f6b]">Alerta de Estoque Baixo</span>
            <h4 className="text-2xl font-bold font-mono text-amber-600">{lowStockCount}</h4>
          </div>
          <div className="p-3 bg-[#faf7f2] text-amber-600 rounded-xl">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Expiration count cards */}
        <div className="bg-white border border-[#eee7de] p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#7d6f6b]">
              {isRetail ? "Alerta de lote / reposição" : "Próximos do Vencimento"}
            </span>
            <h4 className="text-2xl font-bold font-mono text-rose-600">{nearExpiryCount}</h4>
          </div>
          <div className="p-3 bg-[#faf7f2] text-rose-600 rounded-xl">
            <Clock size={20} />
          </div>
        </div>

      </div>

      {/* Main product catalog grid */}
      <div className="bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm space-y-5" id="inventory-card">
        
        {/* Inner header controller toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eee7de] pb-4">
          <div className="space-y-1">
            <h3 className="font-bold text-[#2e2624] text-base">
              {isRetail ? "Catálogo de mercadorias" : "Tabela de Produtos"}
            </h3>
            <p className="text-xs text-[#7d6f6b]">
              {isRetail
                ? "EAN, unidades de venda, estoque mínimo e validade em tempo real"
                : "Acompanhamento em tempo real de matérias-primas e confeitos"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            {/* Table internal search box */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a76]" />
              <input
                id="inventory-search-input"
                type="text"
                placeholder={isRetail ? "Nome, SKU ou EAN..." : "Filtrar tabela..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-brand-bg border border-[#e5dec9]/60 rounded-xl text-xs text-[#2e2624] placeholder-[#8a7a76] focus:outline-none focus:border-brand"
              />
            </div>

            {/* Quick Category Tab click filters */}
            <div className="flex items-center rounded-lg bg-[#faf7f2] border border-[#e5dec9]/60 p-0.5 font-sans" id="filter-tabs">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 rounded-md text-xs font-bold select-none cursor-pointer transition-all ${
                  filterType === "all" ? "bg-brand text-white shadow-sm" : "text-[#7d6f6b] hover:text-[#2e2624]"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("low")}
                className={`px-3 py-1 rounded-md text-xs font-bold select-none cursor-pointer transition-all ${
                  filterType === "low" ? "bg-brand text-white shadow-sm" : "text-[#7d6f6b] hover:text-[#2e2624]"
                }`}
              >
                Baixos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("expiry")}
                className={`px-3 py-1 rounded-md text-xs font-bold select-none cursor-pointer transition-all ${
                  filterType === "expiry" ? "bg-brand text-white shadow-sm" : "text-[#7d6f6b] hover:text-[#2e2624]"
                }`}
              >
                {isRetail ? "Lote" : "Validade"}
              </button>
            </div>

            {/* Toggle show new product insert modal */}
            <button
              id="btn-toggle-add-product"
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-1.5 bg-brand hover:opacity-90 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>{isRetail ? "Novo Produto" : "Novo Insumo"}</span>
            </button>

          </div>
        </div>

        {/* Inline new product insertion form block */}
        {showAddForm && (
          <form 
            onSubmit={handleAddProductSubmit} 
            className="p-5 rounded-2xl border border-[#eee7de] bg-[#faf7f2] space-y-4"
            id="new-product-form"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-brand">
                {isRetail ? "Cadastrar mercadoria no estoque" : "Cadastrar novo item no estoque"}
              </h4>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="text-xs text-[#7d6f6b] hover:text-[#2e2624] font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRetail ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
              
              <div>
                <label className="text-[10px] font-bold text-[#7d6f6b] uppercase block">SKU do produto</label>
                <div className="flex gap-1.5 mt-1">
                  <input
                    type="text"
                    required
                    placeholder={isRetail ? "ex: VRT-204" : "ex: BRG-008"}
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full bg-white border border-[#e5dec9]/75 px-3 py-2 rounded-xl text-xs text-[#2e2624] focus:outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickAddSku(isRetail ? "VRT" : "CON")}
                    className="px-2.5 bg-brand-bg border border-[#e5dec9]/60 text-[10px] font-bold text-brand rounded-lg hover:opacity-80 cursor-pointer"
                    title="Gerar SKU automático"
                  >
                    Auto
                  </button>
                </div>
              </div>

              {isRetail && (
                <div>
                  <label className="text-[10px] font-bold text-[#7d6f6b] uppercase block">Código EAN</label>
                  <div className="flex gap-1.5 mt-1">
                    <input
                      type="text"
                      placeholder="789..."
                      value={newBarcode}
                      onChange={(e) => setNewBarcode(e.target.value.replace(/\D/g, "").slice(0, 13))}
                      className="w-full bg-white border border-[#e5dec9]/75 px-3 py-2 rounded-xl text-xs font-mono text-[#2e2624] focus:outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={handleQuickEan}
                      className="px-2.5 bg-brand-bg border border-[#e5dec9]/60 text-brand rounded-lg hover:opacity-80 cursor-pointer"
                      title="Gerar EAN fictício"
                    >
                      <Barcode size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-[#7d6f6b] uppercase block">Nome do Produto</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Creme de Leite"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full mt-1 bg-white border border-[#e5dec9]/75 px-3 py-2 rounded-xl text-xs text-[#2e2624] focus:outline-none focus:border-brand"
                />
              </div>

              {isRetail && (
                <div>
                  <label className="text-[10px] font-bold text-[#7d6f6b] uppercase block">Unidade</label>
                  <select
                    value={newUnitType}
                    onChange={(e) => setNewUnitType(e.target.value as UnitType)}
                    className="w-full mt-1 bg-white border border-[#e5dec9]/75 px-3 py-2 rounded-xl text-xs text-[#2e2624] focus:outline-none focus:border-brand cursor-pointer"
                  >
                    {UNIT_TYPE_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-[#7d6f6b] uppercase block">Estoque Atual</label>
                <input
                  type="number"
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-white border border-[#e5dec9]/75 px-3 py-2 rounded-xl text-xs text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7d6f6b] uppercase block">Estoque Mínimo</label>
                <input
                  type="number"
                  required
                  value={newMinimum}
                  onChange={(e) => setNewMinimum(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-white border border-[#e5dec9]/75 px-3 py-2 rounded-xl text-xs text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7d6f6b] uppercase block">
                  {isRetail ? "Lote / Lançamento" : "Vencimento"}
                </label>
                <input
                  type={isRetail ? "text" : "date"}
                  required
                  value={newExpiration}
                  onChange={(e) => setNewExpiration(e.target.value)}
                  placeholder={isRetail ? "LOTE-2026-A" : undefined}
                  className="w-full mt-1 bg-white border border-[#e5dec9]/75 px-3 py-2 rounded-xl text-xs text-[#2e2624] focus:outline-none focus:border-brand cursor-pointer"
                />
              </div>

              {isRetail && (
                <div>
                  <label className="text-[10px] font-bold text-[#7d6f6b] uppercase block">Preço atacado (opc.)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="R$ 0,00"
                    value={newWholesalePrice}
                    onChange={(e) => setNewWholesalePrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full mt-1 bg-white border border-[#e5dec9]/75 px-3 py-2 rounded-xl text-xs text-[#2e2624] focus:outline-none focus:border-brand"
                  />
                </div>
              )}

            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-brand hover:opacity-90 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {saving ? "Registrando..." : "Cadastrar Produto"}
              </button>
            </div>
          </form>
        )}

        {/* Catalog Table Block */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-[#7d6f6b] py-8 text-center font-sans animate-pulse">Buscando itens de estoque do servidor SQLite...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm font-semibold text-[#2e2624]">Nenhum produto cadastrado encontrado</p>
              <p className="text-xs text-[#7d6f6b]">Limpe a pesquisa ou cadastre novos ingredientes!</p>
            </div>
          ) : (
            <table className="w-full text-left font-sans text-xs border-collapse" id="inventory-table">
              
              {/* Header column */}
              <thead>
                <tr className="border-b border-[#eee7de] text-[#7d6f6b] font-bold uppercase select-none">
                  <th className="py-3 px-4">SKU</th>
                  {isRetail && <th className="py-3 px-4">EAN</th>}
                  <th className="py-3 px-4">Produto</th>
                  {isRetail && <th className="py-3 px-4 text-center">Unidade</th>}
                  <th className="py-3 px-4 text-center">Estoque</th>
                  <th className="py-3 px-4 text-center">Mínimo</th>
                  {isRetail && <th className="py-3 px-4 text-center">Atacado</th>}
                  <th className="py-3 px-4 text-center">{isRetail ? "Lote / Lançamento" : "Data Validade"}</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-2 text-center">Ações</th>
                </tr>
              </thead>

              {/* Rows block */}
              <tbody className="divide-y divide-[#eee7de]">
                {filteredProducts.map((p) => {
                  const statusInfo = getProductStatus(p);
                  const isExpiringSoon = statusInfo.label === "Vencendo";
                  const isLow = statusInfo.label === "Baixo";
                  
                  // Adjusting custom light status badges mapping colorClasses cleanly
                  let badgeColors = "bg-emerald-50 text-emerald-600 border-emerald-150";
                  if (isExpiringSoon) {
                    badgeColors = "bg-rose-50 text-rose-600 border-rose-150";
                  } else if (isLow) {
                    badgeColors = "bg-amber-50 text-amber-600 border-amber-150";
                  }

                  // Turn ISO date into Brazilian date string
                  let ptDate = p.expiration;
                  if (!isRetail) {
                    try {
                      const d = new Date(p.expiration);
                      ptDate = d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
                    } catch (err) {}
                  }

                  return (
                    <tr 
                      key={p.id} 
                      className="hover:bg-[#faf7f2]/40 transition-colors"
                      id={`row-product-${p.id}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-brand">
                        {p.sku}
                      </td>
                      {isRetail && (
                        <td className="py-3.5 px-4 font-mono text-[10px] text-[#7d6f6b]">
                          {p.barcode || "—"}
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-semibold text-[#2e2624]">
                        {p.name}
                      </td>
                      {isRetail && (
                        <td className="py-3.5 px-4 text-center text-[10px] font-bold text-[#7d6f6b]">
                          {p.unit_type || "Unidade"}
                        </td>
                      )}
                      <td className={`py-3.5 px-4 text-center font-mono font-extrabold ${isLow ? "text-amber-600" : isExpiringSoon ? "text-rose-600" : "text-emerald-600"}`}>
                        {p.stock} {formatUnitLabel(p.unit_type)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[#7d6f6b]">
                        {p.minimum} {formatUnitLabel(p.unit_type)}
                      </td>
                      {isRetail && (
                        <td className="py-3.5 px-4 text-center font-mono text-[#7d6f6b]">
                          {p.wholesale_price != null
                            ? p.wholesale_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-center font-mono text-[#7d6f6b]">
                        <div className="flex items-center justify-center gap-1.5 text-[#7d6f6b]">
                           <Calendar size={12} className="text-[#8a7a76]" />
                          <span>{ptDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full border ${badgeColors}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => p.id && handleDeleteProduct(p.id, p.name)}
                          className="text-[#7d6f6b] hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Excluir produto do inventário"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          )}
        </div>

      </div>

    </div>
  );
}
