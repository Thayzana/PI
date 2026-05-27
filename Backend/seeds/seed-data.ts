/** Dados iniciais para implantação (confeitaria / gestify padrão) */

export const SEED_INVISIBLE_COSTS = [
  { key: "packaging", value: 0.35 },
  { key: "delivery", value: 0.8 },
  { key: "energy", value: 0.25 },
  { key: "gas", value: 0.18 },
  { key: "labor", value: 1.2 },
  { key: "ifood_ratio", value: 12.0 },
];

export const SEED_PRODUCTS = [
  {
    sku: "BRG-001",
    name: "Brigadeiro Gourmet",
    stock: 48,
    minimum: 30,
    expiration: "2026-05-27",
    status: "OK",
    price: 5.6,
    description:
      "Delicioso brigadeiro tradicional feito com cacau belga 50% e granulado split premium.",
    image_url:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80",
    category: "Docinhos",
    is_promo: false,
    promo_price: 4.5,
  },
  {
    sku: "BLP-002",
    name: "Bolo de Pote Ninho",
    stock: 12,
    minimum: 15,
    expiration: "2026-05-23",
    status: "Baixo",
    price: 12.0,
    description:
      "Camadas alternadas de bolo de baunilha fofinho, recheio cremoso de Leite Ninho e calda de chocolate.",
    image_url:
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&q=80",
    category: "Bolos",
    is_promo: false,
    promo_price: 10.0,
  },
  {
    sku: "TRF-003",
    name: "Trufa Belga 70%",
    stock: 6,
    minimum: 20,
    expiration: "2026-05-21",
    status: "Vencendo",
    price: 7.5,
    description:
      "Trufa artesanal cremosa por dentro com casquinha crocante de chocolate amargo 70%.",
    image_url:
      "https://images.unsplash.com/photo-1548907040-4d42b52145ca?w=500&q=80",
    category: "Docinhos",
    is_promo: true,
    promo_price: 5.9,
  },
  {
    sku: "CHK-004",
    name: "Cheesecake Frutas Vermelhas",
    stock: 22,
    minimum: 10,
    expiration: "2026-06-01",
    status: "OK",
    price: 85.0,
    description:
      "Cheesecake assada clássica sobre base de biscoitos amanteigados, finalizada com calda espessa artesanal de frutas vermelhas.",
    image_url:
      "https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=500&q=80",
    category: "Tortas",
    is_promo: false,
    promo_price: 75.0,
  },
  {
    sku: "MCR-005",
    name: "Macaron Pistache",
    stock: 4,
    minimum: 12,
    expiration: "2026-05-25",
    status: "Baixo",
    price: 9.0,
    description:
      "Clássico macaron de farinha de amêndoas recheado com ganache cremosa de pistache iraniano.",
    image_url:
      "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&q=80",
    category: "Docinhos",
    is_promo: false,
    promo_price: 8.0,
  },
  {
    sku: "CPC-006",
    name: "Cupcake Limão Siciliano",
    stock: 4,
    minimum: 10,
    expiration: "2026-05-30",
    status: "OK",
    price: 8.5,
    description:
      "Muffin cítrico aromatizado com raspas de limão siciliano, recheio de lemon curd e cobertura de merengue suíço dourado.",
    image_url:
      "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500&q=80",
    category: "Bolos",
    is_promo: false,
    promo_price: 7.0,
  },
  {
    sku: "BVR-007",
    name: "Bolo Red Velvet (fatia)",
    stock: 3,
    minimum: 8,
    expiration: "2026-05-28",
    status: "OK",
    price: 15.0,
    description:
      "Fatia generosa de bolo aveludado vermelho recheado com creme clássico à base de cream cheese e chocolate branco.",
    image_url:
      "https://images.unsplash.com/photo-1616260841585-0457aa334645?w=500&q=80",
    category: "Bolos",
    is_promo: true,
    promo_price: 12.5,
  },
];

export const SEED_RECIPE = {
  name: "Brigadeiro Gourmet",
  yield: 40,
  margin_ratio: 80.0,
  final_price: 5.6,
  unit_cost: 0.3,
  invisible_costs: 2.78,
  subtotal: 4.92,
  ingredients: [
    { name: "Leite condensado", amount: 395, unit: "g", price: 12.9 },
    { name: "Chocolate em pó", amount: 200, unit: "g", price: 24.5 },
    { name: "Manteiga", amount: 50, unit: "g", price: 38.0 },
  ],
};

export const SEED_SALES_HISTORY = [
  { day: "Seg", revenue: 1000, profit: 420 },
  { day: "Ter", revenue: 1300, profit: 550 },
  { day: "Qua", revenue: 1100, profit: 460 },
  { day: "Qui", revenue: 2000, profit: 840 },
  { day: "Sex", revenue: 2500, profit: 1060 },
  { day: "Sáb", revenue: 3200, profit: 1340 },
  { day: "Dom", revenue: 1390, profit: 550 },
];

export const SEED_PROMOTIONS = [
  {
    title: "Combo Trufa + Café",
    subtitle: "Trufa Belga 70% vence em 3 dias",
    type: "Combo",
    discount: "-25%",
    recovery: 320.0,
    status: "Aviso",
    active: 0,
  },
  {
    title: "Leve 3, pague 2 — Macaron Pistache",
    subtitle: "Pouca saída há 18 dias",
    type: "BOGO",
    discount: "L3P2",
    recovery: 480.0,
    status: "Normal",
    active: 0,
  },
  {
    title: "Brigadeiro Box 12un",
    subtitle: "Excesso em estoque (+48 un)",
    type: "Desconto",
    discount: "-15%",
    recovery: 680.0,
    status: "Sucesso",
    active: 0,
  },
];

export const SEED_SUPPLIERS = [
  {
    name: "Distribuidor Coca-Cola PMW",
    contact: "(63) 98765-4321 / pedidos@cocacola-pmw.com.br",
    category: "Bebidas & Refrigerantes",
    active: 1,
    items: [
      "Coca-Cola Lata 350ml",
      "Coca-Cola Zero 2L",
      "Suco Del Valle Uva",
      "Fanta Laranja 350ml",
      "Água Mineral Crystal",
    ],
  },
  {
    name: "Laticínios PMW",
    contact: "(63) 3456-7890 / comercial@laticinios-pmw.com.br",
    category: "Laticínios & Derivados",
    active: 1,
    items: [
      "Manteiga Sem Sal Extra",
      "Creme de Leite Fresco 35%",
      "Leite Condensado Itambé",
      "Queijo Minas Padrão",
      "Requeijão Cremoso Balde",
    ],
  },
  {
    name: "Embalagens MultiBox",
    contact: "vendas@multiboxembalagens.com.br",
    category: "Embalagens & descartáveis",
    active: 1,
    items: [
      "Caixa para Brigadeiro 12un",
      "Sacola Kraft Delivery",
      "Forminha N° 4 Marrom",
      "Fita de Cetim Vermelha 10mm",
    ],
  },
];

export function buildSeedOrders() {
  const now = Date.now();
  return [
    {
      customer_name: "Mariana Souza",
      customer_phone: "(63) 99276-5432",
      type: "Delivery",
      status: "Rota de Envio",
      items: [
        { id: 1, name: "Brigadeiro Gourmet", quantity: 12, price: 5.6 },
        { id: 2, name: "Bolo de Pote Ninho", quantity: 2, price: 12.0 },
      ],
      total_value: 101.2,
      delivery_fee: 10.0,
      cep: "77001-310",
      rua: "NS 15",
      bairro: "Plano Diretor Sul",
      cidade: "Palmas",
      estado: "TO",
      numero: "1000",
      complemento: "Apto 42",
      estimated_time: "Imediato",
      driver_name: "Carlos Costa",
      driver_type: "Próprio",
      driver_phone: "(63) 99276-5432",
      transport_obs: "Cuidado: Manter Resfriado",
      created_at: new Date(now - 30 * 60 * 1000),
    },
    {
      customer_name: "Guilherme Santos",
      customer_phone: "(63) 99276-5432",
      type: "Balcão",
      status: "Pronto para Entrega",
      items: [{ id: 4, name: "Cheesecake Frutas Vermelhas", quantity: 1, price: 85.0 }],
      total_value: 85.0,
      delivery_fee: 0,
      cep: "",
      rua: "",
      bairro: "",
      cidade: "",
      estado: "",
      numero: "",
      complemento: "",
      estimated_time: "Imediato",
      driver_name: "",
      driver_type: "Próprio",
      driver_phone: "",
      transport_obs: "Retirada agendada para 18h. Bolo de travessa de vidro.",
      created_at: new Date(now - 60 * 60 * 1000),
    },
    {
      customer_name: "Ana Beatriz",
      customer_phone: "(63) 99276-5832",
      type: "Encomenda Sazonal",
      status: "Em preparo",
      items: [{ id: 7, name: "Bolo Red Velvet (fatia)", quantity: 5, price: 15.0 }],
      total_value: 75.0,
      delivery_fee: 0,
      cep: "",
      rua: "",
      bairro: "",
      cidade: "",
      estado: "",
      numero: "",
      complemento: "",
      estimated_time: "Sob Consulta",
      driver_name: "",
      driver_type: "Terceirizado",
      driver_phone: "",
      transport_obs: "Cuidado: Bolo Festivo de Andar",
      created_at: new Date(now - 15 * 60 * 1000),
    },
  ];
}
