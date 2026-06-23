import { useEffect, useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  Truck,
  Tag,
  Loader2,
  Zap,
  MessageCircle,
} from "lucide-react";
import { ActionCard, InsightItem } from "../types";
import { apiFetch } from "../lib/api";
import { toast, confirm } from "../lib/notify";

interface InsightPanelProps {
  onNavigate: (tab: string, payload?: Record<string, unknown>) => void;
  compact?: boolean;
}

export default function InsightPanel({ onNavigate, compact }: InsightPanelProps) {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [cards, setCards] = useState<ActionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiFetch("/api/assistant/insights")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setInsights(d.insights || []);
          setCards(d.action_cards || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCardAction = async (card: ActionCard) => {
    switch (card.action) {
      case "open_suppliers":
        onNavigate("suppliers", card.payload);
        break;
      case "open_marketing":
        onNavigate("marketing", card.payload);
        break;
      case "open_promotions":
        onNavigate("promotions", card.payload);
        break;
      case "apply_price": {
        const recipeId = card.payload?.recipeId as number | undefined;
        const newPrice = card.payload?.newPrice as number | undefined;
        if (!recipeId || !newPrice) return;
        const ok = await confirm({
          message: `Aplicar novo preço R$ ${newPrice.toFixed(2)} em ${card.title}?`,
          confirmLabel: "Aplicar preço",
        });
        if (!ok) return;
        setApplyingId(card.id);
        try {
          const res = await apiFetch(`/api/recipes/${recipeId}/price`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ final_price: newPrice }),
          });
          if (res.ok) {
            toast.success("Preço atualizado com sucesso!");
            load();
          } else {
            const err = await res.json();
            toast.error(err.error || "Falha ao aplicar preço.");
          }
        } finally {
          setApplyingId(null);
        }
        break;
      }
    }
  };

  const severityClass = (s: InsightItem["severity"]) => {
    switch (s) {
      case "critical":
        return "border-red-200 bg-red-50/80 text-red-900";
      case "warning":
        return "border-amber-200 bg-amber-50/80 text-amber-900";
      case "success":
        return "border-emerald-200 bg-emerald-50/80 text-emerald-900";
      default:
        return "border-[#eee7de] bg-[#faf7f2] text-[#2e2624]";
    }
  };

  const cardIcon = (cat: ActionCard["category"]) => {
    switch (cat) {
      case "supplier":
        return <Truck size={14} />;
      case "promo":
        return <Tag size={14} />;
      case "pricing":
        return <Sparkles size={14} />;
      default:
        return <Zap size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#7d6f6b] py-4">
        <Loader2 size={16} className="animate-spin text-[#b3543d]" />
        Gerando insights...
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit size={20} className="text-[#b3543d]" />
            <h4 className="font-bold text-[#2e2624]">Assistente Inteligente</h4>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("assistant")}
            className="text-xs font-bold text-[#b3543d] hover:underline cursor-pointer flex items-center gap-1"
          >
            <MessageCircle size={14} />
            Pergunte à IA
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {insights.slice(0, compact ? 3 : 6).map((ins) => (
          <div
            key={ins.id}
            className={`p-3 rounded-xl border text-xs font-medium ${severityClass(ins.severity)}`}
          >
            {ins.message}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="p-4 bg-white border border-[#eee7de] rounded-xl flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <span className="p-1.5 rounded-lg bg-[#b3543d]/10 text-[#b3543d]">
                {cardIcon(card.category)}
              </span>
              <div>
                <p className="text-sm font-bold text-[#2e2624]">{card.title}</p>
                <p className="text-[11px] text-[#7d6f6b]">{card.description}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={applyingId === card.id}
              onClick={() => handleCardAction(card)}
              className="self-start px-3 py-1.5 rounded-lg bg-[#b3543d] text-white text-[11px] font-bold hover:bg-[#93412f] cursor-pointer disabled:opacity-60"
            >
              {applyingId === card.id
                ? "Aplicando..."
                : card.action === "open_suppliers"
                  ? "Abrir fornecedor"
                  : card.action === "open_marketing"
                    ? "Criar campanha"
                    : card.action === "apply_price"
                      ? "Aplicar"
                      : "Ver promoções"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}