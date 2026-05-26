import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { 
  BrainCircuit, 
  Sparkles, 
  Copy, 
  Calendar, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  Download, 
  Image as LucideImage, 
  Palette, 
  Type, 
  DollarSign, 
  Grid, 
  RefreshCcw, 
  Heading, 
  MessageCircle,
  HelpCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { Product, Recipe } from "../types";
import { withThemeQuery } from "../lib/api";

interface MarketingPageProps {
  initialPromptContext?: string;
  themeId: string;
}

// Preset configurations for different visual vibes in the Canvas Creator
interface DesignPreset {
  id: string;
  name: string;
  themeColor: string;
  accentColor: string;
  textColor: string;
  bgOverlay: string;
  gradientStart: string;
  gradientEnd: string;
  photoUrl: string;
}

const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "chocolate",
    name: "🍫 Cacau Gourmet",
    themeColor: "#4a2d21",
    accentColor: "#c8947b",
    textColor: "#ffffff",
    bgOverlay: "rgba(42, 23, 16, 0.82)",
    gradientStart: "#1a0f0a",
    gradientEnd: "#45251b",
    photoUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "strawberry",
    name: "🍓 Ninho e Morango",
    themeColor: "#a63342",
    accentColor: "#ea9aa2",
    textColor: "#ffffff",
    bgOverlay: "rgba(50, 10, 15, 0.82)",
    gradientStart: "#400810",
    gradientEnd: "#9e2536",
    photoUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "mint",
    name: "🌿 Limão & Pistache",
    themeColor: "#1e5e4a",
    accentColor: "#9be0cb",
    textColor: "#ffffff",
    bgOverlay: "rgba(10, 35, 27, 0.82)",
    gradientStart: "#0a261d",
    gradientEnd: "#236d55",
    photoUrl: "https://images.unsplash.com/photo-1513534870294-ade175f4c177?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "passion",
    name: "🍊 Calda de Maracujá",
    themeColor: "#db7c26",
    accentColor: "#ffd6a6",
    textColor: "#ffffff",
    bgOverlay: "rgba(45, 22, 5, 0.8)",
    gradientStart: "#2e1402",
    gradientEnd: "#b85d14",
    photoUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "sweet",
    name: "🍬 Algodão Doce",
    themeColor: "#e07a9e",
    accentColor: "#fbf0f4",
    textColor: "#2e2624",
    bgOverlay: "rgba(255, 255, 255, 0.88)",
    gradientStart: "#fcebf0",
    gradientEnd: "#e6add0",
    photoUrl: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "dark",
    name: "☕ Café & Neon",
    themeColor: "#1a1a1a",
    accentColor: "#00f0ff",
    textColor: "#ffffff",
    bgOverlay: "rgba(12, 12, 12, 0.85)",
    gradientStart: "#050508",
    gradientEnd: "#1a1a24",
    photoUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80"
  }
];

export default function MarketingPage({ initialPromptContext, themeId }: MarketingPageProps) {
  // --- TAB 1: TEXT GENERATOR STATES ---
  const [context, setContext] = useState("Brigadeiro gourmet — promoção do dia dos namorados");
  const [selectedType, setSelectedType] = useState<"caption" | "hashtags" | "seasonal">("caption");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);

  // --- TAB 2: CANVAS IMAGE STUDIO STATES ---
  const [headline, setHeadline] = useState("SÓ HOJE!");
  const [productName, setProductName] = useState("Brigadeiro Gourmet Noir");
  const [description, setDescription] = useState("Massa macia de chocolate belga 70% com confeitos crocantes.");
  const [price, setPrice] = useState("R$ 15,00");
  const [cta, setCta] = useState("Garanta no WhatsApp!");
  
  const [selectedPreset, setSelectedPreset] = useState<string>("chocolate");
  const [bgType, setBgType] = useState<"gradient" | "image">("gradient"); // gradient or image overlay
  const [artStyle, setArtStyle] = useState<"gourmet" | "promo" | "bistro" | "neon" | "minimal">("gourmet");
  
  // Database data loaded for dropdown autofill
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  
  // Image caching to avoid multiple loading flickers
  const imageCache = useRef<{ [key: string]: HTMLImageElement }>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load database lists for the dropdown
  useEffect(() => {
    setLoadingDb(true);
    const p1 = fetch(withThemeQuery("/api/products", themeId)).then((r) => r.json()).catch(() => []);
    const p2 = fetch("/api/recipes").then((r) => r.json()).catch(() => []);

    Promise.all([p1, p2]).then(([prods, recs]) => {
      setProducts(prods || []);
      setRecipes(recs || []);
      setLoadingDb(false);
    });
  }, [themeId]);

  useEffect(() => {
    fetch("/api/settings/gemini-status")
      .then((r) => r.json())
      .then((d) => setGeminiConfigured(!!d.configured))
      .catch(() => setGeminiConfigured(false));
  }, [response]);

  // Sync initial prompt from other pages (e.g. PromotionsPage)
  useEffect(() => {
    if (initialPromptContext) {
      setContext(initialPromptContext);
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.6 }
      });
    }
  }, [initialPromptContext]);

  // Redraw canvas whenever drawing elements change
  useEffect(() => {
    drawCanvas();
  }, [headline, productName, description, price, cta, selectedPreset, bgType, artStyle]);

  // --- AI TEXT CONTENT GENERATION ---
  const handleGenerateCampaign = async () => {
    if (!context.trim()) {
      alert("Por favor escreva o produto ou a ocasião para orientar a IA.");
      return;
    }

    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, type: selectedType })
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.generatedText);
        setGeminiConfigured(true);
        confetti({
          particleCount: 50,
          spread: 80,
          colors: ["#b3543d", "#d48c6f", "#e5dec9"]
        });
      } else {
        const err = await res.json();
        setResponse(`Erro de geração: ${err.error || "Tente novamente em breve."}`);
      }
    } catch (e: any) {
      setResponse(`Falha ao conectar ao servidor: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- AI FLYER DESIGN AUTOGENERATOR ---
  const handleGenerateFlyerTextWithAI = async () => {
    if (!context.trim()) {
      alert("Escreva uma base de produto/tema no campo do gerador de texto primeiro!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, type: "flyer" })
      });

      if (!res.ok) throw new Error("Erro de servidor ao gerar a arte");
      
      const data = await res.json();
      
      // Parse JSON from Gemini safely
      let parsed;
      try {
        parsed = JSON.parse(data.generatedText);
      } catch (err) {
        // Fallback in case formatting fails
        console.error("Failed to parse flyer json, trying regex", err);
        const text = data.generatedText;
        const headlineMatch = text.match(/"headline"\s*:\s*"([^"]+)"/);
        const nameMatch = text.match(/"productName"\s*:\s*"([^"]+)"/);
        const descMatch = text.match(/"description"\s*:\s*"([^"]+)"/);
        const priceMatch = text.match(/"priceTag"\s*:\s*"([^"]+)"/);
        const ctaMatch = text.match(/"cta"\s*:\s*"([^"]+)"/);
        
        parsed = {
          headline: headlineMatch ? headlineMatch[1] : "OFERTA ESPECIAL",
          productName: nameMatch ? nameMatch[1] : context.split("—")[0].trim(),
          description: descMatch ? descMatch[1] : "Sabor inigualável e textura refinada feita para você.",
          priceTag: priceMatch ? priceMatch[1] : "R$ 15,00",
          cta: ctaMatch ? ctaMatch[1] : "Peça agora pelo WhatsApp!"
        };
      }

      // Populate Canvas input states
      setHeadline(parsed.headline || "NOVIDADE!");
      setProductName(parsed.productName || "Gourmet Especial");
      setDescription(parsed.description || "Insumos selecionados e fresquinhos.");
      setPrice(parsed.priceTag || "R$ 15,00");
      setCta(parsed.cta || "Chame no WhatsApp!");

      // Scroll smoothly to the flyer design area
      setTimeout(() => {
        document.getElementById("image-studio-divider")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      confetti({
        particleCount: 65,
        spread: 90,
        colors: ["#db7c26", "#ea9aa2", "#9be0cb"]
      });
    } catch (error: any) {
      alert("Não foi possível gerar sugestões automáticas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- DATABASE DATA HANDLERS ---
  const handleImportProduct = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;

    if (val.startsWith("rec_")) {
      const id = parseInt(val.replace("rec_", ""), 10);
      const matched = recipes.find(r => r.id === id);
      if (matched) {
        setProductName(matched.name);
        setPrice(`R$ ${matched.final_price?.toFixed(2).replace(".", ",")}`);
        setDescription(`Receita artesanal fresquinha. Rende deliciosas porções!`);
      }
    } else if (val.startsWith("prod_")) {
      const id = parseInt(val.replace("prod_", ""), 10);
      const matched = products.find(p => p.id === id);
      if (matched) {
        setProductName(matched.name);
        setPrice("R$ 10,00"); // default product pricing placeholder
        setDescription(`Disponível no nosso estoque! Garanta o seu doce favorito hoje.`);
      }
    }
    // Set customized tagline
    setHeadline("PRODUTO ARTESANAL");
    e.target.value = ""; // clear selector

    // Scroll smoothly to flyer design area
    setTimeout(() => {
      document.getElementById("image-studio-divider")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // --- CANVAS HIGH-RESOLUTION RENDERER ENGINE ---
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const preset = DESIGN_PRESETS.find(p => p.id === selectedPreset) || DESIGN_PRESETS[0];

    // Clear canvas completely
    ctx.clearRect(0, 0, 1080, 1080);

    // Helper to split text into wrapped lines under a certain font setting
    const getWrappedLines = (c: CanvasRenderingContext2D, text: string, maxWidth: number, fontSetting: string): string[] => {
      c.font = fontSetting;
      const words = text.split(" ");
      let lines: string[] = [];
      let currentLine = "";
      
      for (let n = 0; n < words.length; n++) {
        let testLine = currentLine + words[n] + " ";
        let metrics = c.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(currentLine.trim());
          currentLine = words[n] + " ";
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine.trim());
      }
      return lines;
    };

    const drawGradientBg = (c: CanvasRenderingContext2D) => {
      let grad = c.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, preset.gradientStart);
      grad.addColorStop(1, preset.gradientEnd);
      c.fillStyle = grad;
      c.fillRect(0, 0, 1080, 1080);
    };

    const renderLayers = (c: CanvasRenderingContext2D) => {
      let activeThemeColor = preset.themeColor;
      let activeAccentColor = preset.accentColor;
      let activeTextColor = preset.textColor;
      let activeBgOverlay = preset.bgOverlay;

      // Draw beautiful template overlays according to selected artStyle
      if (artStyle === "gourmet") {
        // Overlay banner translucent card inside the image
        c.fillStyle = bgType === "image" ? activeBgOverlay : "rgba(255, 255, 255, 0.12)";
        c.beginPath();
        c.roundRect(100, 100, 880, 880, 48);
        c.fill();

        // Elegant inset border frame in gold/subtle tone
        c.strokeStyle = selectedPreset === "sweet" ? "rgba(179,84,61,0.2)" : "rgba(255,255,255,0.25)";
        c.lineWidth = 4;
        c.beginPath();
        c.roundRect(120, 120, 840, 840, 36);
        c.stroke();

        // Dynamic Product Name configuration with auto-scale fallback
        let prodFontSize = 74;
        let prodLineHeight = 84;
        let prodFont = `bold ${prodFontSize}px "Playfair Display", serif`;
        let prodLines = getWrappedLines(c, productName, 760, prodFont);
        
        if (prodLines.length > 2 || productName.length > 24) {
          prodFontSize = 56;
          prodLineHeight = 66;
          prodFont = `bold ${prodFontSize}px "Playfair Display", serif`;
          prodLines = getWrappedLines(c, productName, 760, prodFont);
        }
        if (prodLines.length > 2) {
          prodFontSize = 44;
          prodLineHeight = 52;
          prodFont = `bold ${prodFontSize}px "Playfair Display", serif`;
          prodLines = getWrappedLines(c, productName, 760, prodFont);
        }

        // Dynamic Description configuration with auto-scale
        let descFontSize = 32;
        let descLineHeight = 44;
        let descFont = `italic 500 ${descFontSize}px "Inter", sans-serif`;
        let descLines = getWrappedLines(c, description, 720, descFont);
        
        if (descLines.length > 3 || description.length > 100) {
          descFontSize = 26;
          descLineHeight = 36;
          descFont = `italic 500 ${descFontSize}px "Inter", sans-serif`;
          descLines = getWrappedLines(c, description, 720, descFont);
        }

        // Space allocation from Y=120 to Y=620 (height of 500px)
        const totalTopHeight = 45 + 55 + (prodLines.length * prodLineHeight) + 30 + (descLines.length * descLineHeight);
        let startYTop = 130 + (490 - totalTopHeight) / 2;
        if (startYTop < 155) startYTop = 155; // clamp safety

        let currentY = startYTop;

        // 1. Top brand embellishment
        c.fillStyle = selectedPreset === "sweet" ? "#b3543d" : activeAccentColor;
        c.font = 'bold 24px "Outfit", sans-serif';
        c.textAlign = "center";
        c.fillText("✨ EXCLUSIVO DOCE GOURMET ✨", 540, currentY);
        currentY += 45;

        // 2. Headline
        let headFontSize = 38;
        c.font = `800 ${headFontSize}px "Outfit", sans-serif`;
        while (c.measureText(headline).width > 760 && headFontSize > 24) {
          headFontSize -= 2;
          c.font = `800 ${headFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = selectedPreset === "sweet" ? "#2e2624" : "#ffffff";
        c.fillText(headline.toUpperCase(), 540, currentY);
        currentY += 60;

        // 3. Product Name (Playfair Display)
        c.fillStyle = selectedPreset === "sweet" ? "#b3543d" : activeAccentColor;
        c.font = prodFont;
        prodLines.forEach((line, idx) => {
          c.fillText(line, 540, currentY + (idx * prodLineHeight));
        });
        currentY += (prodLines.length * prodLineHeight) + 30;

        // 4. Description (Inter sans)
        c.fillStyle = selectedPreset === "sweet" ? "#5a4d4a" : "rgba(255, 255, 255, 0.88)";
        c.font = descFont;
        descLines.forEach((line, idx) => {
          c.fillText(line, 540, currentY + (idx * descLineHeight));
        });

        // 5. Price badge circle layout (Y=750 center is fully isolated and safe)
        c.fillStyle = selectedPreset === "sweet" ? "#b3543d" : activeAccentColor;
        c.beginPath();
        c.arc(540, 750, 105, 0, 2 * Math.PI);
        c.fill();

        c.strokeStyle = selectedPreset === "sweet" ? "#ffffff" : "#1a1a1a";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(540, 750, 95, 0, 2 * Math.PI);
        c.stroke();

        let priceFontSize = 46;
        c.font = `900 ${priceFontSize}px "Outfit", sans-serif`;
        while (c.measureText(price).width > 165 && priceFontSize > 28) {
          priceFontSize -= 3;
          c.font = `900 ${priceFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = selectedPreset === "sweet" ? "#ffffff" : "#2e2624";
        c.fillText(price, 540, 750 + (priceFontSize * 0.35));

        // 6. Call-to-Action
        let ctaFontSize = 32;
        c.font = `bold ${ctaFontSize}px "Outfit", sans-serif`;
        while (c.measureText(cta).width > 760 && ctaFontSize > 22) {
          ctaFontSize -= 2;
          c.font = `bold ${ctaFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = selectedPreset === "sweet" ? "#7d6f6b" : "rgba(255, 255, 255, 0.75)";
        c.fillText(cta, 540, 930);

      } else if (artStyle === "promo") {
        // Solid Commercial Banner
        c.fillStyle = activeThemeColor;
        c.fillRect(0, 0, 1080, 180);
        c.fillRect(0, 910, 1080, 170);

        // Headline on top bar
        let headFontSize = 56;
        c.font = `black italic ${headFontSize}px "Outfit", sans-serif`;
        while (c.measureText(headline).width > 940 && headFontSize > 32) {
          headFontSize -= 4;
          c.font = `black italic ${headFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = "#ffffff";
        c.textAlign = "center";
        c.fillText(headline.toUpperCase(), 540, 115);

        // Dark dim over photo to guarantee legibility
        if (bgType === "image") {
          c.fillStyle = "rgba(0,0,0,0.48)";
          c.fillRect(0, 180, 1080, 730);
        }

        // Product Name wrapping
        let prodFontSize = 80;
        let prodLineHeight = 92;
        let prodFont = `900 ${prodFontSize}px "Outfit", sans-serif`;
        let prodLines = getWrappedLines(c, productName, 840, prodFont);
        if (prodLines.length > 2 || productName.length > 24) {
          prodFontSize = 62;
          prodLineHeight = 72;
          prodFont = `900 ${prodFontSize}px "Outfit", sans-serif`;
          prodLines = getWrappedLines(c, productName, 840, prodFont);
        }
        
        // Description wrapping
        let descFontSize = 38;
        let descLineHeight = 50;
        let descFont = `500 ${descFontSize}px "Inter", sans-serif`;
        let descLines = getWrappedLines(c, description, 820, descFont);
        if (descLines.length > 3 || description.length > 100) {
          descFontSize = 30;
          descLineHeight = 40;
          descFont = `500 ${descFontSize}px "Inter", sans-serif`;
          descLines = getWrappedLines(c, description, 820, descFont);
        }
        
        const pillHeight = 140;
        const marginBetween = 35;
        
        // Calculate total stack height
        const totalStackHeight = (prodLines.length * prodLineHeight) + marginBetween + (descLines.length * descLineHeight) + marginBetween + pillHeight;
        
        let startY = 180 + (730 - totalStackHeight) / 2;
        if (startY < 195) startY = 195; // bound check
        
        let currentY = startY + (prodLineHeight * 0.82); // approximate baseline offset
        
        // Product Name
        c.fillStyle = "#fac710"; // vibrant promotional gold
        c.font = prodFont;
        c.textAlign = "center";
        prodLines.forEach((line) => {
          c.fillText(line, 540, currentY);
          currentY += prodLineHeight;
        });

        currentY += marginBetween - (prodLineHeight * 0.18);

        // Description
        c.fillStyle = "rgba(255, 255, 255, 0.95)";
        c.font = descFont;
        descLines.forEach((line) => {
          c.fillText(line, 540, currentY);
          currentY += descLineHeight;
        });

        currentY += marginBetween - (descLineHeight * 0.18);

        // Shiny rounded button for pricing
        c.fillStyle = "#fac710";
        c.beginPath();
        c.roundRect(540 - 250, currentY, 500, pillHeight, 30);
        c.fill();

        // Price text centered inside pill
        let priceFontSize = 64;
        c.font = `900 ${priceFontSize}px "Outfit", sans-serif`;
        while (c.measureText(price).width > 440 && priceFontSize > 36) {
          priceFontSize -= 3;
          c.font = `900 ${priceFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = "#0c0c0c";
        c.fillText(price, 540, currentY + (pillHeight / 2) + (priceFontSize * 0.35));

        // Bottom Bar info CTA
        let ctaFontSize = 38;
        c.font = `bold italic ${ctaFontSize}px "Outfit", sans-serif`;
        while (c.measureText(cta).width > 940 && ctaFontSize > 22) {
          ctaFontSize -= 2;
          c.font = `bold italic ${ctaFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = "#ffffff";
        c.textAlign = "center";
        c.fillText(cta, 540, 1010);

      } else if (artStyle === "minimal") {
        // Classic layout card representation
        c.fillStyle = "rgba(255, 255, 255, 0.95)";
        c.fillRect(60, 60, 960, 960);

        // Inner frames
        c.strokeStyle = "#e5dec9";
        c.lineWidth = 2;
        c.strokeRect(80, 80, 920, 920);
        c.strokeStyle = activeThemeColor;
        c.lineWidth = 2;
        c.strokeRect(95, 95, 890, 890);

        // Product Name wrapping
        let prodFontSize = 74;
        let prodLineHeight = 86;
        let prodFont = `bold ${prodFontSize}px "Playfair Display", serif`;
        let prodLines = getWrappedLines(c, productName, 780, prodFont);
        if (prodLines.length > 2 || productName.length > 24) {
          prodFontSize = 54;
          prodLineHeight = 64;
          prodFont = `bold ${prodFontSize}px "Playfair Display", serif`;
          prodLines = getWrappedLines(c, productName, 780, prodFont);
        }
        
        // Description wrapping
        let descFontSize = 34;
        let descLineHeight = 48;
        let descFont = `300 ${descFontSize}px "Inter", sans-serif`;
        let descLines = getWrappedLines(c, description, 760, descFont);
        if (descLines.length > 3 || description.length > 100) {
          descFontSize = 26;
          descLineHeight = 36;
          descFont = `300 ${descFontSize}px "Inter", sans-serif`;
          descLines = getWrappedLines(c, description, 760, descFont);
        }
        
        const priceBoxHeight = 110;
        const marginBetween = 30;
        
        // Compute total stack height for centered minimalism
        const totalStackHeight = 
          45 + // Headline space
          marginBetween +
          (prodLines.length * prodLineHeight) +
          30 + // Bracket line space
          (descLines.length * descLineHeight) +
          marginBetween +
          priceBoxHeight +
          marginBetween +
          40; // CTA space
          
        let startY = 120 + (840 - totalStackHeight) / 2;
        if (startY < 140) startY = 140; // Clamped safeguard
        
        let currentY = startY + 30;
        
        // Draw Headline
        let headFontSize = 32;
        c.font = `italic ${headFontSize}px "Playfair Display", serif`;
        while (c.measureText(`✦ ${headline} ✦`).width > 780 && headFontSize > 22) {
          headFontSize -= 2;
          c.font = `italic ${headFontSize}px "Playfair Display", serif`;
        }
        c.fillStyle = "#8a7a76";
        c.textAlign = "center";
        c.fillText(`✦ ${headline} ✦`, 540, currentY);
        
        currentY += marginBetween + 15;
        
        // Draw Product Name (serif bold)
        c.fillStyle = "#2e2624";
        c.font = prodFont;
        prodLines.forEach((line) => {
          c.fillText(line, 540, currentY);
          currentY += prodLineHeight;
        });
        
        currentY += 15;
        
        // Small divider line
        c.strokeStyle = activeAccentColor;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(540 - 100, currentY);
        c.lineTo(540 + 100, currentY);
        c.stroke();
        
        currentY += 40;
        
        // Draw Description
        c.fillStyle = "#5a4d4a";
        c.font = descFont;
        descLines.forEach((line) => {
          c.fillText(line, 540, currentY);
          currentY += descLineHeight;
        });
        
        currentY += marginBetween - 5;
        
        // Draw Double bordered Price label
        c.strokeStyle = activeThemeColor;
        c.lineWidth = 2;
        c.strokeRect(540 - 160, currentY, 320, priceBoxHeight);
        c.lineWidth = 1;
        c.strokeRect(540 - 152, currentY + 4, 304, priceBoxHeight - 8);
        
        // Price text centered inside minimal box
        let priceFontSize = 54;
        c.font = `bold ${priceFontSize}px "Outfit", sans-serif`;
        while (c.measureText(price).width > 280 && priceFontSize > 32) {
          priceFontSize -= 3;
          c.font = `bold ${priceFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = "#2e2624";
        c.fillText(price, 540, currentY + (priceBoxHeight / 2) + (priceFontSize * 0.35));
        
        currentY += priceBoxHeight + marginBetween + 20;
        
        // Draw Call-to-action (CTA)
        let ctaFontSize = 32;
        c.font = `bold ${ctaFontSize}px "Outfit", sans-serif`;
        while (c.measureText(cta).width > 780 && ctaFontSize > 20) {
          ctaFontSize -= 2;
          c.font = `bold ${ctaFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = activeThemeColor;
        c.fillText(cta, 540, currentY);

      } else if (artStyle === "neon") {
        // Glowing futuristic look
        c.fillStyle = "rgba(12, 12, 14, 0.88)";
        c.fillRect(50, 50, 980, 980);

        // Glowing cyan borders
        c.strokeStyle = activeAccentColor;
        c.shadowColor = activeAccentColor;
        c.shadowBlur = 20;
        c.lineWidth = 6;
        c.strokeRect(70, 70, 940, 940);
        c.shadowBlur = 0; // reset shadow

        // Product Name wrapping
        let prodFontSize = 80;
        let prodLineHeight = 92;
        let prodFont = `900 ${prodFontSize}px "Outfit", sans-serif`;
        let prodLines = getWrappedLines(c, productName, 780, prodFont);
        if (prodLines.length > 2 || productName.length > 24) {
          prodFontSize = 60;
          prodLineHeight = 72;
          prodFont = `900 ${prodFontSize}px "Outfit", sans-serif`;
          prodLines = getWrappedLines(c, productName, 780, prodFont);
        }
        
        // Description wrapping
        let descFontSize = 34;
        let descLineHeight = 48;
        let descFont = `500 ${descFontSize}px "Inter", sans-serif`;
        let descLines = getWrappedLines(c, description, 760, descFont);
        if (descLines.length > 3 || description.length > 100) {
          descFontSize = 26;
          descLineHeight = 36;
          descFont = `500 ${descFontSize}px "Inter", sans-serif`;
          descLines = getWrappedLines(c, description, 760, descFont);
        }
        
        const pillHeight = 140;
        const marginBetween = 30;
        
        // Compute total neon stack height
        const totalStackHeight = 
          40 + // Headline height
          marginBetween +
          (prodLines.length * prodLineHeight) +
          marginBetween +
          (descLines.length * descLineHeight) +
          marginBetween +
          pillHeight +
          marginBetween +
          40; // CTA height
          
        let startY = 120 + (840 - totalStackHeight) / 2;
        if (startY < 140) startY = 140;
        
        let currentY = startY + 30;
        
        // Headline
        let headFontSize = 34;
        c.font = `bold ${headFontSize}px "Outfit", sans-serif`;
        while (c.measureText(headline).width > 780 && headFontSize > 22) {
          headFontSize -= 2;
          c.font = `bold ${headFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = "#ffffff";
        c.textAlign = "center";
        c.fillText(headline.toUpperCase(), 540, currentY);
        
        currentY += marginBetween + 15;
        
        // Product Name (glowing neon)
        c.fillStyle = activeAccentColor;
        c.shadowColor = activeAccentColor;
        c.shadowBlur = 20;
        c.font = prodFont;
        prodLines.forEach((line) => {
          c.fillText(line, 540, currentY);
          currentY += prodLineHeight;
        });
        c.shadowBlur = 0; // reset blur for next elements
        
        currentY += 15;
        
        // Description
        c.fillStyle = "#ffffff";
        c.font = descFont;
        descLines.forEach((line) => {
          c.fillText(line, 540, currentY);
          currentY += descLineHeight;
        });
        
        currentY += marginBetween - 5;
        
        // Giant neon pill button
        c.fillStyle = activeAccentColor;
        c.shadowColor = activeAccentColor;
        c.shadowBlur = 15;
        c.beginPath();
        c.roundRect(540 - 230, currentY, 460, pillHeight, 70);
        c.fill();
        c.shadowBlur = 0; // reset
        
        // Price text
        let priceFontSize = 60;
        c.font = `900 ${priceFontSize}px "Outfit", sans-serif`;
        while (c.measureText(price).width > 400 && priceFontSize > 34) {
          priceFontSize -= 3;
          c.font = `900 ${priceFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = "#0c0c0c";
        c.fillText(price, 540, currentY + (pillHeight / 2) + (priceFontSize * 0.35));
        
        currentY += pillHeight + marginBetween + 20;
        
        // CTA
        let ctaFontSize = 34;
        c.font = `black italic ${ctaFontSize}px "Outfit", sans-serif`;
        while (c.measureText(`⚡ ${cta.toUpperCase()} ⚡`).width > 780 && ctaFontSize > 20) {
          ctaFontSize -= 2;
          c.font = `black italic ${ctaFontSize}px "Outfit", sans-serif`;
        }
        c.fillStyle = "#ffffff";
        c.fillText(`⚡ ${cta.toUpperCase()} ⚡`, 540, currentY);

      } else {
        // bistro art style (chalk vintage blackboard)
        c.fillStyle = "rgba(20, 20, 20, 0.94)";
        c.fillRect(80, 80, 920, 920);

        // Chalkboard border double line
        c.strokeStyle = "#e5dec9";
        c.lineWidth = 4;
        c.strokeRect(100, 100, 880, 880);
        c.lineWidth = 1;
        c.strokeRect(115, 115, 850, 850);

        // Product Name wrapping
        let prodFontSize = 80;
        let prodLineHeight = 90;
        let prodFont = `bold ${prodFontSize}px "Playfair Display", serif`;
        let prodLines = getWrappedLines(c, productName, 760, prodFont);
        if (prodLines.length > 2 || productName.length > 24) {
          prodFontSize = 58;
          prodLineHeight = 68;
          prodFont = `bold ${prodFontSize}px "Playfair Display", serif`;
          prodLines = getWrappedLines(c, productName, 760, prodFont);
        }
        
        // Description wrapping
        let descFontSize = 36;
        let descLineHeight = 48;
        let descFont = `italic ${descFontSize}px "Playfair Display", serif`;
        let descLines = getWrappedLines(c, description, 740, descFont);
        if (descLines.length > 3 || description.length > 100) {
          descFontSize = 28;
          descLineHeight = 38;
          descFont = `italic ${descFontSize}px "Playfair Display", serif`;
          descLines = getWrappedLines(c, description, 740, descFont);
        }
        
        const priceBoxHeight = 120;
        const marginBetween = 30;
        
        // Compute total bistro stack height
        const totalStackHeight = 
          45 + // Headline space
          marginBetween +
          (prodLines.length * prodLineHeight) +
          30 + // Bracket line space
          (descLines.length * descLineHeight) +
          marginBetween +
          priceBoxHeight +
          marginBetween +
          40; // CTA space
          
        let startY = 120 + (840 - totalStackHeight) / 2;
        if (startY < 140) startY = 140;
        
        let currentY = startY + 30;
        
        // Headline
        let headFontSize = 34;
        c.font = `bold italic ${headFontSize}px "Playfair Display", serif`;
        while (c.measureText(headline).width > 760 && headFontSize > 22) {
          headFontSize -= 2;
          c.font = `bold italic ${headFontSize}px "Playfair Display", serif`;
        }
        c.fillStyle = "#e5dec9";
        c.textAlign = "center";
        c.fillText(headline, 540, currentY);
        
        currentY += marginBetween + 15;
        
        // Product Name (antique serif)
        c.fillStyle = "#ffffff";
        c.font = prodFont;
        prodLines.forEach((line) => {
          c.fillText(line, 540, currentY);
          currentY += prodLineHeight;
        });
        
        currentY += 15;
        
        // Chalk line divider
        c.strokeStyle = "#e5dec9";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(540 - 150, currentY);
        c.lineTo(540 + 150, currentY);
        c.stroke();
        
        currentY += 40;
        
        // Description (chalk italic)
        c.fillStyle = "rgba(255, 255, 255, 0.88)";
        c.font = descFont;
        descLines.forEach((line) => {
          c.fillText(line, 540, currentY);
          currentY += descLineHeight;
        });
        
        currentY += marginBetween - 5;
        
        // Price vintage frame box
        c.strokeStyle = "#e5dec9";
        c.lineWidth = 4;
        c.strokeRect(540 - 150, currentY, 300, priceBoxHeight);
        c.lineWidth = 1;
        c.strokeRect(540 - 142, currentY + 4, 284, priceBoxHeight - 8);
        
        // Price Text centered inside chalk box
        let priceFontSize = 60;
        c.font = `bold ${priceFontSize}px "Playfair Display", serif`;
        while (c.measureText(price).width > 260 && priceFontSize > 34) {
          priceFontSize -= 3;
          c.font = `bold ${priceFontSize}px "Playfair Display", serif`;
        }
        c.fillStyle = "#fac710";
        c.fillText(price, 540, currentY + (priceBoxHeight / 2) + (priceFontSize * 0.35));
        
        currentY += priceBoxHeight + marginBetween + 20;
        
        // Bottom CTA chalk text
        let ctaFontSize = 30;
        c.font = `bold ${ctaFontSize}px "Inter", sans-serif`;
        while (c.measureText(cta).width > 760 && ctaFontSize > 18) {
          ctaFontSize -= 2;
          c.font = `bold ${ctaFontSize}px "Inter", sans-serif`;
        }
        c.fillStyle = "#e5dec9";
        c.fillText(cta, 540, currentY);
      }
    };

    // Draw the image photo or solid gradient background
    if (bgType === "image" && preset.photoUrl) {
      if (imageCache.current[preset.photoUrl]) {
        // Draw from cache to prevent canvas flickering during typing
        const cachedImg = imageCache.current[preset.photoUrl];
        ctx.drawImage(cachedImg, 0, 0, 1080, 1080);
        renderLayers(ctx);
      } else {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = preset.photoUrl;
        img.onload = () => {
          imageCache.current[preset.photoUrl] = img;
          ctx.drawImage(img, 0, 0, 1080, 1080);
          renderLayers(ctx);
        };
        img.onerror = () => {
          drawGradientBg(ctx);
          renderLayers(ctx);
        };
      }
    } else {
      drawGradientBg(ctx);
      renderLayers(ctx);
    }
  };

  // --- DOWNLOAD ACTION SCRIPT ---
  const handleDownloadFlyer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Trigger download of lossless image directly
    const link = document.createElement("a");
    const formattedName = productName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.download = `arte_divulgacao_${formattedName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    // Fun celebration
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
  };

  const calendarEvents = [
    { date: "25/05", title: "Dia da Adoção", badge: "Pet-friendly", prompt: "Brigadeiro gourmet pet-friendly para o Dia da Adoção" },
    { date: "12/06", title: "Dia dos Namorados", badge: "Alta conversão", prompt: "Caixa de doces do dia dos namorados — Brigadeiro Gourmet, Trufa de chocolate belga e morangos frescos" },
    { date: "24/06", title: "Festa Junina", badge: "Sazonal", prompt: "Bolo de pote de milho cremoso, paçoca gourmet e canjica frita para a Festa Junina" },
    { date: "10/08", title: "Dia dos Pais", badge: "Combos", prompt: "Combo de mini-tortas salgadas e cerveja artesanal para presentear no Dia dos Pais" }
  ];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#faf6f2] text-[#2c2221] font-sans" id="marketing-page">
      
      {/* Top section with subtabs trigger */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-[#eee7de]/70 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#2e2624] tracking-tight flex items-center gap-2">
            <BrainCircuit className="text-brand shrink-0" size={26} />
            IA & Estúdio de Marketing
          </h1>
          <p className="text-xs text-[#7d6f6b] mt-0.5">
            Crie copys profissionais de alto impacto gastronômico ou projete lindas artes para baixar e compartilhar nas suas redes.
          </p>
        </div>

        {/* Anchor quick navigation keys */}
        <div className="flex flex-wrap bg-white border border-[#eee7de] p-1 rounded-xl self-stretch lg:self-auto shadow-xs gap-1 max-w-full">
          <button
            onClick={() => {
              document.getElementById("text-generator-view")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-bold text-[#7d6f6b] hover:text-[#2e2624] hover:bg-[#faf7f2] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Type size={14} className="shrink-0" />
            <span className="hidden lg:inline">Legendas & Calendários</span>
            <span className="hidden sm:inline lg:hidden">Legendas & Calendário</span>
            <span className="sm:hidden">Legendas</span>
          </button>
          
          <button
            onClick={() => {
              document.getElementById("image-studio-divider")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-bold text-[#7d6f6b] hover:text-[#2e2624] hover:bg-[#faf7f2] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            id="tab-canvas-studio"
          >
            <Palette size={14} className="shrink-0" />
            <span className="hidden lg:inline">Gerador de Artes de Divulgação</span>
            <span className="hidden sm:inline lg:hidden">Artes de Divulgação</span>
            <span className="sm:hidden">Estúdio de Artes</span>
          </button>
        </div>
      </div>

      {/* --- SECTION 1: PERSUASIVE COPY BUILDER & CALENDAR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="text-generator-view">
        
        <div className="lg:col-span-2 space-y-6">

          {geminiConfigured === false && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong>Chave Gemini necessária.</strong> Vá em{" "}
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set("tab", "settings");
                  window.location.href = `${window.location.pathname}?${params.toString()}`;
                }}
                className="text-[#b3543d] font-bold underline cursor-pointer"
              >
                Configurações
              </button>
              {" "}→ cole sua chave em &quot;Chave Gemini&quot; (grátis em aistudio.google.com/apikey) e gere a copy novamente.
            </div>
          )}
          
          {/* Main copy writer pane */}
          <div className="bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#faf7f2] text-[#b3543d] border border-[#e5dec9]/60 rounded-lg">
                  <BrainCircuit size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2e2624]">Gerador Inteligente</h3>
                  <p className="text-[11px] text-[#7d6f6b]">Descreva a ocasião e deixe o Gemini escrever por você</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-lg border shrink-0 ${
                geminiConfigured
                  ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
              }`}>
                {geminiConfigured ? "Gemini Ativo" : "Configure a chave"}
              </span>
            </div>

            <div className="space-y-4">
              <textarea
                id="marketing-context-textarea"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                placeholder="Ex: Bolo de nozes caramelizadas para o fim de semana..."
                className="w-full bg-[#faf7f2] border border-[#e5dec9]/60 px-4 py-3 rounded-2xl text-xs font-semibold text-[#2e2624] placeholder-[#8a7a76] leading-relaxed resize-none focus:outline-none focus:border-[#b3543d]"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType("caption")}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedType === "caption"
                      ? "bg-[#b3543d]/10 text-[#b3543d] border-[#b3543d]/40"
                      : "bg-[#faf7f2] border-[#e5dec9]/60 text-[#7d6f6b] hover:text-[#2e2624] hover:bg-[#f2ebda]"
                  }`}
                >
                  📝 Legenda Social Medias
                </button>

                <button
                  onClick={() => setSelectedType("hashtags")}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedType === "hashtags"
                      ? "bg-[#b3543d]/10 text-[#b3543d] border-[#b3543d]/40"
                      : "bg-[#faf7f2] border-[#e5dec9]/60 text-[#7d6f6b] hover:text-[#2e2624] hover:bg-[#f2ebda]"
                  }`}
                >
                  # Hashtags Finais
                </button>

                <button
                  onClick={() => setSelectedType("seasonal")}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedType === "seasonal"
                      ? "bg-[#b3543d]/10 text-[#b3543d] border-[#b3543d]/40"
                      : "bg-[#faf7f2] border-[#e5dec9]/60 text-[#7d6f6b] hover:text-[#2e2624] hover:bg-[#f2ebda]"
                  }`}
                >
                  📅 Idéias Sazonais
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleGenerateCampaign}
                  disabled={loading}
                  className="py-3.5 bg-gradient-to-r from-[#b3543d] to-[#d48c6f] text-white text-xs font-bold rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Gerar Copywriter</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleGenerateFlyerTextWithAI}
                  disabled={loading}
                  className="py-3.5 bg-[#4a2d21] text-white text-xs font-bold rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer border border-[#c8947b]/20"
                  title="Cria o texto promocional estruturado e carrega diretamente no Canvas para baixar a imagem."
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} className="text-[#c8947b]" />
                  )}
                  <span>🎨 Criar Arte Divulgação</span>
                </button>
              </div>
            </div>
          </div>

          {/* Response Area */}
          {(response || loading) && (
            <div className="bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm space-y-4" id="ai-response-panel">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#eee7de]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#b3543d] flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Sugestão de Copy Criativa</span>
                </h4>
                {response && (
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-[#b3543d] bg-[#faf7f2] border border-[#e5dec9]/60 rounded-lg hover:bg-[#f2ebda] cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={12} className="text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copiar texto</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-8 text-center space-y-3">
                  <div className="inline-block w-8 h-8 rounded-full border-2 border-[#b3543d] border-t-transparent animate-spin" />
                  <p className="text-xs text-[#7d6f6b]">Preparando copys com alto poder de conversão culinária...</p>
                </div>
              ) : (
                <div className="text-sm text-[#2e2624] leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto pr-1">
                  {response}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Area: Commercial Calendar */}
        <div className="bg-white border border-[#eee7de] p-6 rounded-2xl flex flex-col justify-between shadow-sm" id="calendar-pane">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#b3543d]" />
              <h3 className="font-bold text-[#2e2624] text-sm">Calendário Gastronômico</h3>
            </div>
            <p className="text-xs text-[#7d6f6b]">Programe-se com rapidez aplicando ideias nas datas estacionais nacionais de doceria.</p>

            <div className="space-y-2.5 pt-1">
              {calendarEvents.map((ev, idx) => {
                const isSelected = context === ev.prompt;
                return (
                  <div
                    key={idx}
                    onClick={() => setContext(ev.prompt)}
                    className={`p-3 border rounded-xl flex items-center gap-2.5 transition cursor-pointer select-none ${
                      isSelected 
                        ? "bg-[#b3543d]/10 border-[#b3543d]/40 text-[#b3543d]"
                        : "bg-[#faf7f2] border-[#e5dec9]/40 hover:border-[#b3543d]/20 hover:bg-[#faf7f2]/80"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-white border border-[#eee7de] flex flex-col justify-center items-center text-[#b3543d] shrink-0 font-mono">
                      <span className="text-[10px] font-bold leading-none">{ev.date.split("/")[0]}</span>
                      <span className="text-[8px] opacity-75">{ev.date.split("/")[1]}</span>
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-bold text-xs text-[#2e2624] truncate">{ev.title}</h4>
                      <span className="text-[8px] px-1.5 py-0.5 mt-0.5 bg-white text-[#7d6f6b] rounded-md border border-[#eee7de] inline-block font-mono">
                        {ev.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[9px] text-[#7d6f6b] mt-5 border-t border-[#eee7de] pt-2">
            * Toque para carregar no gerador de marketing instantaneamente.
          </p>
        </div>
      </div>

      {/* --- SECTION DIVIDER --- */}
      <div className="my-8 border-t border-[#eee7de]/70 pt-8" id="image-studio-divider">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h2 className="text-xl font-black text-[#2e2624] tracking-tight flex items-center gap-2 font-display">
              <Palette className="text-brand shrink-0" size={22} />
              Gerador de Artes de Divulgação
            </h2>
            <p className="text-xs text-[#7d6f6b] mt-0.5">
              Personalize paletas, selecione estilos de arte, importe receitas e baixe imagens em alta resolução em segundos.
            </p>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: ESTÚDIO DE ARTE & CANVAS DESIGNER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="image-studio-view">
        
        {/* Left Area: Visual customizer parameters */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-[#eee7de] p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7d6f6b] flex items-center gap-1">
              <Palette size={14} className="text-brand" />
              <span>Escolher Estilo & Fundo</span>
            </h3>

            {/* Theme Preset Pill selection */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-[#7d6f6b]">Estampa Cromática (Paleta)</label>
              <div className="grid grid-cols-2 gap-2">
                {DESIGN_PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedPreset(p.id)}
                    className={`p-2 py-2.5 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                      selectedPreset === p.id 
                        ? "border-brand bg-brand/5 font-extrabold" 
                        : "border-[#eee7de] hover:bg-[#faf7f2]"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/15 shadow-2xs shrink-0" style={{ backgroundColor: p.themeColor }} />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Art Styles */}
            <div className="space-y-1.5 text-left pt-2">
              <label className="text-[10px] font-black uppercase text-[#7d6f6b]">Modelo Visual da Peça</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "gourmet", name: "Moderno" },
                  { id: "promo", name: "Promoção" },
                  { id: "minimal", name: "Clean" },
                  { id: "neon", name: "Estúdio Neon" },
                  { id: "bistro", name: "Chalkboard" }
                ].map(style => (
                  <button
                    type="button"
                    key={style.id}
                    onClick={() => setArtStyle(style.id as any)}
                    className={`p-1 px-2.5 py-2 text-center rounded-lg text-[10px] font-bold border transition cursor-pointer truncate ${
                      artStyle === style.id 
                        ? "border-brand bg-brand/5 text-brand" 
                        : "border-[#eee7de] text-[#7d6f6b] hover:bg-[#faf7f2]/80"
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Background style: solid vs image */}
            <div className="space-y-1.5 text-left pt-2">
              <label className="text-[10px] font-black uppercase text-[#7d6f6b]">Textura de Fundo</label>
              <div className="flex bg-[#faf7f2] border border-[#eee7de]/70 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setBgType("gradient")}
                  className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                    bgType === "gradient" ? "bg-white text-brand shadow-2xs" : "text-[#7d6f6b]"
                  }`}
                >
                  🎨 Gradiente Premium
                </button>
                <button
                  type="button"
                  onClick={() => setBgType("image")}
                  className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                    bgType === "image" ? "bg-white text-brand shadow-2xs" : "text-[#7d6f6b]"
                  }`}
                >
                  📸 Foto Profissional
                </button>
              </div>
            </div>
          </div>

          {/* Text parameters inputs */}
          <div className="bg-white border border-[#eee7de] p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7d6f6b] flex items-center gap-1">
                <Type size={14} className="text-brand" />
                <span>Personalizar Textos</span>
              </h3>

              {/* Database Import Selector */}
              <select 
                onChange={handleImportProduct} 
                className="bg-[#faf7f2] border border-[#e5dec9]/70 text-[10px] font-bold text-[#2e2624] py-1 px-2 rounded-lg focus:outline-none"
                id="import-data-selector"
              >
                <option value="">📥 Importar Produto/Receita</option>
                {!loadingDb && recipes.length > 0 && <optgroup label="Minhas Receitas">
                  {recipes.map(r => (
                    <option key={`rec_${r.id}`} value={`rec_${r.id}`}>{r.name} ({r.final_price ? `R$ ${r.final_price.toFixed(2)}` : "Cost-only"})</option>
                  ))}
                </optgroup>}
                {!loadingDb && products.length > 0 && <optgroup label="Ingredientes em Estoque">
                  {products.map(p => (
                    <option key={`prod_${p.id}`} value={`prod_${p.id}`}>{p.name}</option>
                  ))}
                </optgroup>}
              </select>
            </div>

            <div className="space-y-3 font-medium text-[11px] text-[#2e2624]">
              <div>
                <label className="text-[#7d6f6b] font-bold">Título Gancho (Headline)</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={32}
                  className="w-full mt-1 bg-[#faf7f2] border border-[#eee7de] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-[#7d6f6b] font-bold">Nome do Produto</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  maxLength={36}
                  className="w-full mt-1 bg-[#faf7f2] border border-[#eee7de] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-[#7d6f6b] font-bold">Slogan/Breve Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  maxLength={140}
                  className="w-full mt-1 bg-[#faf7f2] border border-[#eee7de] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand resize-none"
                />
                <p className="text-[9px] text-[#7d6f6b]/80 mt-0.5">Dica: Até 2 linhas curtas para acomodar melhor na arte final.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#7d6f6b] font-bold">Preço em Destaque</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    maxLength={15}
                    className="w-full mt-1 bg-[#faf7f2] border border-[#eee7de] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-[#7d6f6b] font-bold">Chamada de Ação (CTA)</label>
                  <input
                    type="text"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    maxLength={32}
                    className="w-full mt-1 bg-[#faf7f2] border border-[#eee7de] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick hint guidance */}
          <div className="p-3 bg-brand/5 border border-brand/10 rounded-xl text-[10px] text-[#7d6f6b] flex gap-2 leading-snug">
            <HelpCircle size={15} className="text-brand shrink-0 mt-0.5" />
            <span>A imagem é gerada em tempo real com **1080x1080px** de altíssima definição (padrão oficial Instagram). Perfeita para divulgar no status, grupo de clientes ou feed!</span>
          </div>

        </div>

        {/* Right Area: Dynamic preview and downloads */}
        <div className="lg:col-span-7 flex flex-col items-center justify-start py-2 space-y-4">
          
          {/* Live Interactive Canvas */}
          <div className="relative group p-3 bg-white border border-[#eee7de] rounded-3xl shadow-xl flex items-center justify-center">
            <canvas
              id="post-preview-canvas"
              ref={canvasRef}
              width={1080}
              height={1080}
              className="w-full max-w-[400px] md:max-w-[430px] aspect-square rounded-2xl bg-gradient-to-tr from-[#faf7f2] to-[#eee7de]"
            />
            <span className="absolute top-6 left-6 px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-[#2e2624] bg-[#fac710] rounded-md shadow-xs select-none">
              Estúdio Live Preview
            </span>
          </div>

          {/* Actions triggers */}
          <div className="w-full max-w-[430px] grid grid-cols-1 gap-2">
            <button
              onClick={handleDownloadFlyer}
              className="w-full py-4.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition hover:scale-[1.01] shadow shadow-[#b3543d]/15 cursor-pointer"
              id="btn-download-flyer-art"
            >
              <Download size={15} className="stroke-[2.5]" />
              <span>Baixar Arte Pronta (PNG HD)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                document.getElementById("text-generator-view")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-2.5 text-[11px] font-bold text-[#7d6f6b] hover:text-[#2e2624] transition cursor-pointer"
            >
              ↑ Voltar para Legendas & Calendários
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
