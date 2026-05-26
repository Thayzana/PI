import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  TrendingDown, 
  QrCode, 
  Download, 
  Edit3, 
  Trash2, 
  Save, 
  Image as ImageIcon,
  Tag,
  DollarSign,
  Layers,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  ChevronsRight,
  ExternalLink
} from "lucide-react";
import { Product, UNIT_TYPE_OPTIONS, UnitType, isRetailSector } from "../types";
import { withThemeQuery } from "../lib/api";

interface MenuAdminPageProps {
  themeId: string;
}

const RETAIL_CATEGORIES = [
  "Moda Masculina",
  "Moda Feminina",
  "Moda Unissex",
  "Calçados",
  "Acessórios",
];

export default function MenuAdminPage({ themeId }: MenuAdminPageProps) {
  const isRetail = isRetailSector(themeId);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  
  // Custom Form fields for creating/editing products
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Bolos");
  const [imageUrl, setImageUrl] = useState("");
  const [isPromo, setIsPromo] = useState(false);
  const [promoPrice, setPromoPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(20);
  const [minimum, setMinimum] = useState<number>(5);
  const [expiration, setExpiration] = useState("2026-06-30");
  const [barcode, setBarcode] = useState("");
  const [unitType, setUnitType] = useState<UnitType>("Unidade");
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // QR Code URL creation
  const getPublicMenuUrl = () => {
    return `${window.location.origin}?tab=menu-public`;
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getPublicMenuUrl())}`;

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(withThemeQuery("/api/products", themeId));
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Erro ao buscar cardápio:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [themeId]);

  const clearForm = () => {
    setIsEditing(false);
    setEditId(null);
    setName("");
    setPrice(0);
    setDescription("");
    setCategory(isRetail ? "Mercearia" : "Bolos");
    setImageUrl("");
    setIsPromo(false);
    setPromoPrice(0);
    setSku(isRetail ? `VRT-${Math.floor(100 + Math.random() * 900)}` : `PROD-${Math.floor(100 + Math.random() * 900)}`);
    setStock(20);
    setMinimum(5);
    setExpiration("2026-06-30");
    setBarcode("");
    setUnitType("Unidade");
    setWholesalePrice(0);
  };

  const showToast = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const DESSERT_SUGGESTIONS = [
    { name: "Brigadeiro", url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80" },
    { name: "Bolo de Pote", url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&q=80" },
    { name: "Torta/Cheesecake", url: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=500&q=80" },
    { name: "Macaron", url: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&q=80" },
    { name: "Cupcake", url: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500&q=80" },
    { name: "Red Velvet", url: "https://images.unsplash.com/photo-1616260841585-0457aa334645?w=500&q=80" },
  ];

  const FASHION_SUGGESTIONS = [
    { name: "Camiseta Classic", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80" },
    { name: "Tênis Slip-on", url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80" },
    { name: "Bolsa Couro", url: "https://images.unsplash.com/photo-1584917865442-de89d76a96c8?w=500&q=80" },
    { name: "Calça Jeans", url: "https://images.unsplash.com/photo-1473966962644-7e3e24439b0a?w=500&q=80" },
    { name: "Óculos Noir", url: "https://images.unsplash.com/photo-1572635196233-2244a6320d8?w=500&q=80" },
    { name: "Vestido Midi", url: "https://images.unsplash.com/photo-1595777457583-95e059a8aead?w=500&q=80" },
  ];

  const photoSuggestions = isRetail ? FASHION_SUGGESTIONS : DESSERT_SUGGESTIONS;

  // Simulated photo upload
  const handlePhotoUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        showToast(isRetail ? "Foto do produto carregada!" : "Foto do doce carregada!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (prod: Product) => {
    setIsEditing(true);
    setEditId(prod.id || null);
    setName(prod.name);
    setSku(prod.sku);
    setPrice(prod.price || 0);
    setDescription(prod.description || "");
    setCategory(prod.category || "Bolos");
    setImageUrl(prod.image_url || "");
    setIsPromo(!!prod.is_promo);
    setPromoPrice(prod.promo_price || 0);
    setStock(prod.stock);
    setMinimum(prod.minimum);
    setExpiration(prod.expiration);
    setBarcode(prod.barcode || "");
    setUnitType(prod.unit_type || "Unidade");
    setWholesalePrice(prod.wholesale_price || 0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto do cardápio?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Produto removido do cardápio!", "success");
        setProducts(products.filter(p => p.id !== id));
        clearForm();
      } else {
        showToast("Erro ao remover produto.", "error");
      }
    } catch (e) {
      showToast("Não foi possível conectar ao servidor.", "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Digite o nome do produto.", "error");
      return;
    }
    if (price <= 0) {
      showToast("Insira um valor maior que R$ 0.", "error");
      return;
    }
    if (isPromo && (promoPrice <= 0 || promoPrice >= price)) {
      showToast("O preço promocional de desconto deve ser maior que 0 e menor que o preço original.", "error");
      return;
    }

    const payload: Record<string, unknown> = {
      sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
      name,
      stock: Number(stock),
      minimum: Number(minimum),
      expiration: expiration || "2026-06-30",
      status: stock <= minimum ? "Baixo" : "OK",
      price: Number(price),
      description,
      image_url: imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80",
      category,
      is_promo: isPromo,
      promo_price: isPromo ? Number(promoPrice) : undefined,
    };
    if (isRetail) {
      payload.barcode = barcode.trim();
      payload.unit_type = unitType;
      if (wholesalePrice > 0) payload.wholesale_price = Number(wholesalePrice);
    }

    try {
      const url = isEditing ? `/api/products/${editId}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEditing ? "Produto atualizado com sucesso!" : "Produto adicionado ao cardápio com sucesso!", "success");
        loadProducts();
        clearForm();
      } else {
        const err = await res.json();
        showToast(err.error || "Erro ao salvar produto.", "error");
      }
    } catch (e) {
      showToast("Erro de rede ao salvar.", "error");
    }
  };

  // Discount % helper calculation
  const calculateDiscountPercent = (orig: number, promo: number) => {
    if (!orig || !promo || promo >= orig) return 0;
    return Math.round(((orig - promo) / orig) * 100);
  };

  // Filtering products
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(searchQuery.trim()));
    
    if (selectedCategory === "Todos") return matchesSearch;
    return matchesSearch && p.category === selectedCategory;
  });

  // Unique categories list
  const categoriesList = isRetail
    ? ["Todos", "Moda Masculina", "Moda Feminina", "Moda Unissex", "Calçados", "Acessórios"]
    : ["Todos", "Bolos", "Docinhos", "Tortas", "Bebidas"];

  return (
    <div className="flex-grow flex flex-col p-4 md:p-8 overflow-y-auto bg-[#faf6f2] font-sans" id="menu-admin-page">
      
      {/* Toast notification message block */}
      {message && (
        <div className={`fixed top-4 right-4 z-55 flex items-center gap-2 p-4 rounded-xl shadow-lg border text-xs font-bold transition-all ${
          message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {message.type === "success" ? <Sparkles size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header element */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-[#2e2624] tracking-tight flex items-center gap-2">
            <BookOpen className="text-brand shrink-0" size={24} />
            Cardápio Digital & QR Code
          </h2>
          <p className="text-xs text-[#7d6f6b]">
            Configure os itens de venda direta, lance preços promocionais com relatórios de desconto e exporte o QR Code do seu balcão ou site.
          </p>
        </div>

        <a 
          href={getPublicMenuUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold px-3 py-2 rounded-xl border border-brand/20 inline-flex items-center gap-1.5 transition-all text-center"
        >
          <ExternalLink size={14} />
          Ver Cardápio Público
        </a>
      </div>

      {/* Body Area Split Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
        
        {/* Left column - Lists & QR Code element */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* QR Code Presentation Box */}
          <div className="bg-white rounded-2xl border border-[#eee7de] shadow-2xs p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-[#fad6cc]/20 p-4 rounded-2xl flex items-center justify-center shrink-0 border border-brand/10">
              <img 
                src={qrCodeUrl} 
                alt="Cardápio Digital QR Code" 
                className="w-28 h-28 mix-blend-multiply" 
                crossOrigin="anonymous"
              />
            </div>
            
            <div className="space-y-2 text-center sm:text-left flex-1">
              <span className="inline-flex items-center gap-1 bg-[#faf0ed] text-brand border border-[#faf0ed] text-[9px] font-black uppercase tracking-wider py-1 px-2 rounded-md">
                <QrCode size={12} />
                Mesa & Delivery Conectado
              </span>
              <h4 className="text-xs font-black text-[#2e2624]">
                Link do seu Cardápio Digital
              </h4>
              <p className="text-[10px] text-[#7d6f6b] max-w-sm line-clamp-1 border-b border-gray-100 pb-2">
                {getPublicMenuUrl()}
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <a
                  href={qrCodeUrl}
                  download="qrcode_gestify_cardapio.png"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-brand hover:bg-brand-hover text-white text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Download size={12} />
                  Baixar QR Code (PNG)
                </a>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getPublicMenuUrl());
                    showToast("Link copiado para a área de transferência!", "success");
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LinkIcon size={12} />
                  Copiar Link
                </button>
              </div>
            </div>
          </div>

          {/* Cards & Items Listing section */}
          <div className="bg-white rounded-2xl border border-[#eee7de] shadow-2xs overflow-hidden">
            
            {/* Filtering parameters and query inputs */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar doce, ingrediente ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2e2624] placeholder-gray-400 focus:outline-none focus:border-brand transition-all"
                />
              </div>

              {/* Fast Categories tabs buttons */}
              <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      selectedCategory === cat
                        ? "bg-[#2e2624] text-white border-[#2e2624]"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Render loop list */}
            <div className="p-4 space-y-3 divide-y divide-gray-100/60 min-h-[300px]">
              {loading ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs">Buscando sobremesas do cardápio...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-xs">
                  <ImageIcon size={36} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-bold">Nenhum doce cadastrado nesta categoria</p>
                  <p className="text-[10px]">Lançe um item usando o painel lateral.</p>
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const hasPromo = !!prod.is_promo;
                  return (
                    <div key={prod.id} className="pt-3.5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-3">
                        <img 
                          src={prod.image_url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&q=80"} 
                          alt={prod.name}
                          className="w-14 h-14 object-cover rounded-xl border border-gray-150 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&q=80";
                          }}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-[#2e2624]">{prod.name}</span>
                            <span className="text-[9px] bg-gray-100 py-0.5 px-1.5 rounded text-gray-500 font-bold">{prod.category || "Docinhos"}</span>
                            
                            {hasPromo && (
                              <span className="text-[9px] bg-red-50 text-red-700 border border-red-100 rounded px-1.5 py-0.5 font-bold inline-flex items-center gap-0.5">
                                <TrendingDown size={10} />
                                Desconto {calculateDiscountPercent(prod.price || 0, prod.promo_price || 0)}%
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 line-clamp-2 max-w-sm font-medium">
                            {prod.description || "Sem descrição detalhada configurada para exibição no cardápio público."}
                          </p>
                          <span className="block font-mono text-[9px] text-brand font-bold">SKU: {prod.sku}</span>
                        </div>
                      </div>

                      {/* Controls and prices actions for list items */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 border-gray-50 gap-4 shrink-0">
                        <div className="text-left sm:text-right">
                          {hasPromo ? (
                            <div className="space-y-0.5">
                              <span className="block line-through text-gray-400 text-[10px] font-semibold">
                                R$ {Number(prod.price).toFixed(2)}
                              </span>
                              <span className="block text-xs font-black font-mono text-emerald-700 font-bold">
                                R$ {Number(prod.promo_price).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="block text-xs font-black font-mono text-[#2c2221]">
                              R$ {Number(prod.price || 0).toFixed(2)}
                            </span>
                          )}
                          <span className="block text-[9px] text-gray-400">Estoque: {prod.stock} un</span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(prod)}
                            className="p-1.5 text-gray-500 hover:text-brand hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-150 transition-all"
                            title="Editar doce"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id!)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer border border-transparent hover:border-red-150 transition-all"
                            title="Deletar doce"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column - Input edit form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-[#eee7de] shadow-2xs p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xs font-black text-[#2e2624] uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-brand" />
                {isEditing
                  ? (isRetail ? "Editar produto do catálogo" : "Editar Produto do Cardápio")
                  : (isRetail ? "Adicionar produto ao catálogo" : "Adicionar Doce no Cardápio")}
              </h3>
              
              {isEditing && (
                <button
                  onClick={clearForm}
                  className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#7d6f6b] uppercase">
                  {isRetail ? "Nome do produto *" : "Nome do Doce / Título *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isRetail ? "Ex: Arroz Tipo 1 — 5kg" : "Ex: Torta Holandesa Inteira"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs text-[#2c2221] placeholder-gray-400 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7d6f6b] uppercase">Preço de Venda (R$) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={price || ""}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-[#2c2221] focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7d6f6b] uppercase">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs text-[#2c2221] focus:outline-none focus:border-brand"
                  >
                    {isRetail ? (
                      RETAIL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    ) : (
                      <>
                        <option value="Bolos">🎂 Bolos</option>
                        <option value="Docinhos">🍬 Docinhos</option>
                        <option value="Tortas">🥧 Tortas</option>
                        <option value="Bebidas">☕ Bebidas</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {isRetail && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7d6f6b] uppercase">Código EAN</label>
                    <input
                      type="text"
                      placeholder="789..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value.replace(/\D/g, "").slice(0, 13))}
                      className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7d6f6b] uppercase">Unidade</label>
                    <select
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value as UnitType)}
                      className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                    >
                      {UNIT_TYPE_OPTIONS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7d6f6b] uppercase">Preço atacado (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={wholesalePrice || ""}
                      onChange={(e) => setWholesalePrice(Number(e.target.value))}
                      className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#7d6f6b] uppercase">Descrição Detalhada para o Cliente</label>
                <textarea
                  rows={2}
                  placeholder="Descreva o tamanho, ingredientes em destaque, peso aproximado de entrega e rendimento, ex: Molhada com calda de coco..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs text-[#2c2221] placeholder-gray-400 focus:outline-none focus:border-brand resize-none"
                />
              </div>

              {/* Photo Select suggestions and file inputs */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#7d6f6b] uppercase block">Foto do Doce (Upload ou Presets)</label>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <label className="border border-dashed border-[#eee7de] hover:border-brand bg-gray-50/50 hover:bg-[#faf0ed] rounded-lg p-2 text-center cursor-pointer flex flex-col items-center justify-center transition-all">
                    <ImageIcon className="text-[#a89590]" size={16} />
                    <span className="text-[9px] font-black text-[#7d6f6b] mt-0.5">Fazer Upload</span>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUploadSimulate}
                      className="hidden"
                    />
                  </label>

                  {/* Manual photo url input */}
                  <div className="space-y-1">
                    <input 
                      type="text"
                      placeholder="Ou digite uma URL de foto..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1.5 text-[10px] placeholder-gray-400 focus:outline-none focus:border-brand"
                    />
                    <span className="block text-[8px] text-gray-400 font-bold leading-none">Recomendado formato quadrado</span>
                  </div>
                </div>

                {/* Suggestions quick pickers */}
                <div className="space-y-1 mt-1">
                  <span className="text-[8px] text-[#7d6f6b] uppercase font-bold tracking-wider block">Fotos Profissionais Rápidas</span>
                  <div className="flex flex-wrap gap-1 leading-none">
                    {photoSuggestions.map((dItem) => (
                      <button
                        key={dItem.name}
                        type="button"
                        onClick={() => {
                          setImageUrl(dItem.url);
                          showToast(`Foto de ${dItem.name} aplicada!`, "success");
                        }}
                        className={`text-[8px] px-2 py-1 rounded font-bold border transition-all cursor-pointer ${
                          imageUrl === dItem.url 
                            ? "bg-brand text-white border-brand" 
                            : "bg-white text-gray-500 border-gray-250 hover:bg-gray-50"
                        }`}
                      >
                        {dItem.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image preview frame if present */}
                {imageUrl && (
                  <div className="relative w-full h-16 rounded-xl overflow-hidden border border-gray-150 mt-1">
                    <img 
                      src={imageUrl} 
                      alt="Product preview thumbnail" 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 cursor-pointer"
                    >
                      <Plus size={10} className="rotate-45" />
                    </button>
                  </div>
                )}
              </div>

              {/* Promotions Engine section with toggle */}
              <div className="bg-[#faf6f2]/80 border border-[#eee7de] p-3 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-[#2e2624] block uppercase">Ativar Promoção com Desconto?</span>
                    <p className="text-[10px] text-[#7d6f6b] leading-tight font-medium">Exibe uma etiqueta de oferta no cardápio público.</p>
                  </div>
                  
                  {/* Switch slider toggle elements */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPromo}
                      onChange={(e) => setIsPromo(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-305 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {isPromo && (
                  <div className="grid grid-cols-2 gap-3 pt-1 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-emerald-800 uppercase">Preço Promocional (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required={isPromo}
                        placeholder="0.00"
                        value={promoPrice || ""}
                        onChange={(e) => setPromoPrice(Number(e.target.value))}
                        className="w-full bg-white border border-[#eee7de] rounded-lg px-2 py-1.5 text-xs font-mono text-emerald-900 focus:outline-none focus:border-emerald-600 font-bold"
                      />
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 flex flex-col justify-center leading-none text-center">
                      <span className="text-[8px] text-emerald-800 uppercase block font-bold leading-normal">Desconto Calculado</span>
                      <span className="font-mono text-xs font-black text-emerald-700">
                        {calculateDiscountPercent(price, promoPrice)}% OFF
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Administrative Inventory defaults collapsable fields toggler */}
              <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-2">
                <div className="flex-1 min-w-[70px] space-y-1">
                  <label className="text-[9px] text-[#7d6f6b]">Estoque Inicial</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1 text-[10px]"
                  />
                </div>
                <div className="flex-1 min-w-[70px] space-y-1">
                  <label className="text-[9px] text-[#7d6f6b]">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={minimum}
                    onChange={(e) => setMinimum(Number(e.target.value))}
                    className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1 text-[10px]"
                  />
                </div>
                <div className="flex-1 min-w-[90px] space-y-1">
                  <label className="text-[9px] text-[#7d6f6b]">Data Validade</label>
                  <input
                    type="date"
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1 text-[10px] font-mono"
                  />
                </div>
              </div>

              {/* Form submit/save button */}
              <button
                type="submit"
                className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 text-xs font-black rounded-xl cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Save size={14} />
                {isEditing ? "Atualizar Doce" : "Cadastrar Doce no Cardápio"}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
