import { useState, useEffect } from "react";
import { Plus, Trash2, Sliders, Info, Save, FileText, Check } from "lucide-react";
import { Recipe, RecipeIngredient, InvisibleCosts, isRetailSector } from "../types";
import confetti from "canvas-confetti";

interface PricingPageProps {
  onRecipeSaved: () => void;
  themeId: string;
}

export default function PricingPage({ onRecipeSaved, themeId }: PricingPageProps) {
  const isVarejo = isRetailSector(themeId);
  // Saved recipes list from db
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  // Live calculator inputs
  const [recipeName, setRecipeName] = useState(
    isRetailSector(themeId) ? "Camiseta Oversized Classic" : "Meu Brigadeiro Gourmet"
  );
  const [yieldUnits, setYieldUnits] = useState(40);
  const [marginRatio, setMarginRatio] = useState(60); // 60% margin aligns with 4.92 subtotal mathematically

  // Formulation list
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { name: "Leite condensado", amount: 395, unit: "g", price: 12.9 },
    { name: "Chocolate em pó", amount: 200, unit: "g", price: 24.5 },
    { name: "Manteiga", amount: 50, unit: "g", price: 38.0 }
  ]);

  // Overhead invisible costs state
  const [costs, setCosts] = useState<InvisibleCosts>({
    packaging: 0.35,
    delivery: 0.80,
    energy: 0.25,
    gas: 0.18,
    labor: 1.20,
    ifood_ratio: 12.0
  });

  const [saving, setSaving] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Fetch saved recipes and current costs
  const loadData = async () => {
    setFetchLoading(true);
    try {
      const recRes = await fetch("/api/recipes");
      if (recRes.ok) {
        const data = await recRes.json();
        setSavedRecipes(data);
      }
      const costRes = await fetch("/api/invisible-costs");
      if (costRes.ok) {
        const data = await costRes.json();
        setCosts({
          packaging: data.packaging || 0.35,
          delivery: data.delivery || 0.80,
          energy: data.energy || 0.25,
          gas: data.gas || 0.18,
          labor: data.labor || 1.20,
          ifood_ratio: data.ifood_ratio || 12.0
        });
      }
    } catch (e) {
      console.error("Erro ao carregar dados de precificação:", e);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (isVarejo) {
      setRecipeName("Camiseta Oversized Classic");
      setIngredients([
        { name: "Malha PV premium", amount: 1.8, unit: "m", price: 42.0 },
        { name: "Aviamento (etiqueta + costura)", amount: 1, unit: "un", price: 3.5 },
        { name: "Embalagem individual", amount: 1, unit: "un", price: 1.2 },
      ]);
    }
  }, [themeId]);

  // Set calculator to a loaded recipe
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id || null);
    setRecipeName(recipe.name);
    setYieldUnits(recipe.yield);
    setMarginRatio(recipe.margin_ratio);
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      setIngredients(recipe.ingredients);
    }
  };

  // Add blank ingredient row
  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      { name: "", amount: 0, unit: "g", price: 0 }
    ]);
  };

  // Update ingredient row value
  const updateIngredientRow = (index: number, field: keyof RecipeIngredient, value: any) => {
    const copy = [...ingredients];
    if (field === "price" || field === "amount") {
      copy[index] = { ...copy[index], [field]: Number(value) };
    } else {
      copy[index] = { ...copy[index], [field]: value };
    }
    setIngredients(copy);
  };

  // Remove ingredient row
  const removeIngredientRow = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  // Update invisible costs in the db asynchronously
  const handleCostChange = async (key: keyof InvisibleCosts, value: number) => {
    const updatedCosts = { ...costs, [key]: value };
    setCosts(updatedCosts);
    try {
      await fetch("/api/invisible-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCosts)
      });
    } catch (e) {
      console.error("Erro ao sincronizar custos invisíveis:", e);
    }
  };

  // MATHEMATICAL METRICS (High-Fidelity)
  // Custo total ingredientes: sum of pricing values
  // Since ingredients show packaging total price tag, let's treat the specified ingredient price as the cost.
  // Wait! To make the pricing highly flexible: we compute the cost total directly by summing ingredient price values.
  const costTotalIngredients = ingredients.reduce((sum, ing) => sum + (ing.price || 0), 0);
  
  // Rendimento
  const activeYield = yieldUnits > 0 ? yieldUnits : 1;
  const costPerUnit = costTotalIngredients / activeYield;

  // Invisible costs except iFood percentage
  const invisibleSum = Number(costs.packaging) + Number(costs.delivery) + Number(costs.energy) + Number(costs.gas) + Number(costs.labor);

  // Subtotal (Custo por unidade + custos invisiveis)
  const subtotalPrice = costPerUnit + invisibleSum;

  // Subtotal + margem (Markup)
  // Markup Price = Subtotal * (1 + margin / 100)
  const markupPrice = subtotalPrice * (1 + marginRatio / 100);

  // Tax inclusive final price (Includes iFood 12% fee)
  // Final Suggested Price = MarkupPrice / (1 - iFood_ratio / 100)
  const ifoodRatioVal = Number(costs.ifood_ratio) || 0;
  const finalSuggestedPrice = ifoodRatioVal < 100 ? markupPrice / (1 - ifoodRatioVal / 100) : markupPrice;

  // Save current pricing structure to SQLite
  const handleSaveRecipe = async () => {
    if (!recipeName.trim()) {
      alert("Por favor, digite um nome para a receita.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: selectedRecipeId || undefined,
        name: recipeName,
        yield: yieldUnits,
        margin_ratio: marginRatio,
        final_price: Number(finalSuggestedPrice.toFixed(2)),
        unit_cost: Number(costPerUnit.toFixed(2)),
        invisible_costs: Number(invisibleSum.toFixed(2)),
        subtotal: Number(markupPrice.toFixed(2)),
        ingredients
      };

      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Celebrate!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#b3543d", "#d48c6f", "#e5dec9"]
        });
        
        loadData();
        onRecipeSaved();
        alert(`Receita "${recipeName}" salva com sucesso!`);
      } else {
        const errorData = await res.json();
        alert("Falha ao salvar receita: " + errorData.error);
      }
    } catch (e: any) {
      alert("Erro ao conectar ao servidor: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset/Clear calculator to default template
  const handleResetCalculator = () => {
    setSelectedRecipeId(null);
    setRecipeName("Nova Receita Inteligente");
    setYieldUnits(40);
    setMarginRatio(60);
    setIngredients([
      { name: "Leite condensado", amount: 395, unit: "g", price: 12.9 },
      { name: "Chocolate em pó", amount: 200, unit: "g", price: 24.5 },
      { name: "Manteiga", amount: 50, unit: "g", price: 38.0 }
    ]);
  };

  const handleDeleteRecipe = async (id: number, name: string) => {
    if (!confirm(`Deseja realmente remover a receita "${name}"?`)) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (selectedRecipeId === id) {
          handleResetCalculator();
        }
        loadData();
        onRecipeSaved();
      }
    } catch (e) {
      console.error("Erro ao remover receita:", e);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#faf6f2] text-[#2c2221] font-sans" id="pricing-page">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Formulation and Invisible Costs) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Formulation ingredients block */}
          <div className="bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm space-y-4" id="ingredients-formulation-panel">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-[#2e2624]">
                  {isVarejo ? "Custo de aquisição / matéria-prima" : "Ingredientes da receita"}
                </h3>
                <p className="text-xs text-[#7d6f6b]">
                  {isVarejo
                    ? "Informe quantidade e custo unitário de cada insumo do produto"
                    : "Informe quantidade usada e preço pago pela embalagem"}
                </p>
              </div>
              <button
                id="btn-add-ingredient"
                onClick={addIngredientRow}
                className="px-3.5 py-1.5 bg-[#faf7f2] text-[#b3543d] border border-[#e5dec9]/60 text-xs font-bold rounded-xl hover:bg-[#f2ebda] transition cursor-pointer"
              >
                + {isVarejo ? "Item de custo" : "Ingrediente"}
              </button>
            </div>

            {/* Recipe title input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-[#eee7de]">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">
                  {isVarejo ? "Nome do produto" : "Nome da Receita"}
                </label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder={isVarejo ? "Ex: Camiseta Oversized Classic" : "Ex: Brigadeiro Gourmet"}
                  className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">
                    {isVarejo ? "Fração do lote / tamanho" : "Rendimento (unidades)"}
                  </label>
                  <input
                    type="number"
                    value={yieldUnits}
                    onChange={(e) => setYieldUnits(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#2e2624] font-mono focus:outline-none focus:border-[#b3543d]"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <span className="text-[10px] uppercase font-bold text-[#7d6f6b]">
                    {isVarejo ? "Total matéria-prima" : "Total Ingredientes"}
                  </span>
                  <span className="text-sm mt-2 font-bold text-[#b3543d]">R$ {costTotalIngredients.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* List ingredient rows */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {ingredients.map((ing, index) => (
                <div key={index} className="grid grid-cols-12 gap-2.5 items-center bg-[#faf7f2]/50 border border-[#eee7de] p-2.5 rounded-xl" id={`ing-row-${index}`}>
                  
                  {/* Ingredient name */}
                  <div className="col-span-5">
                    <input
                      type="text"
                      className="w-full bg-white border border-[#e5dec9]/75 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                      placeholder={isVarejo ? "Matéria-prima (ex: Malha PV)" : "Ingrediente (ex: Leite condensado)"}
                      value={ing.name}
                      onChange={(e) => updateIngredientRow(index, "name", e.target.value)}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      className="w-full bg-white border border-[#e5dec9]/75 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono text-[#2e2624] text-center focus:outline-none focus:border-[#b3543d]"
                      placeholder="Qtd"
                      value={ing.amount || ""}
                      onChange={(e) => updateIngredientRow(index, "amount", e.target.value)}
                    />
                  </div>

                  {/* Unit selector */}
                  <div className="col-span-2">
                    <select
                      className="w-full bg-white border border-[#e5dec9]/75 px-2 py-1.5 rounded-lg text-[11px] font-bold text-[#2e2624] focus:outline-none focus:border-[#b3543d] cursor-pointer"
                      value={ing.unit}
                      onChange={(e) => updateIngredientRow(index, "unit", e.target.value)}
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="un">un</option>
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                    </select>
                  </div>

                  {/* Price Tag */}
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7d6f6b] font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-white border border-[#e5dec9]/75 pl-7 pr-1.5 py-1.5 rounded-lg text-xs font-semibold font-mono text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                        placeholder="0.00"
                        value={ing.price || ""}
                        onChange={(e) => updateIngredientRow(index, "price", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row Delete Icon */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeIngredientRow(index)}
                      className="text-[#7d6f6b] hover:text-red-500 hover:bg-red-50 transition p-1.5 rounded-lg cursor-pointer"
                      title="Deletar row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Underlay invisible costs input dashboard column */}
          <div className="bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm space-y-4" id="invisible-overheads-panel">
            <div>
              <h3 className="text-base font-bold text-[#2e2624]">Custos invisíveis (por unidade)</h3>
              <p className="text-xs text-[#7d6f6b]">Não esqueça do que parece &quot;grátis&quot;. Estes valores impactam a margem líquida.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              
              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Embalagem (Und)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#7d6f6b] font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.packaging}
                    onChange={(e) => handleCostChange("packaging", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#e5dec9]/60 pl-8 pr-3 py-2 rounded-xl text-xs font-mono font-bold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Entrega (Logística)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#7d6f6b] font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.delivery}
                    onChange={(e) => handleCostChange("delivery", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#e5dec9]/60 pl-8 pr-3 py-2 rounded-xl text-xs font-mono font-bold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Energia (Luz/Água)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#7d6f6b] font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.energy}
                    onChange={(e) => handleCostChange("energy", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#e5dec9]/60 pl-8 pr-3 py-2 rounded-xl text-xs font-mono font-bold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Gás (Forno)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#7d6f6b] font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.gas}
                    onChange={(e) => handleCostChange("gas", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#e5dec9]/60 pl-8 pr-3 py-2 rounded-xl text-xs font-mono font-bold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Mão de obra (Tempo)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#7d6f6b] font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.labor}
                    onChange={(e) => handleCostChange("labor", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#e5dec9]/60 pl-8 pr-3 py-2 rounded-xl text-xs font-mono font-bold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Taxa iFood (%)</label>
                <div className="relative mt-1">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7d6f6b] font-bold">%</span>
                  <input
                    type="number"
                    value={costs.ifood_ratio}
                    onChange={(e) => handleCostChange("ifood_ratio", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#e5dec9]/60 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                  />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Columns (Result and List of recipes) */}
        <div className="space-y-6">
          
          {/* Result Calculation Stamp card */}
          <div className="bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm flex flex-col justify-between" id="price-computation-panel">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-[#2e2624] flex items-center gap-2">
                  <Info size={16} className="text-[#b3543d]" />
                  <span>Preço sugerido</span>
                </h3>
                <span className="text-[10px] font-mono text-[#b3543d]">Atualiza em tempo real</span>
              </div>

              {/* Margin Selector slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#7d6f6b] flex items-center gap-1">
                    <Sliders size={12} />
                    Margem de lucro
                  </span>
                  <span className="text-[#b3543d] font-mono">{marginRatio}%</span>
                </div>
                <input
                  id="margin-slider"
                  type="range"
                  min="10"
                  max="300"
                  value={marginRatio}
                  onChange={(e) => setMarginRatio(parseInt(e.target.value))}
                  className="w-full accent-[#b3543d] cursor-pointer"
                />
              </div>

              {/* Sub items cost break-down details */}
              <div className="space-y-2 text-xs border-t border-[#eee7de] pt-3.5">
                <div className="flex justify-between text-[#7d6f6b]">
                  <span>Custo por unidade:</span>
                  <span className="font-mono text-[#2e2624] font-bold">R$ {costPerUnit.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[#7d6f6b]">
                  <span>Custos invisíveis:</span>
                  <span className="font-mono text-[#2e2624] font-bold">R$ {invisibleSum.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[#7d6f6b] border-b border-[#eee7de] pb-3">
                  <span>Subtotal + margem:</span>
                  <span className="font-mono text-[#2e2624] font-bold">R$ {markupPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Final sugg stamp container */}
              <div className="p-4 bg-[#b3543d] rounded-2xl text-white shadow-md shadow-[#b3543d]/15 mt-2 space-y-1">
                <span className="text-[9px] uppercase font-black tracking-wider opacity-90 block text-red-100">Preço final sugerido</span>
                <span className="text-3xl font-bold tracking-tight block text-white font-sans">
                  R$ {finalSuggestedPrice.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium opacity-80 block text-rose-100/95">
                  Inclui taxa iFood ({costs.ifood_ratio}%)
                </span>
              </div>

            </div>

            <div className="flex gap-2.5 mt-6 border-t border-[#eee7de] pt-4">
              <button
                onClick={handleResetCalculator}
                className="flex-1 py-2.5 text-xs font-bold text-[#7d6f6b] hover:text-[#2e2624] bg-[#faf7f2] hover:bg-[#f2ebda] border border-[#e5dec9]/60 rounded-xl transition-all cursor-pointer"
              >
                Limpar
              </button>
              <button
                onClick={handleSaveRecipe}
                disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#b3543d] to-[#d48c6f] text-white hover:opacity-95 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow shadow-[#b3543d]/10 cursor-pointer"
              >
                <Save size={14} />
                <span>{saving ? "Salvando..." : "Salvar receita"}</span>
              </button>
            </div>
          </div>

          {/* List of previously saved Recipes */}
          <div className="bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm" id="saved-recipes-list">
            <h4 className="font-bold text-[#2e2624] text-sm mb-4 flex items-center gap-1.5">
              <FileText size={16} className="text-[#b3543d]" />
              <span>{isVarejo ? "Produtos precificados" : "Receitas Gravadas"} ({savedRecipes.length})</span>
            </h4>

            {fetchLoading && savedRecipes.length === 0 ? (
              <p className="text-xs text-[#7d6f6b]">Carregando catálogo...</p>
            ) : savedRecipes.length === 0 ? (
              <p className="text-xs text-[#7d6f6b] leading-relaxed">Nenhuma receita salva. Modele ingredientes e salve no botão acima!</p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {savedRecipes.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition ${
                      selectedRecipeId === r.id
                        ? "bg-[#b3543d]/10 border-[#b3543d]/40 text-[#b3543d]"
                        : "bg-[#faf7f2] border-[#e5dec9]/50 hover:border-[#b3543d]/30 text-[#2e2624]"
                    }`}
                    onClick={() => handleSelectRecipe(r)}
                  >
                    <div className="space-y-0.5 animate-fade-in">
                      <div className="font-semibold text-xs text-[#2e2624]">{r.name}</div>
                      <div className="text-[10px] text-[#7d6f6b]">
                        Rend: {r.yield} un • Sug: <span className="font-bold text-[#b3543d]">R$ {r.final_price?.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (r.id) handleDeleteRecipe(r.id, r.name);
                      }}
                      className="text-[#7d6f6b] hover:text-red-500 p-1 rounded-lg hover:bg-neutral-200/50 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
