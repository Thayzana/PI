import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  MapPin, 
  Store, 
  Truck, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  FileText, 
  Check, 
  ArrowLeft,
  X,
  CreditCard,
  QrCode,
  DollarSign,
  Search,
  CheckCircle,
  Loader2,
  Info
} from "lucide-react";
import { Product, Order, OrderItem, isRetailSector } from "../types";
import { withThemeQuery } from "../lib/api";

interface PublicMenuSimulatorProps {
  themeId: string;
}

export default function PublicMenuSimulator({ themeId }: PublicMenuSimulatorProps) {
  const isRetail = isRetailSector(themeId);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  
  // Shopping Cart state
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [step, setStep] = useState<"catalog" | "checkout" | "success">("catalog");

  // Checkout form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutType, setCheckoutType] = useState<"Retirada" | "Delivery">("Delivery");
  const [paymentMethod, setPaymentMethod] = useState<"Pix" | "Cartão" | "Dinheiro">("Pix");
  
  // Address / Cep states
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  
  // Delivery Fee
  const [deliveryFee, setDeliveryFee] = useState<number>(8.00); 

  // Success screen details
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  const loadCardapio = async () => {
    try {
      setLoading(true);
      const res = await fetch(withThemeQuery("/api/products", themeId));
      if (res.ok) {
        const data = await res.json();
        // Fallback to prices if products don't have them yet
        const populated = data.map((item: any) => ({
          ...item,
          price: item.price || 12.00,
          category: item.category || (isRetail ? "Moda Unissex" : "Bolos")
        }));
        setProducts(populated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCardapio();
  }, [themeId]);

  const handleCepLookup = async (cepVal: string) => {
    const rawCep = cepVal.replace(/\D/g, "");
    if (rawCep.length !== 8) return;

    try {
      setLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (!data.erro) {
          setRua(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setEstado(data.uf || "");
          
          // Auto rate adjustments based on neighborhood distance approximation
          if (data.bairro?.toLowerCase().includes("centro") || data.bairro?.toLowerCase().includes("bela") || data.bairro?.toLowerCase().includes("paulista")) {
            setDeliveryFee(6.00);
          } else {
            setDeliveryFee(10.00);
          }
        }
      }
    } catch (err) {
      console.error("Erro no CEP:", err);
    } finally {
      setLoadingCep(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingIdx = cartItems.findIndex(i => i.product.id === product.id);
    if (existingIdx !== -1) {
      const updated = [...cartItems];
      updated[existingIdx].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }]);
    }
  };

  const updateCartQty = (idx: number, delta: number) => {
    const updated = [...cartItems];
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else {
      updated[idx].quantity = newQty;
    }
    setCartItems(updated);
  };

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const actualPrice = item.product.is_promo && item.product.promo_price 
        ? item.product.promo_price 
        : (item.product.price || 0);
      return acc + (actualPrice * item.quantity);
    }, 0);
  };

  const getFinalTotal = () => {
    const sub = getSubtotal();
    if (checkoutType === "Delivery") {
      return sub + deliveryFee;
    }
    return sub;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Por favor, informe seu nome e telefone para contato.");
      return;
    }

    if (checkoutType === "Delivery" && (!rua || !numero || !bairro)) {
      alert("Para a entrega, informe os dados de endereço completos.");
      return;
    }

    // Map cart items for SQLite database
    const mappedItems: OrderItem[] = cartItems.map(item => ({
      id: item.product.id || 0,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.is_promo && item.product.promo_price ? item.product.promo_price : (item.product.price || 0)
    }));

    const finalValue = getFinalTotal();
    const isDelivery = checkoutType === "Delivery";

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      type: isDelivery ? "Delivery" : "Balcão",
      status: "Em preparo",
      items: mappedItems,
      total_value: finalValue,
      delivery_fee: isDelivery ? deliveryFee : 0,
      cep: isDelivery ? cep : "",
      rua: isDelivery ? rua : "",
      bairro: isDelivery ? bairro : "",
      cidade: isDelivery ? cidade : "",
      estado: isDelivery ? estado : "",
      numero: isDelivery ? numero : "",
      complemento: isDelivery ? complemento : "",
      estimated_time: isDelivery ? "40-50 min" : "Imediato",
      driver_name: "",
      driver_type: "Próprio",
      driver_phone: "",
      transport_obs: isDelivery ? "Pedido realizado pelo Cardápio Digital Online" : "Retira no Balcão"
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setPlacedOrderId(data.id);
        setStep("success");
        setCartItems([]);
      } else {
        alert("Ocorreu um erro ao enviar o pedido. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
      alert(isRetail ? "Não foi possível conectar com a loja." : "Não foi possível conectar com a confeitaria.");
    }
  };

  const activePromoPercent = (orig: number, promo: number) => {
    if (!orig || !promo || promo >= orig) return 0;
    return Math.round(((orig - promo) / orig) * 100);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategory === "Todos") return matchesSearch;
    return matchesSearch && p.category === selectedCategory;
  });

  const categories = isRetail
    ? ["Todos", "Moda Masculina", "Moda Feminina", "Moda Unissex", "Calçados", "Acessórios"]
    : ["Todos", "Bolos", "Docinhos", "Tortas", "Bebidas"];

  return (
    <div className="flex-grow flex justify-center bg-gray-100 p-0 sm:p-4 font-sans select-none overflow-y-auto" id="public-menu-simulator">
      
      {/* Simulation Frame Wrapper resembling a modern smartphone */}
      <div className="w-full max-w-md bg-[#faf8f5] shadow-xl sm:rounded-2xl flex flex-col h-full min-h-[550px] relative overflow-hidden border border-gray-200">
        
        {/* Banner Mocked Shop Status */}
        <div className="bg-emerald-600 text-white py-1.5 px-3 text-[10px] font-black tracking-wider flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping"></span>
            <span>{isRetail ? "GESTIFY VAREJO — LOJA ABERTA" : "DOM DOCE CONFEITARIA — ABERTO"}</span>
          </div>
          <span className="opacity-80 font-mono">Simulador Online</span>
        </div>

        {/* Dynamic Headers based on step */}
        {step === "catalog" && (
          <div className="bg-white border-b border-[#eee7de] p-4 text-center shrink-0 space-y-3 z-10">
            <div>
              <h1 className="text-sm font-black text-[#2e2624] tracking-tight">
                {isRetail ? "🛍️ Catálogo Digital" : "☕ Cardápio Digital"}
              </h1>
              <p className="text-[10px] text-gray-400">
                {isRetail
                  ? "Monte seu carrinho e finalize a compra na loja."
                  : "Monte seu carrinho e faça seu pedido direto para a cozinha."}
              </p>
            </div>
            
            {/* Search Input bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={13} strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder={isRetail ? "Buscar roupa, calçado ou acessório…" : "O que quer adoçar hoje?"} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-[#2c2221] placeholder-gray-400 focus:outline-none"
              />
            </div>

            {/* Quick Categorized tags slider */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 pt-1 leading-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap border ${
                    selectedCategory === cat 
                      ? "bg-brand text-white border-brand shadow-2xs" 
                      : "bg-[#faf6f2] text-gray-500 border-[#eee7de] hover:bg-[#faf0ed]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "checkout" && (
          <div className="bg-white border-b border-[#eee7de] p-3 flex items-center gap-2.5 shrink-0 z-10">
            <button 
              onClick={() => setStep("catalog")}
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-xs font-black text-[#2e2624]">Finalizar Seu Pedido</h2>
              <p className="text-[9px] text-gray-450">Falta muito pouco para receber seus doces!</p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {step === "catalog" && (
            <>
              {loading ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-[10px]">{isRetail ? "Carregando vitrine de produtos…" : "Carregando vitrine de doces…"}</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 text-gray-400 space-y-1">
                  <ShoppingBag size={28} className="mx-auto text-gray-300" />
                  <p className="text-xs font-bold">{isRetail ? "Nenhum produto encontrado" : "Nenhum doce encontrado"}</p>
                  <p className="text-[9px]">Tente outra busca ou categoria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredProducts.map((prod) => {
                    const hasPromo = !!prod.is_promo && prod.promo_price;
                    const finalPrice = hasPromo ? prod.promo_price : prod.price;
                    return (
                      <div 
                        key={prod.id} 
                        className="bg-white rounded-xl border border-gray-150 p-3 flex items-start gap-3 hover:border-brand/35 transition-all shadow-2xs"
                      >
                        <img 
                          src={prod.image_url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&q=80"} 
                          alt={prod.name}
                          className="w-16 h-16 object-cover rounded-xl border border-gray-100 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&q=80";
                          }}
                        />

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <h3 className="text-xs font-black text-[#2e2624] truncate">{prod.name}</h3>
                            {hasPromo && (
                              <span className="text-[8px] bg-red-50 text-red-700 border border-red-100 rounded-md px-1 py-0.2 font-bold uppercase">
                                OFF {activePromoPercent(prod.price || 0, prod.promo_price || 0)}%
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[9px] text-[#7d6f6b] leading-relaxed line-clamp-2">
                            {prod.description || (isRetail
                              ? "Produto selecionado com curadoria da coleção da loja."
                              : "Doce artesanal preparado no dia com insumos selecionados.")}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            {hasPromo ? (
                              <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-gray-400 line-through text-[9px]">R${Number(prod.price).toFixed(2)}</span>
                                <span className="text-emerald-700 font-extrabold text-[11px]">R${Number(prod.promo_price).toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-[#2e2624] font-black font-mono text-[11px]">
                                R$ {Number(prod.price || 0).toFixed(2)}
                              </span>
                            )}

                            <button
                              onClick={() => addToCart(prod)}
                              className="bg-brand hover:bg-brand-hover text-white rounded-lg p-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
                              title="Adicionar ao Carrinho"
                            >
                              <Plus size={11} strokeWidth={3} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === "checkout" && (
            <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
              
              {/* Form Base Fields */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">1. Identificação do Cliente</span>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold">Qual o seu Nome? *</label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs text-[#2c2221] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: (11) 98888-7777"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs font-mono text-[#2c2221] focus:outline-none"
                  />
                </div>
              </div>

              {/* Delivery or Takeout toggle tab */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">2. Como deseja Receber?</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutType("Delivery")}
                    className={`p-2.5 rounded-xl text-center border font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      checkoutType === "Delivery"
                        ? "bg-[#faf0ed] border-brand text-brand"
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    <Truck size={16} />
                    <span className="text-[10px]">Entrega Rápida</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutType("Retirada")}
                    className={`p-2.5 rounded-xl text-center border font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      checkoutType === "Retirada"
                        ? "bg-[#faf0ed] border-brand text-brand"
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    <Store size={16} />
                    <span className="text-[10px]">Retirar no Local</span>
                  </button>
                </div>

                {checkoutType === "Delivery" && (
                  <div className="pt-2 space-y-2.5 animate-fadeIn">
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1 space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold">CEP *</label>
                        <input
                          type="text"
                          required
                          placeholder="01310-100"
                          value={cep}
                          onChange={(e) => {
                            setCep(e.target.value);
                            if (e.target.value.replace(/\D/g, "").length === 8) {
                              handleCepLookup(e.target.value);
                            }
                          }}
                          className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-brand"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold">Rua / Logradouro *</label>
                        <div className="relative">
                          {loadingCep && <Loader2 className="animate-spin absolute right-2.5 top-2.5 text-brand" size={12} />}
                          <input
                            type="text"
                            required
                            placeholder="Rua, Avenida, etc."
                            value={rua}
                            onChange={(e) => setRua(e.target.value)}
                            className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold">Número *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 500"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold">Bairro *</label>
                        <input
                          type="text"
                          required
                          placeholder="Bairro"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold">Complemento / Ap.</label>
                        <input
                          type="text"
                          placeholder="Ex: Apto 32 Bloco B"
                          value={complemento}
                          onChange={(e) => setComplemento(e.target.value)}
                          className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="col-span-1 space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold">Estado</label>
                        <input
                          type="text"
                          placeholder="SP"
                          maxLength={2}
                          value={estado}
                          onChange={(e) => setEstado(e.target.value)}
                          className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-lg px-2 py-1 text-xs text-center focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="border-t border-dashed border-[#eee7de] pt-2 flex items-center justify-between text-[11px] text-[#7d6f6b]">
                      <span className="flex items-center gap-1 leading-none font-bold">
                        <Info size={12} className="text-brand shrink-0" />
                        Taxa de Entrega fixa p/ Bairro:
                      </span>
                      <span className="font-mono font-bold text-gray-900">
                        R$ {deliveryFee.toFixed(2)}
                      </span>
                    </div>

                  </div>
                )}

                {checkoutType === "Retirada" && (
                  <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-[10px] space-y-0.5 border border-emerald-100 animate-fadeIn">
                    <p className="font-bold flex items-center gap-1">
                      <Store size={13} />
                      Sem Taxa de Entrega
                    </p>
                    <p className="opacity-85 text-[9px]">
                      {isRetail
                        ? "Retirada na loja sem taxas adicionais. Av. Paulista, 1000 — Bela Vista, São Paulo."
                        : "Retirada direta no balcão da confeitaria sem taxas adicionais. Endereço: Av. Paulista, 1000 — Bela Vista, São Paulo."}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment methods selectors */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">3. Forma de Pagamento</span>
                
                <div className="grid grid-cols-3 gap-1.5">
                  {["Pix", "Cartão", "Dinheiro"].map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method as any)}
                        className={`py-2 rounded-lg font-bold border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-brand/10 border-brand text-brand" 
                            : "bg-[#faf6f2] border-[#eee7de] text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <CreditCard size={12} />
                        <span className="text-[10px]">{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Purchase items summary for confirmation */}
              <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Itens Selecionados</span>
                
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item, idx) => {
                    const price = item.product.is_promo && item.product.promo_price ? item.product.promo_price : (item.product.price || 0);
                    return (
                      <div key={idx} className="py-2 flex justify-between text-[11px] text-[#2c2221]">
                        <span>{item.quantity}x {item.product.name}</span>
                        <span className="font-mono text-gray-500 font-bold">R$ {(price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-2 space-y-1 text-xs">
                  {checkoutType === "Delivery" && (
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Taxa de Entrega</span>
                      <span className="font-mono">+ R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xs text-[#2e2624] border-t pt-1.5 mt-1">
                    <span>VALOR TOTAL</span>
                    <span className="font-mono text-brand">R$ {getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Form submit dispatch action */}
              <button
                type="submit"
                className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-black shadow-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 uppercase"
              >
                <Check size={16} strokeWidth={2.5} />
                {isRetail ? "Enviar Pedido" : "Enviar Pedido p/ Cozinha"}
              </button>

            </form>
          )}

          {step === "success" && (
            <div className="bg-white p-6 rounded-2xl border border-[#eee7de] text-center space-y-5 py-12 animate-fadeIn shadow-2xl">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle size={36} className="animate-pulse" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-[#2e2624]">Pedido Enviado com Sucesso!</h3>
                <p className="text-[10px] text-gray-400">Excelente escolha! Seu pedido já está com nossos confeiteiros.</p>
                <span className="inline-block mt-2 font-mono text-[11px] bg-[#faf0ed] font-extrabold text-brand border border-[#faf0ed] rounded-lg px-2.5 py-1 text-center">
                  CÓDIGO: #{placedOrderId}
                </span>
              </div>

              <div className="bg-gray-50 p-4 border border-gray-150 rounded-xl leading-relaxed text-[10px] text-gray-500 text-left space-y-2">
                <p className="font-black text-[#2e2624] block border-b pb-1.5">Informações Úteis:</p>
                <p>• ⏱️ <b>Tempo Estimado:</b> {checkoutType === "Delivery" ? "40 a 50 minutos para entrega" : "Balcão - Imediato para retirada"}.</p>
                <p>• 🏪 <b>Forma de Pagamento:</b> {paymentMethod} (acertado na entrega/retirada).</p>
                <p>• 🔊 <b>Notificação:</b> O painel de expedição do confeiteiro já disparou um sinal sonoro de recebimento automático!</p>
              </div>

              <button
                onClick={() => {
                  setStep("catalog");
                  setCartItems([]);
                }}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-xl transition-all cursor-pointer"
              >
                Voltar ao Cardápio
              </button>
            </div>
          )}
        </div>

        {/* Floating Cart slide layout drawer triggers on catalog */}
        {step === "catalog" && cartItems.length > 0 && (
          <div className="p-3 bg-white border-t border-[#eee7de] z-15 shrink-0 flex items-center justify-between shadow-2xl sticky bottom-0">
            <div className="flex items-center gap-2">
              <div className="bg-[#faf0ed] text-brand p-2 rounded-xl relative shadow-2xs">
                <ShoppingBag size={18} />
                <span className="absolute -top-1.5 -right-1.5 bg-brand text-white border-2 border-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="text-left leading-none space-y-1">
                <span className="text-[9px] text-gray-550 block font-bold">Subtotal do carrinho</span>
                <span className="font-mono text-xs font-black text-[#2e2624]">
                  R$ {getSubtotal().toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-xs font-black rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              Ver Carrinho
              <ChevronRight size={14} />
            </button>
          </div>
        )}

      </div>

      {/* --- CART DRAWER BACKDROP AND MODAL CONTAINER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0 backdrop-blur-xs">
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="bg-white rounded-t-2xl max-w-md w-full p-4 space-y-4 max-h-[85vh] relative flex flex-col z-10 select-none animate-slideUp">
            
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-brand" size={18} />
                <h3 className="text-xs font-black text-[#2e2624] uppercase">
                  {isRetail ? "Seu Carrinho de Compras" : "Seu Carrinho de Doces"}
                </h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart list items render loop */}
            <div className="flex-grow overflow-y-auto space-y-3 pr-1 pt-1.5">
              {cartItems.map((item, idx) => {
                const itemPrice = item.product.is_promo && item.product.promo_price ? item.product.promo_price : (item.product.price || 0);
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-150 shadow-2xs">
                    
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img 
                        src={item.product.image_url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=80&q=80"}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded-lg border"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2e2624] truncate">{item.product.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono font-medium">R$ {itemPrice.toFixed(2)} cada</p>
                      </div>
                    </div>

                    {/* Quantity controls counter widgets */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center bg-white border rounded-lg overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateCartQty(idx, -1)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-50 cursor-pointer text-xs"
                        >
                          <Minus size={10} strokeWidth={2.5} />
                        </button>
                        <span className="font-mono text-xs font-bold min-w-[20px] text-center text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(idx, 1)}
                          className="px-2 py-1 text-[#2c2221] hover:bg-gray-50 cursor-pointer text-xs"
                        >
                          <Plus size={10} strokeWidth={2.5} />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          const updated = [...cartItems];
                          updated.splice(idx, 1);
                          setCartItems(updated);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-650 cursor-pointer hover:bg-red-50 rounded"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Financial math review footer */}
            <div className="border-t pt-3 space-y-3 shrink-0">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-550 font-medium">Subtotal dos itens</span>
                <span className="font-mono font-black text-[#2e2624]">R$ {getSubtotal().toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pb-1.5">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2.5 border rounded-xl text-xs font-bold text-[#7d6f6b] hover:bg-gray-50 shadow-2xs cursor-pointer text-center"
                >
                  Adicionar mais
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setStep("checkout");
                  }}
                  className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-black shadow-xs cursor-pointer text-center uppercase"
                >
                  Ir p/ Checkout
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
