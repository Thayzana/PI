import React, { useEffect, useState } from "react";
import { 
  Truck, 
  Package, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  ClipboardList, 
  Trash2, 
  Printer, 
  X, 
  AlertCircle, 
  DollarSign, 
  Bike, 
  Route, 
  CheckCircle2, 
  ArrowRight,
  Sliders,
  CalendarDays,
  FileText,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, OrderItem, Product } from "../types";
import { withThemeQuery } from "../lib/api";

interface DeliveryLogisticsPageProps {
  themeId: string;
}

export default function DeliveryLogisticsPage({ themeId }: DeliveryLogisticsPageProps) {
  // Page Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");

  // Novo Pedido Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<"Balcão" | "Delivery" | "Encomenda Sazonal">("Delivery");
  const [orderStatus, setOrderStatus] = useState<"Em preparo" | "Pronto para Entrega" | "Rota de Envio" | "Entregue">("Em preparo");
  
  // Products selection in form
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductQty, setSelectedProductQty] = useState<number>(1);
  const [addedItems, setAddedItems] = useState<OrderItem[]>([]);
  
  // Delivery address & location
  const [cep, setCep] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("40-50 min");

  // Delivery Rate Calculation Rules
  const [rateMethod, setRateMethod] = useState<"fixed" | "mileage">("fixed");
  const [fixedFee, setFixedFee] = useState<number>(8.00);
  const [mileageDistance, setMileageDistance] = useState<number>(3.5);
  const [mileageRate, setMileageRate] = useState<number>(2.50); // R$2.50 por km

  // Courier/Transport fields
  const [driverName, setDriverName] = useState("");
  const [driverType, setDriverType] = useState<"Próprio" | "Terceirizado">("Próprio");
  const [driverPhone, setDriverPhone] = useState("");
  const [transportObs, setTransportObs] = useState("");

  // Ficha de Despacho (Dispatch Ticket Modal)
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);

  // Quick Obs Template helpers
  const PRESET_OBS = [
    "⚠️ Cuidado: Bolo Alto/Andar",
    "❄️ Manter sob Refrigeração",
    "⏱️ Entregar com Urgência",
    "🎁 Embalagem p/ Presente",
    "🔔 Interfonar ao chegar"
  ];

  // Load backend data
  const loadData = async () => {
    try {
      setLoadingOrders(true);
      const [ordRes, prodRes] = await Promise.all([
        fetch(withThemeQuery("/api/orders", themeId)),
        fetch(withThemeQuery("/api/products", themeId)),
      ]);

      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData);
        // Default select the first order if available
        if (ordData.length > 0) {
          setSelectedOrder(ordData[0]);
        }
      }

      if (prodRes.ok) {
        setProducts(await prodRes.json());
      }
    } catch (err) {
      console.error("Erro ao carregar dados da API de Pedidos:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Play sound synthesized using browser AudioContext
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Beep 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      // Beep 2 (staggered slightly)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.25);
      }, 120);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  const [notificationToast, setNotificationToast] = useState<{ id: number; client: string; value: number } | null>(null);

  // Load backend data helper without initial loading override to avoid visual flicker during intervals
  const pollOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const ordData = await res.json();
        
        // Let's identify if any order is genuinely NEW
        setOrders(prevOrders => {
          if (prevOrders.length > 0 && ordData.length > prevOrders.length) {
            // Find orders that are in ordData but not in prevOrders
            const prevIds = new Set(prevOrders.map(o => o.id));
            const newOrders = ordData.filter((o: any) => !prevIds.has(o.id));
            if (newOrders.length > 0) {
              const newest = newOrders[0];
              setNotificationToast({
                id: newest.id,
                client: newest.customer_name,
                value: newest.total_value
              });
              playNotificationSound();
              // Auto hide toast after 6 seconds
              setTimeout(() => {
                setNotificationToast(null);
              }, 6000);
            }
          }
          return ordData;
        });
      }
    } catch (e) {
      console.error("Polling error:", e);
    }
  };

  useEffect(() => {
    loadData();
    
    // Polling interval every 5 seconds for incoming digital menu orders
    const interval = setInterval(() => {
      pollOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [themeId]);

  // Handler for Cep lookup
  const handleCepLookup = async (cepVal: string) => {
    const sanitizedCep = cepVal.replace(/\D/g, "");
    if (sanitizedCep.length !== 8) return;

    try {
      setLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${sanitizedCep}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (!data.erro) {
          setRua(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setEstado(data.uf || "");
          // Suggest dynamic fixed fare based on neighborhood size if matching certain keywords
          if (data.bairro && data.bairro.toLowerCase().includes("centro")) {
            setFixedFee(6.00);
          } else {
            setFixedFee(10.00);
          }
        }
      }
    } catch (e) {
      console.error("Erro ao consultar a API ViaCEP:", e);
    } finally {
      setLoadingCep(false);
    }
  };

  // Add order item inside modal
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === Number(selectedProductId));
    if (!prod) return;

    // Check if item already exists in list
    const existingIndex = addedItems.findIndex(i => i.id === prod.id);
    if (existingIndex !== -1) {
      const updated = [...addedItems];
      updated[existingIndex].quantity += selectedProductQty;
      setAddedItems(updated);
    } else {
      // Hardcode price approximation based on common bakery prices or get recipe final price
      // We will look for recipe details or fallback to default pricing: R$ 5.60 for Brigadeiro, etc.
      let mockedPrice = 8.50; 
      if (prod.name.includes("Brigadeiro")) mockedPrice = 5.60;
      if (prod.name.includes("Bolo de Pote")) mockedPrice = 12.00;
      if (prod.name.includes("Cheesecake")) mockedPrice = 85.00;
      if (prod.name.includes("Red Velvet")) mockedPrice = 15.00;
      if (prod.name.includes("Trufa")) mockedPrice = 7.50;
      if (prod.name.includes("Macaron")) mockedPrice = 9.00;

      setAddedItems([...addedItems, {
        id: prod.id || 0,
        name: prod.name,
        quantity: selectedProductQty,
        price: mockedPrice
      }]);
    }
    setSelectedProductQty(1);
  };

  const handleRemoveItem = (idx: number) => {
    setAddedItems(addedItems.filter((_, i) => i !== idx));
  };

  // Get calculated Delivery Fee
  const getCalculatedDeliveryFee = () => {
    if (orderType !== "Delivery") return 0;
    if (rateMethod === "fixed") return fixedFee;
    return Number((mileageDistance * mileageRate).toFixed(2));
  };

  // Get calculated total items value
  const getSubtotal = () => {
    return addedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const getTotalAmount = () => {
    return getSubtotal() + getCalculatedDeliveryFee();
  };

  // Save new order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Por favor, digite o nome do cliente.");
      return;
    }
    if (addedItems.length === 0) {
      alert("Por favor, adicione pelo menos um produto ao pedido.");
      return;
    }

    setSubmitting(true);
    const calculatedFee = getCalculatedDeliveryFee();
    const finalTotal = getTotalAmount();

    const orderPayload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      type: orderType,
      status: orderStatus,
      items: addedItems,
      total_value: finalTotal,
      delivery_fee: calculatedFee,
      cep: orderType === "Delivery" ? cep : "",
      rua: orderType === "Delivery" ? rua : "",
      bairro: orderType === "Delivery" ? bairro : "",
      cidade: orderType === "Delivery" ? cidade : "",
      estado: orderType === "Delivery" ? estado : "",
      numero: orderType === "Delivery" ? numero : "",
      complemento: orderType === "Delivery" ? complemento : "",
      estimated_time: orderType === "Delivery" ? estimatedTime : "Imediato",
      driver_name: orderType === "Delivery" ? driverName : "",
      driver_type: orderType === "Delivery" ? driverType : "Próprio",
      driver_phone: orderType === "Delivery" ? driverPhone : "",
      transport_obs: transportObs
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const created = await res.json();
        setOrders([created, ...orders]);
        setSelectedOrder(created);
        setIsModalOpen(false);
        resetForm();
      } else {
        const parseError = await res.json();
        alert(`Erro ao criar o pedido: ${parseError.error || "Tente novamente"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível conectar com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  // Update order status directly on database
  const handleUpdateStatus = async (orderId: number, nextStatus: "Em preparo" | "Pronto para Entrega" | "Rota de Envio" | "Entregue") => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders(orders.map(o => o.id === orderId ? updated : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este pedido? Isso afetará os relatórios.")) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        const updatedOrders = orders.filter(o => o.id !== orderId);
        setOrders(updatedOrders);
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(updatedOrders.length > 0 ? updatedOrders[0] : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setOrderType("Delivery");
    setOrderStatus("Em preparo");
    setSelectedProductId("");
    setSelectedProductQty(1);
    setAddedItems([]);
    setCep("");
    setRua("");
    setBairro("");
    setCidade("");
    setEstado("");
    setNumero("");
    setComplemento("");
    setFixedFee(8.00);
    setRateMethod("fixed");
    setMileageDistance(3.5);
    setDriverName("");
    setDriverType("Próprio");
    setDriverPhone("");
    setTransportObs("");
    setEstimatedTime("40-50 min");
  };

  // Get status color templates
  const getStatusBadgeClass = (status: Order["status"]) => {
    switch (status) {
      case "Em preparo":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Pronto para Entrega":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Rota de Envio":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Entregue":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Toggle quick observation text tags
  const toggleObsPreset = (tag: string) => {
    if (transportObs.includes(tag)) {
      setTransportObs(transportObs.replace(tag, "").replace(/,\s*,/g, ",").trim());
    } else {
      setTransportObs(transportObs ? `${transportObs}, ${tag}` : tag);
    }
  };

  // Filter orders by query & tab filter
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (o.rua && o.rua.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (o.cep && o.cep.includes(searchQuery)) ||
                          (o.items && o.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())));
    
    if (statusFilter === "Todos") return matchesSearch;
    return matchesSearch && o.status === statusFilter;
  });

  // Calculate stats values
  const totalOrdersCount = orders.length;
  const inPreparationCount = orders.filter(o => o.status === "Em preparo").length;
  const inTransitCount = orders.filter(o => o.status === "Rota de Envio").length;
  const deliveredCount = orders.filter(o => o.status === "Entregue").length;
  const readyCount = orders.filter(o => o.status === "Pronto para Entrega").length;
  
  const totalDeliveryEarning = orders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);

  return (
    <div className="flex-grow flex flex-col p-4 md:p-8 overflow-y-auto bg-[#faf6f2] font-sans" id="delivery-logistics-page">
      
      {/* Real-time Order Arrival Alert Toast */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-55 bg-gradient-to-r from-amber-500 to-brand text-white p-4 rounded-2xl shadow-2xl border border-white/10 max-w-sm flex items-center gap-3"
          >
            <div className="animate-bounce bg-white/20 p-2.5 rounded-xl">
              <Truck size={20} />
            </div>
            <div className="flex-1 space-y-0.5">
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Novo Pedido Recebido!</span>
              <h4 className="text-xs font-black">Cliente: {notificationToast.client}</h4>
              <p className="text-[10px] opacity-90 font-mono">Pedido #{notificationToast.id} • R$ {notificationToast.value.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => setNotificationToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg shrink-0 cursor-pointer"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Banner & Stats block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-[#2e2624] tracking-tight flex items-center gap-2">
            <Truck className="text-brand shrink-0" size={24} />
            Delivery Rápido & Logística
          </h2>
          <p className="text-xs text-[#7d6f6b]">
            Monitore saídas para delivery, faça preenchimentos automáticos por CEP e imprima etiquetas térmicas de despacho.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer"
          id="btn-new-order"
        >
          <Plus size={16} />
          Novo Pedido
        </button>
      </div>

      {/* Numerical Stats overview panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-[#eee7de] shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#faf0ed] text-brand">
            <ClipboardList size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pedidos de Hoje</span>
            <span className="text-xl font-bold font-mono text-[#2c2221]">{totalOrdersCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#eee7de] shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Em Preparo</span>
            <span className="text-xl font-bold font-mono text-amber-700">{inPreparationCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#eee7de] shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Bike size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Em Rota de Envio</span>
            <span className="text-xl font-bold font-mono text-purple-700">{inTransitCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#eee7de] shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Taxas de Entrega</span>
            <span className="text-xl font-bold font-mono text-teal-700">
              R$ {totalDeliveryEarning.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Body Area split in 2 columns: Search+List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        
        {/* Left Column (Lists and Filters) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-2xl border border-[#eee7de] shadow-xs overflow-hidden">
          
          {/* Header of column with tabs */}
          <div className="p-4 border-b border-[#eee7de]/70 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por cliente, bairro, cep ou produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#2e2624] placeholder-gray-400 focus:outline-none focus:border-brand transition-all"
              />
            </div>

            {/* Quick status tabs scrollable */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {["Todos", "Em preparo", "Pronto para Entrega", "Rota de Envio", "Entregue"].map((status) => {
                const count = status === "Todos" ? orders.length : orders.filter(o => o.status === status).length;
                const isSelected = statusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                      isSelected
                        ? "bg-brand text-white border-brand shadow-xs"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-[#faf6f2]"
                    }`}
                  >
                    <span>{status === "Pronto para Entrega" ? "Pronto" : status === "Rota de Envio" ? "Em Rota" : status}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Orders */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#eee7de]/30 min-h-[400px]">
            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="animate-spin text-brand mb-2" size={32} />
                <p className="text-xs">Carregando mapa operacional de entregas...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20 text-gray-400 space-y-2">
                <Package className="mx-auto" size={40} />
                <p className="text-xs font-bold">Nenhum pedido encontrado</p>
                <p className="text-[10px]">Crie um novo pedido ou mude o filtro para visualizar.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-brand/5 border-brand mt-1 shadow-xs"
                        : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-[#2e2624]">
                          #{order.id} - {order.customer_name}
                        </span>
                        
                        <span className="text-[10px] bg-[#faf0ed] text-brand border border-[#faf0ed] rounded-md px-1.5 py-0.5 font-bold">
                          {order.type}
                        </span>

                        <span className={`text-[10px] font-bold border rounded-md px-1.5 py-0.5 ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items previews tag */}
                      <p className="text-xs text-[#7d6f6b] max-w-md line-clamp-1">
                        {order.items?.map(it => `${it.quantity}x ${it.name}`).join(", ")}
                      </p>

                      {/* Location or balcony message */}
                      {order.type === "Delivery" ? (
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate">{order.rua ? `${order.rua}, ${order.numero} (${order.bairro})` : "Sem endereço especificado"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle2 size={12} />
                          <span>Retirada no Balcão ou encomenda direta</span>
                        </div>
                      )}
                    </div>

                    {/* Fast info price and print status */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-[#eee7de]/50 gap-1 shrink-0">
                      <span className="text-sm font-black font-mono text-gray-900">
                        R$ {Number(order.total_value).toFixed(2)}
                      </span>
                      {order.delivery_fee > 0 && (
                        <span className="text-[10px] text-gray-400 font-bold">
                          Taxa de Entrega: R$ {Number(order.delivery_fee).toFixed(2)}
                        </span>
                      )}
                      
                      <span className="text-[10px] text-gray-400 hidden md:block">
                        {order.created_at ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                      </span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (Operational Details & Dispatch Tags) */}
        <div className="lg:col-span-5 h-full space-y-4">
          
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-[#eee7de] shadow-xs p-5 space-y-5">
              
              {/* Header card details */}
              <div className="border-b border-gray-100 pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold mb-1">
                    <span>STATUS ATUAL:</span>
                    <span className={`border text-[10px] font-bold py-0.5 px-2 rounded-full ${getStatusBadgeClass(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#2e2624] tracking-tight">
                    Pedido #{selectedOrder.id}
                  </h3>
                  <p className="text-xs text-gray-400">{selectedOrder.customer_name}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDispatchOrder(selectedOrder)}
                    title="Imprimir Ficha de Despacho"
                    className="p-2 text-gray-600 hover:text-brand bg-gray-50 border border-gray-200 rounded-lg hover:border-brand/40 cursor-pointer transition-all"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder.id!)}
                    title="Excluir Pedido"
                    className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 border border-gray-200 hover:border-red-200 rounded-lg cursor-pointer transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Status workflow dispatcher timeline controls */}
              <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Alterar Status do Pedido</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={selectedOrder.status === "Em preparo"}
                    onClick={() => handleUpdateStatus(selectedOrder.id!, "Em preparo")}
                    className={`px-2 py-1.5 text-[10px] font-bold border rounded-lg cursor-pointer transition-all text-center ${
                      selectedOrder.status === "Em preparo"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    1. Em preparo
                  </button>

                  <button
                    disabled={selectedOrder.status === "Pronto para Entrega"}
                    onClick={() => handleUpdateStatus(selectedOrder.id!, "Pronto para Entrega")}
                    className={`px-2 py-1.5 text-[10px] font-bold border rounded-lg cursor-pointer transition-all text-center ${
                      selectedOrder.status === "Pronto para Entrega"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    2. Pronto p/ Entrega
                  </button>

                  <button
                    disabled={selectedOrder.status === "Rota de Envio"}
                    onClick={() => handleUpdateStatus(selectedOrder.id!, "Rota de Envio")}
                    className={`px-2 py-1.5 text-[10px] font-bold border rounded-lg cursor-pointer transition-all text-center ${
                      selectedOrder.status === "Rota de Envio"
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    3. Rota de Envio
                  </button>

                  <button
                    disabled={selectedOrder.status === "Entregue"}
                    onClick={() => handleUpdateStatus(selectedOrder.id!, "Entregue")}
                    className={`px-2 py-1.5 text-[10px] font-bold border rounded-lg cursor-pointer transition-all text-center ${
                      selectedOrder.status === "Entregue"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    4. Entregue
                  </button>
                </div>
              </div>

              {/* Client Info Grid Block */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Informações de Contato</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#2c2221]">
                    <User size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate">{selectedOrder.customer_name}</span>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div className="flex items-center gap-2 text-xs text-[#2c2221]">
                      <Phone size={14} className="text-gray-400 shrink-0" />
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery / Address Grid block */}
              {selectedOrder.type === "Delivery" && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Local de Entrega</span>
                  <div className="space-y-2 text-xs bg-[#faf6f2]/65 p-3 rounded-xl border border-[#eee7de]">
                    
                    <div className="flex items-start gap-1.5">
                      <MapPin size={14} className="text-brand shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#2e2624]">
                          {selectedOrder.rua}, {selectedOrder.numero}
                        </p>
                        {selectedOrder.complemento && (
                          <p className="text-gray-400 text-[11px] font-medium">
                            Comp: {selectedOrder.complemento}
                          </p>
                        )}
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          {selectedOrder.bairro} — {selectedOrder.cidade} / {selectedOrder.estado}
                        </p>
                        {selectedOrder.cep && (
                          <span className="inline-block mt-1 font-mono text-[10px] bg-white border px-1.5 py-0.2 text-gray-500 rounded-md">
                            CEP: {selectedOrder.cep}
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedOrder.estimated_time && (
                      <div className="flex items-center gap-1.5 border-t border-[#eee7de]/50 pt-2 text-[11px] text-gray-500 font-bold">
                        <Clock size={12} className="text-gray-400" />
                        <span>Estimativa de Envio: {selectedOrder.estimated_time}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Courier Logistics Information */}
              {selectedOrder.type === "Delivery" && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Equipe de Despacho / Entregador</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Entregador</span>
                      <p className="font-bold">{selectedOrder.driver_name || "Não atribuído"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Vínculo</span>
                      <span className={`inline-block px-2 py-0.5 mt-0.5 text-[9px] font-black rounded-md ${
                        selectedOrder.driver_type === "Próprio" ? "bg-emerald-50 text-emerald-800" : "bg-teal-50 text-teal-800"
                      }`}>
                        {selectedOrder.driver_type}
                      </span>
                    </div>
                    {selectedOrder.driver_phone && (
                      <div className="col-span-2 flex items-center gap-1.5 text-gray-500 mt-1">
                        <Phone size={12} />
                        <span>{selectedOrder.driver_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transportation Special Observations */}
              {selectedOrder.transport_obs && (
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Observações do Transporte</span>
                  <div className="p-2.5 bg-amber-50/50 border border-amber-200/50 text-amber-900 rounded-lg text-xs leading-relaxed font-semibold">
                    {selectedOrder.transport_obs}
                  </div>
                </div>
              )}

              {/* Order Items Table list */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Itens do Pedido</span>
                <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-[#2c2221]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5 font-bold text-gray-600">
                          {item.quantity}x
                        </span>
                        <span className="font-bold">{item.name}</span>
                      </div>
                      <span className="font-mono text-gray-500 font-bold">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  {/* Financial breakdown values */}
                  <div className="border-t border-gray-200/60 pt-3 mt-3 space-y-1.5 text-xs text-[#2c2221]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal dos itens</span>
                      <span className="font-mono">
                        R$ {(selectedOrder.total_value - selectedOrder.delivery_fee).toFixed(2)}
                      </span>
                    </div>
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Taxa de entrega</span>
                        <span className="font-mono text-brand font-bold">
                          + R$ {Number(selectedOrder.delivery_fee).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm text-[#2e2624] border-t border-gray-200/70 pt-2 mt-1">
                      <span>VALOR TOTAL</span>
                      <span className="font-mono text-brand">
                        R$ {Number(selectedOrder.total_value).toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Generate Thermal Print label block */}
              <button
                onClick={() => setDispatchOrder(selectedOrder)}
                className="w-full py-3 border border-brand hover:bg-brand hover:text-white text-brand text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                Gerar Ficha de Despacho (Etiqueta de Caixa)
              </button>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#eee7de] shadow-xs p-8 text-center text-gray-400 space-y-2 py-40">
              <ClipboardList className="mx-auto text-gray-300" size={48} />
              <p className="text-xs font-bold">Selecione um pedido</p>
              <p className="text-[10px]">Escolha um pedido da lista operacional ao lado para detalhar seus dados e alterar status de logística.</p>
            </div>
          )}

        </div>

      </div>

      {/* --- NOVO PEDIDO MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl border border-[#eee7de] shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="text-brand" size={20} />
                <h3 className="text-base font-black text-[#2e2624]">Novo Pedido para Expedição</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Container with Forms */}
            <form onSubmit={handleCreateOrder} className="flex-grow overflow-y-auto p-5 space-y-6">
              
              {/* Client Base metadata group */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">1. Dados Fundamentais</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7d6f6b]">Nome do Cliente *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Ana Maria Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs text-[#2c2221] placeholder-gray-400 focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7d6f6b]">Telefone de Contato</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 98888-7777"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs text-[#2c2221] placeholder-gray-400 focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7d6f6b]">Tipo de Atendimento *</label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value as any)}
                      className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs text-[#2c2221] focus:outline-none focus:border-brand"
                    >
                      <option value="Delivery">🚀 Delivery / Entrega Rápida</option>
                      <option value="Balcão">🏪 Retirada no Balcão</option>
                      <option value="Encomenda Sazonal">📅 Encomenda Planejada Sazonal</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7d6f6b]">Status Inicial *</label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value as any)}
                      className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs text-[#2c2221] focus:outline-none focus:border-brand"
                    >
                      <option value="Em preparo">Em preparo</option>
                      <option value="Pronto para Entrega">Pronto para Entrega</option>
                      <option value="Rota de Envio">Em Rota de Envio</option>
                      <option value="Entregue">Entregue / Concluído</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Picker list row */}
              <div className="space-y-3 border-t border-gray-100 pt-5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">2. Ingressar Produtos no Pedido</span>
                
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-[#7d6f6b]">Buscar Produto Cadastrado</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-white border border-[#eee7de] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                    >
                      <option value="">Selecione um produto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Qtd: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#7d6f6b]">Qtde</label>
                    <input
                      type="number"
                      min={1}
                      value={selectedProductQty}
                      onChange={(e) => setSelectedProductQty(Number(e.target.value))}
                      className="w-full bg-white border border-[#eee7de] rounded-lg px-2.5 py-1.5 text-xs text-[#2c2221] focus:outline-none focus:border-brand"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-[#faf6f2] hover:bg-brand hover:text-white border border-brand/50 text-brand py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all uppercase"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Added items list inside modal form */}
                {addedItems.length > 0 && (
                  <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-12 bg-gray-50/80 p-2 font-bold text-gray-600 border-b">
                      <div className="col-span-6">Produto adicionado</div>
                      <div className="col-span-2 text-center">Quantidade</div>
                      <div className="col-span-2 text-right">P. Unitário</div>
                      <div className="col-span-2 text-right">Ação</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {addedItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 p-2.5 items-center bg-white">
                          <div className="col-span-6 font-bold text-[#2e2624]">{item.name}</div>
                          <div className="col-span-2 text-center font-mono font-bold text-gray-600">{item.quantity}x</div>
                          <div className="col-span-2 text-right font-mono">R$ {item.price.toFixed(2)}</div>
                          <div className="col-span-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700 font-bold px-2 cursor-pointer"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Logistics Group Address Section (Only rendered if Delivery active) */}
              {orderType === "Delivery" && (
                <div className="space-y-4 border-t border-gray-100 pt-5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">3. Localização de Delivery por CEP</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">CEP d'Entrega</label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={9}
                          placeholder="Ex: 01310-100"
                          value={cep}
                          onChange={(e) => {
                            setCep(e.target.value);
                            handleCepLookup(e.target.value);
                          }}
                          className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl pl-3 pr-8 py-2 text-xs focus:outline-none focus:border-brand"
                        />
                        {loadingCep && (
                          <span className="absolute right-2 top-2.5">
                            <Loader2 size={14} className="animate-spin text-brand" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Logradouro / Rua (ViaCEP)</label>
                      <input
                        type="text"
                        placeholder="Nome da avenida ou rua"
                        value={rua}
                        onChange={(e) => setRua(e.target.value)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Número *</label>
                      <input
                        required={orderType === "Delivery"}
                        type="text"
                        placeholder="Ex: 154"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Complemento / Bloco / Apartamento</label>
                      <input
                        type="text"
                        placeholder="Ex: Ap 14 bloco C"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Bairro</label>
                      <input
                        type="text"
                        placeholder="Ex: Centro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Cidade</label>
                      <input
                        type="text"
                        placeholder="Ex: São Paulo"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Estado</label>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="Ex: SP"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs uppercase focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Estimation Time row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Estimativa de Tempo de Envio</label>
                      <select
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(e.target.value)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                      >
                        <option value="30-40 min">⚡ Super Rápido (30-40 min)</option>
                        <option value="40-50 min">📦 Normal (40-50 min)</option>
                        <option value="50-60 min">⏳ Conservadora (50-60 min)</option>
                        <option value="60-75 min">🕑 Agendado (60-75 min)</option>
                      </select>
                    </div>
                  </div>

                  {/* Delivery pricing rules section */}
                  <div className="bg-[#faf6f2]/80 p-4 rounded-xl border border-[#eee7de] space-y-3.5 mt-2">
                    <span className="text-[11px] font-black text-brand uppercase block tracking-wider">Regra de Cálculo de Taxa de Entrega</span>
                    
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                        <input
                          type="radio"
                          name="calcMethod"
                          checked={rateMethod === "fixed"}
                          onChange={() => setRateMethod("fixed")}
                          className="text-brand focus:ring-brand"
                        />
                        Taxa Fixa por Bairro
                      </label>

                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                        <input
                          type="radio"
                          name="calcMethod"
                          checked={rateMethod === "mileage"}
                          onChange={() => setRateMethod("mileage")}
                          className="text-brand focus:ring-brand"
                        />
                        Cálculo por Quilometragem (Km)
                      </label>
                    </div>

                    {rateMethod === "fixed" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                        <span className="text-[11px] text-gray-500">Insira o valor fixo desejado para a entrega desse bairro:</span>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.1"
                            value={fixedFee}
                            onChange={(e) => setFixedFee(Number(e.target.value))}
                            className="bg-white border border-[#eee7de] pl-8 pr-3 py-1.5 text-xs rounded-lg w-full focus:outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-gray-500 font-bold">Distância (Km)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={mileageDistance}
                            onChange={(e) => setMileageDistance(Number(e.target.value))}
                            className="bg-white border border-[#eee7de] px-2.5 py-1.5 text-xs rounded-lg w-full"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-gray-500 font-bold">Valor por Km (R$)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={mileageRate}
                            onChange={(e) => setMileageRate(Number(e.target.value))}
                            className="bg-white border border-[#eee7de] px-2.5 py-1.5 text-xs rounded-lg w-full"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-gray-500 font-bold">Taxa Calculada</label>
                          <div className="bg-[#faf6f2] border border-gray-200 px-2.5 py-1.5 text-xs rounded-lg font-mono font-bold text-brand">
                            R$ {(mileageDistance * mileageRate).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Delivery Driver Data fields */}
              {orderType === "Delivery" && (
                <div className="space-y-3 border-t border-gray-100 pt-5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">4. Alocação de Entregador</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Nome do Entregador</label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos Costa"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs placeholder-gray-400 focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Tipo de Vínculo</label>
                      <select
                        value={driverType}
                        onChange={(e) => setDriverType(e.target.value as any)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-brand"
                      >
                        <option value="Próprio">🛵 Próprio da Loja</option>
                        <option value="Terceirizado">🏢 Terceirizado / iFood / Loggi</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#7d6f6b]">Contato / Telefone</label>
                      <input
                        type="text"
                        placeholder="Ex: (11) 98888-2222"
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                        className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs placeholder-gray-400 focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Transportation Special Instructions Observations Block */}
              <div className="space-y-3 border-t border-gray-100 pt-5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  {orderType === "Delivery" ? "5. Recomendações e Observação de Transporte" : "3. Recomendações e Observações"}
                </span>

                {/* Precompiled observational tags click tracker */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_OBS.map((tag) => {
                    const isActive = transportObs.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleObsPreset(tag)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer select-none transition-all ${
                          isActive
                            ? "bg-brand/10 border-brand text-brand"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <textarea
                    rows={2}
                    placeholder="Escreva alguma restrição específica de tráfego, ex: Bolo de 3 andares - transportar nivelado sob ar condicionado."
                    value={transportObs}
                    onChange={(e) => setTransportObs(e.target.value)}
                    className="w-full bg-[#faf6f2] border border-[#eee7de] rounded-xl px-3 py-2 text-xs text-[#2c2221] placeholder-gray-400 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Automatic order financial receipt counter box */}
              <div className="bg-[#faf6f2] p-4 rounded-xl border border-[#eee7de] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-gray-400 font-bold">Total Calculado</span>
                  <p className="text-xs text-gray-500 font-medium">Itens: R$ {getSubtotal().toFixed(2)} + Taxa: R$ {getCalculatedDeliveryFee().toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-lg font-black font-mono text-brand">R$ {getTotalAmount().toFixed(2)}</span>
                </div>
              </div>

            </form>

            {/* Modal Footer block page */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={submitting}
                className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs inline-flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
              >
                {submitting ? "Inserindo Pedido..." : "Gerar Pedido & Fila"}
              </button>
            </div>

          </motion.div>
        </div>
      )}

      {/* --- FICHA DE DESPACHO PRINT THERMAL MODAL --- */}
      {dispatchOrder && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto" id="ticket-modal-overlay">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-sm w-full border border-[#eee7de] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Ticket actions panel */}
            <div className="p-4 bg-gray-50 flex items-center justify-between border-b shadow-xs">
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <FileText size={14} className="text-brand" />
                Espelho de Expedição
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-brand text-white font-bold text-[10px] rounded-lg tracking-wide hover:bg-brand-hover shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Printer size={12} />
                  Imprimir
                </button>
                <button
                  onClick={() => setDispatchOrder(null)}
                  className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Print Area - Optimized layout as a high fidelity thermal rolling paper */}
            <div className="flex-grow overflow-y-auto p-6 bg-white shrink-0 print:p-0" id="thermal-ticket-print-body font-mono">
              <div className="border border-dashed border-gray-300 p-4 rounded-md space-y-4 font-mono text-[11px] text-[#2c2221]">
                
                {/* Bakery branding header */}
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-black uppercase text-gray-900 leading-none">*** GESTIFY CONFEITARIA ***</h4>
                  <p className="text-[9px] uppercase tracking-wide text-gray-500">Gestão Logística de Delivery de Doces</p>
                  <p className="text-[10px] font-bold text-[#b3543d] flex items-center justify-center gap-1 mt-1">
                    <Truck size={12} />
                    CONTROLE DE EXPEDIÇÃO
                  </p>
                  <p className="text-[9px] text-gray-400">Gerado às: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Dashed delimiter strip */}
                <div className="border-t border-dashed border-gray-300 my-1"></div>

                {/* Customer primary metadata block */}
                <div className="space-y-1">
                  <span className="font-bold text-gray-400 text-[10px]">CLIENTE:</span>
                  <p className="text-xs font-black text-gray-900">{dispatchOrder.customer_name}</p>
                  {dispatchOrder.customer_phone && <p className="font-semibold text-gray-700">Tel: {dispatchOrder.customer_phone}</p>}
                </div>

                {/* Despacho address block */}
                {dispatchOrder.type === "Delivery" ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="font-bold text-gray-400 text-[10px]">ENDEREÇO DE ENTREGA:</span>
                    <div className="bg-gray-50 p-2 border rounded-md space-y-0.5 leading-tight">
                      <p className="font-black text-gray-900">{dispatchOrder.rua}, {dispatchOrder.numero}</p>
                      {dispatchOrder.complemento && <p className="font-bold text-gray-600 font-mono">Comp: {dispatchOrder.complemento}</p>}
                      <p className="text-gray-500 text-[10px]">{dispatchOrder.bairro} — {dispatchOrder.cidade}/{dispatchOrder.estado}</p>
                      {dispatchOrder.cep && <p className="text-gray-400 font-mono text-[9px]">CEP: {dispatchOrder.cep}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-md font-bold text-center">
                    RETIRADA INTEGRAL NO BALCÃO
                  </div>
                )}

                <div className="border-t border-dashed border-gray-300 my-1"></div>

                {/* Logistics details like Driver and time */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 leading-snug">
                  <div>
                    <span className="text-gray-400 text-[9px] font-bold block">TIPO DE PEDIDO:</span>
                    <span className="font-black text-gray-800 uppercase">{dispatchOrder.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[9px] font-bold block">PREVISÃO:</span>
                    <span className="font-black text-gray-800">{dispatchOrder.estimated_time || "Breve"}</span>
                  </div>
                  {dispatchOrder.driver_name && (
                    <div className="col-span-2 mt-1">
                      <span className="text-gray-400 text-[9px] font-bold block">ENTREGADOR DESIGNADO:</span>
                      <span className="font-bold text-gray-800">{dispatchOrder.driver_name} ({dispatchOrder.driver_type})</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-300 my-1"></div>

                {/* Items detailed billing receipt */}
                <div className="space-y-1 pt-1">
                  <span className="font-bold text-gray-400 text-[10px] block mb-1">CONTEÚDO DA SACOLA:</span>
                  <div className="space-y-1">
                    {dispatchOrder.items?.map((item, id) => (
                      <div key={id} className="flex justify-between text-[11px]">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-bold font-mono">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-1"></div>

                {/* Transport caution note */}
                {dispatchOrder.transport_obs && (
                  <div className="bg-amber-50/50 border border-amber-200 text-amber-900 p-2 rounded-md leading-relaxed text-[10px] font-bold">
                    OBS/CUIDADOS: {dispatchOrder.transport_obs}
                  </div>
                )}

                {/* Order totals pricing strip summary */}
                <div className="space-y-1 text-right text-xs pt-1">
                  <p className="text-[10px]">Subtotal: R$ {(dispatchOrder.total_value - dispatchOrder.delivery_fee).toFixed(2)}</p>
                  {dispatchOrder.delivery_fee > 0 && <p className="text-[10px] font-bold">Taxa Delivery: R$ {dispatchOrder.delivery_fee.toFixed(2)}</p>}
                  <p className="text-sm font-black text-gray-900 border-t border-dashed border-gray-300 pt-1 mt-1">
                    TOTAL TOTAL: R$ {dispatchOrder.total_value.toFixed(2)}
                  </p>
                </div>

                {/* Barcode representation using CSS borders */}
                <div className="pt-2 flex flex-col items-center justify-center space-y-1">
                  <div className="flex h-8 w-44 bg-white">
                    <div className="flex-1 border-r border-[#1e1b18] w-0.5"></div>
                    <div className="flex-1 border-r-2 border-[#1e1b18] w-1"></div>
                    <div className="flex-1 border-r border-[#1e1b18] w-0.5"></div>
                    <div className="flex-1 border-r border-white w-2"></div>
                    <div className="flex-1 border-r-4 border-[#1e1b18] w-1.5"></div>
                    <div className="flex-1 border-r border-[#1e1b18] w-0.5"></div>
                    <div className="flex-1 border-r-2 border-[#1e1b18] w-1"></div>
                    <div className="flex-1 border-r border-[#1e1b18] w-0.5"></div>
                    <div className="flex-1 border-r border-white w-2"></div>
                    <div className="flex-1 border-r-4 border-[#1e1b18] w-1.5"></div>
                    <div className="flex-1 border-r border-[#1e1b18] w-0.5"></div>
                    <div className="flex-1 border-r-2 border-[#1e1b18] w-1"></div>
                    <div className="flex-1 border-r border-[#1e1b18] w-0.5"></div>
                    <div className="flex-1 border-r-4 border-[#1e1b18] w-2"></div>
                    <div className="flex-1 border-r border-[#1e1b18] w-0.5"></div>
                  </div>
                  <span className="text-[8px] font-mono text-gray-400">PED-{dispatchOrder.id}-LOGIST-2026</span>
                </div>

                <p className="text-center text-[9px] text-gray-400 pt-2 font-bold uppercase">
                  *** OBRIGADO PELA PREFERÊNCIA ***
                </p>

              </div>
            </div>

            {/* Close footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setDispatchOrder(null)}
                className="px-4 py-2 text-xs font-black bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}
