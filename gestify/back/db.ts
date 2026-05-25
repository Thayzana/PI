import path from "path";
import fs from "fs";

const JSON_FILE = path.join(process.cwd(), "back", "doce_lucro_db.json");

// Define state structure
interface DBData {
  products: any[];
  recipes: any[];
  recipe_ingredients: any[];
  invisible_costs: any[];
  sales_history: any[];
  promotions: any[];
  suppliers: any[];
  orders?: any[];
}

let store: DBData = {
  products: [],
  recipes: [],
  recipe_ingredients: [],
  invisible_costs: [],
  sales_history: [],
  promotions: [],
  suppliers: [],
  orders: []
};

// Auto-increment IDs mapping
let ids: Record<string, number> = {
  products: 1,
  recipes: 1,
  recipe_ingredients: 1,
  sales_history: 1,
  promotions: 1,
  suppliers: 1,
  orders: 1
};

// Mock standard Database object for compatibility if required
export const db = {
  close: () => console.log("Database mock closed")
};

function loadData() {
  try {
    if (fs.existsSync(JSON_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(JSON_FILE, "utf-8"));
      store = parsed.store || store;
      ids = parsed.ids || ids;
      
      // Safe defaults for newly added orders field
      if (!store.orders) store.orders = [];
      if (!ids.orders) ids.orders = 1;
    }
  } catch (error) {
    console.error("Erro ao carregar dados do arquivo JSON:", error);
  }
}

function saveData() {
  try {
    fs.writeFileSync(JSON_FILE, JSON.stringify({ store, ids }, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao salvar dados no arquivo JSON:", error);
  }
}

// Helper function to run a query with promises
export function dbRun(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
  return new Promise((resolve, reject) => {
    try {
      loadData();
      const normalizedSql = sql.replace(/\s+/g, " ").trim().toUpperCase();
      let lastID: number | undefined = undefined;
      let changes = 0;

      // 1. DELETE FROM products
      if (normalizedSql.startsWith("DELETE FROM PRODUCTS")) {
        const idVal = Number(params[0]);
        const originalLength = store.products.length;
        store.products = store.products.filter(p => p.id !== idVal);
        changes = originalLength - store.products.length;
      }

      // DELETE FROM orders
      else if (normalizedSql.startsWith("DELETE FROM ORDERS")) {
        const idVal = Number(params[0]);
        const originalLength = (store.orders || []).length;
        store.orders = (store.orders || []).filter(o => o.id !== idVal);
        changes = originalLength - store.orders.length;
      }

      // INSERT INTO orders
      else if (normalizedSql.startsWith("INSERT INTO ORDERS")) {
        if (!store.orders) store.orders = [];
        const idVal = ids.orders++;
        const customer_name = params[0];
        const customer_phone = params[1];
        const type = params[2];
        const status = params[3] || "Em preparo";
        const items = typeof params[4] === "string" ? JSON.parse(params[4]) : (params[4] || []);
        const total_value = Number(params[5]);
        const delivery_fee = Number(params[6] || 0);
        const cep = params[7] || "";
        const rua = params[8] || "";
        const bairro = params[9] || "";
        const cidade = params[10] || "";
        const estado = params[11] || "";
        const numero = params[12] || "";
        const complemento = params[13] || "";
        const estimated_time = params[14] || "";
        const driver_name = params[15] || "";
        const driver_type = params[16] || "Próprio";
        const driver_phone = params[17] || "";
        const transport_obs = params[18] || "";
        const created_at = params[19] || new Date().toISOString();

        store.orders.push({
          id: idVal,
          customer_name,
          customer_phone,
          type,
          status,
          items,
          total_value,
          delivery_fee,
          cep,
          rua,
          bairro,
          cidade,
          estado,
          numero,
          complemento,
          estimated_time,
          driver_name,
          driver_type,
          driver_phone,
          transport_obs,
          created_at
        });
        lastID = idVal;
        changes = 1;
      }

      // UPDATE orders
      else if (normalizedSql.startsWith("UPDATE ORDERS")) {
        if (normalizedSql.includes("SET STATUS = ? WHERE ID = ?") || normalizedSql.includes("SET STATUS=? WHERE ID=?")) {
          const status = params[0];
          const idVal = Number(params[1]);
          const idx = (store.orders || []).findIndex(o => o.id === idVal);
          if (idx !== -1) {
            store.orders[idx].status = status;
            changes = 1;
          }
        } else {
          // Full update
          const customer_name = params[0];
          const customer_phone = params[1];
          const type = params[2];
          const status = params[3];
          const items = typeof params[4] === "string" ? JSON.parse(params[4]) : (params[4] || []);
          const total_value = Number(params[5]);
          const delivery_fee = Number(params[6]);
          const cep = params[7];
          const rua = params[8];
          const bairro = params[9];
          const cidade = params[10];
          const estado = params[11];
          const numero = params[12];
          const complemento = params[13];
          const estimated_time = params[14];
          const driver_name = params[15];
          const driver_type = params[16];
          const driver_phone = params[17];
          const transport_obs = params[18];
          const idVal = Number(params[19]);

          const idx = (store.orders || []).findIndex(o => o.id === idVal);
          if (idx !== -1) {
            store.orders[idx] = {
              ...store.orders[idx],
              customer_name,
              customer_phone,
              type,
              status,
              items,
              total_value,
              delivery_fee,
              cep,
              rua,
              bairro,
              cidade,
              estado,
              numero,
              complemento,
              estimated_time,
              driver_name,
              driver_type,
              driver_phone,
              transport_obs
            };
            changes = 1;
          }
        }
      }

      // DELETE FROM suppliers
      else if (normalizedSql.startsWith("DELETE FROM SUPPLIERS")) {
        const idVal = Number(params[0]);
        const originalLength = (store.suppliers || []).length;
        store.suppliers = (store.suppliers || []).filter(s => s.id !== idVal);
        changes = originalLength - store.suppliers.length;
      }

      // INSERT INTO suppliers
      else if (normalizedSql.startsWith("INSERT INTO SUPPLIERS")) {
        if (!store.suppliers) store.suppliers = [];
        const idVal = ids.suppliers++;
        const name = params[0];
        const contact = params[1];
        const category = params[2];
        const active = Number(params[3] !== undefined ? params[3] : 1);
        const items = typeof params[4] === "string" ? JSON.parse(params[4]) : (params[4] || []);

        store.suppliers.push({ id: idVal, name, contact, category, active, items });
        lastID = idVal;
        changes = 1;
      }

      // UPDATE suppliers
      else if (normalizedSql.startsWith("UPDATE SUPPLIERS")) {
        const name = params[0];
        const contact = params[1];
        const category = params[2];
        const active = Number(params[3] !== undefined ? params[3] : 1);
        const items = typeof params[4] === "string" ? JSON.parse(params[4]) : (params[4] || []);
        const idVal = Number(params[5]);

        const idx = (store.suppliers || []).findIndex(s => s.id === idVal);
        if (idx !== -1) {
          store.suppliers[idx] = {
            ...store.suppliers[idx],
            name,
            contact,
            category,
            active,
            items
          };
          changes = 1;
        }
      }

      // 2. DELETE FROM recipe_ingredients
      else if (normalizedSql.startsWith("DELETE FROM RECIPE_INGREDIENTS")) {
        const recipeIdVal = Number(params[0]);
        const originalLength = store.recipe_ingredients.length;
        store.recipe_ingredients = store.recipe_ingredients.filter(ing => ing.recipe_id !== recipeIdVal);
        changes = originalLength - store.recipe_ingredients.length;
      }

      // 3. DELETE FROM recipes
      else if (normalizedSql.startsWith("DELETE FROM RECIPES")) {
        const idVal = Number(params[0]);
        const originalLength = store.recipes.length;
        store.recipes = store.recipes.filter(r => r.id !== idVal);
        changes = originalLength - store.recipes.length;
      }

      // 4. INSERT INTO products
      else if (normalizedSql.startsWith("INSERT INTO PRODUCTS")) {
        const idVal = ids.products++;
        const sku = params[0];
        const name = params[1];
        const stock = Number(params[2]);
        const minimum = Number(params[3]);
        const expiration = params[4];
        const status = params[5] || "OK";
        
        // Extended menu parameters (optional for classic inventory inserts)
        const price = params[6] !== undefined ? Number(params[6]) : undefined;
        const description = params[7] || undefined;
        const image_url = params[8] || undefined;
        const category = params[9] || undefined;
        const is_promo = params[10] === 1 || params[10] === true;
        const promo_price = params[11] !== undefined ? Number(params[11]) : undefined;
        const barcode = params[12] || undefined;
        const unit_type = params[13] || "Unidade";
        const wholesale_price = params[14] !== undefined ? Number(params[14]) : undefined;

        store.products.push({ 
          id: idVal, 
          sku, 
          name, 
          stock, 
          minimum, 
          expiration, 
          status,
          price,
          description,
          image_url,
          category,
          is_promo,
          promo_price,
          barcode,
          unit_type,
          wholesale_price,
        });
        lastID = idVal;
        changes = 1;
      }

      // 5. INSERT INTO recipes
      else if (normalizedSql.startsWith("INSERT INTO RECIPES")) {
        const idVal = ids.recipes++;
        const name = params[0];
        const yieldVal = Number(params[1]);
        const margin_ratio = Number(params[2]);
        const final_price = Number(params[3]);
        const unit_cost = Number(params[4]);
        const invisible_costs = Number(params[5]);
        const subtotal = Number(params[6]);

        store.recipes.push({
          id: idVal,
          name,
          yield: yieldVal,
          margin_ratio,
          final_price,
          unit_cost,
          invisible_costs,
          subtotal
        });
        lastID = idVal;
        changes = 1;
      }

      // 6. INSERT INTO recipe_ingredients
      else if (normalizedSql.startsWith("INSERT INTO RECIPE_INGREDIENTS")) {
        const idVal = ids.recipe_ingredients++;
        const recipe_id = Number(params[0]);
        const name = params[1];
        const amount = Number(params[2]);
        const unit = params[3];
        const price = Number(params[4]);

        store.recipe_ingredients.push({
          id: idVal,
          recipe_id,
          name,
          amount,
          unit,
          price
        });
        lastID = idVal;
        changes = 1;
      }

      // 7. INSERT INTO promotions
      else if (normalizedSql.startsWith("INSERT INTO PROMOTIONS")) {
        const idVal = ids.promotions++;
        const title = params[0];
        const subtitle = params[1];
        const type = params[2];
        const discount = params[3];
        const recovery = Number(params[4] || 0);
        const status = params[5] || "Normal";
        const active = Number(params[6] !== undefined ? params[6] : 0);

        store.promotions.push({
          id: idVal,
          title,
          subtitle,
          type,
          discount,
          recovery,
          status,
          active
        });
        lastID = idVal;
        changes = 1;
      }

      // 8. UPDATE products
      else if (normalizedSql.startsWith("UPDATE PRODUCTS")) {
        const sku = params[0];
        const name = params[1];
        const stock = Number(params[2]);
        const minimum = Number(params[3]);
        const expiration = params[4];
        const status = params[5];
        const idVal = Number(params[6]);

        // Extended menu parameters (optional)
        const price = params[7] !== undefined ? Number(params[7]) : undefined;
        const description = params[8] || undefined;
        const image_url = params[9] || undefined;
        const category = params[10] || undefined;
        const is_promo = params[11] === 1 || params[11] === true;
        const promo_price = params[12] !== undefined ? Number(params[12]) : undefined;
        const barcode = params[13] || undefined;
        const unit_type = params[14] || "Unidade";
        const wholesale_price = params[15] !== undefined ? Number(params[15]) : undefined;

        const idx = store.products.findIndex(p => p.id === idVal);
        if (idx !== -1) {
          store.products[idx] = {
            ...store.products[idx],
            sku,
            name,
            stock,
            minimum,
            expiration,
            status,
            price: price !== undefined ? price : store.products[idx].price,
            description: description !== undefined ? description : store.products[idx].description,
            image_url: image_url !== undefined ? image_url : store.products[idx].image_url,
            category: category !== undefined ? category : store.products[idx].category,
            is_promo: is_promo !== undefined ? is_promo : store.products[idx].is_promo,
            promo_price: promo_price !== undefined ? promo_price : store.products[idx].promo_price,
            barcode: barcode !== undefined ? barcode : store.products[idx].barcode,
            unit_type: unit_type !== undefined ? unit_type : store.products[idx].unit_type,
            wholesale_price: wholesale_price !== undefined ? wholesale_price : store.products[idx].wholesale_price,
          };
          changes = 1;
        }
      }

      // 9. UPDATE recipes
      else if (normalizedSql.startsWith("UPDATE RECIPES")) {
        const name = params[0];
        const yieldVal = Number(params[1]);
        const margin_ratio = Number(params[2]);
        const final_price = Number(params[3]);
        const unit_cost = Number(params[4]);
        const invisible_costs = Number(params[5]);
        const subtotal = Number(params[6]);
        const idVal = Number(params[7]);

        const idx = store.recipes.findIndex(r => r.id === idVal);
        if (idx !== -1) {
          store.recipes[idx] = {
            ...store.recipes[idx],
            name,
            yield: yieldVal,
            margin_ratio,
            final_price,
            unit_cost,
            invisible_costs,
            subtotal
          };
          changes = 1;
        }
      }

      // 10. UPDATE promotions SET active = ? WHERE id = ?
      else if (normalizedSql.startsWith("UPDATE PROMOTIONS")) {
        const active = Number(params[0] || 0);
        const idVal = Number(params[1]);

        const idx = store.promotions.findIndex(p => p.id === idVal);
        if (idx !== -1) {
          store.promotions[idx].active = active;
          changes = 1;
        }
      }

      // 11. Upsert invisible costs
      else if (normalizedSql.includes("INVISIBLE_COSTS") || normalizedSql.startsWith("INSERT INTO INVISIBLE_COSTS")) {
        const key = params[0];
        const value = Number(params[1]);

        const idx = store.invisible_costs.findIndex(c => c.key === key);
        if (idx !== -1) {
          store.invisible_costs[idx].value = value;
        } else {
          store.invisible_costs.push({ key, value });
        }
        changes = 1;
      }

      // 12. INSERT INTO sales_history
      else if (normalizedSql.startsWith("INSERT INTO SALES_HISTORY")) {
        const idVal = ids.sales_history++;
        const day = params[0];
        const revenue = Number(params[1]);
        const profit = Number(params[2]);

        store.sales_history.push({ id: idVal, day, revenue, profit });
        lastID = idVal;
        changes = 1;
      }

      saveData();
      resolve({ lastID, changes });
    } catch (err) {
      reject(err);
    }
  });
}

// Helper to get all rows
export function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    try {
      loadData();
      const normalizedSql = sql.replace(/\s+/g, " ").trim().toUpperCase();

      // products
      if (normalizedSql.includes("FROM PRODUCTS")) {
        let list = [...store.products];
        if (normalizedSql.includes("ORDER BY ID DESC")) {
          list.sort((a, b) => b.id - a.id);
        }
        return resolve(list as T[]);
      }

      // sales_history
      if (normalizedSql.includes("FROM SALES_HISTORY")) {
        return resolve([...store.sales_history] as T[]);
      }

      // promotions
      if (normalizedSql.includes("FROM PROMOTIONS")) {
        return resolve([...store.promotions] as T[]);
      }

      // invisible_costs
      if (normalizedSql.includes("FROM INVISIBLE_COSTS")) {
        return resolve([...store.invisible_costs] as T[]);
      }

      // recipes
      if (normalizedSql.includes("FROM RECIPES")) {
        let list = [...store.recipes];
        if (normalizedSql.includes("ORDER BY ID DESC")) {
          list.sort((a, b) => b.id - a.id);
        }
        return resolve(list as T[]);
      }

      // recipe_ingredients
      if (normalizedSql.includes("FROM RECIPE_INGREDIENTS")) {
        if (normalizedSql.includes("WHERE RECIPE_ID =")) {
          const recipeIdVal = Number(params[0]);
          const filtered = store.recipe_ingredients.filter(ing => ing.recipe_id === recipeIdVal);
          return resolve(filtered as T[]);
        }
        return resolve([...store.recipe_ingredients] as T[]);
      }

      // suppliers
      if (normalizedSql.includes("FROM SUPPLIERS")) {
        let list = [...(store.suppliers || [])];
        if (normalizedSql.includes("ORDER BY ID DESC")) {
          list.sort((a, b) => b.id - a.id);
        }
        return resolve(list as T[]);
      }

      // orders
      if (normalizedSql.includes("FROM ORDERS")) {
        let list = [...(store.orders || [])];
        if (normalizedSql.includes("ORDER BY ID DESC")) {
          list.sort((a, b) => b.id - a.id);
        }
        return resolve(list as T[]);
      }

      resolve([]);
    } catch (err) {
      reject(err);
    }
  });
}

// Helper to get single row
export function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    try {
      loadData();
      const normalizedSql = sql.replace(/\s+/g, " ").trim().toUpperCase();

      if (normalizedSql.includes("FROM PRODUCTS WHERE ID =")) {
        const idVal = Number(params[0]);
        const matched = store.products.find(p => p.id === idVal);
        return resolve(matched as T | undefined);
      }

      if (normalizedSql.includes("FROM ORDERS WHERE ID =")) {
        const idVal = Number(params[0]);
        const matched = (store.orders || []).find(o => o.id === idVal);
        return resolve(matched as T | undefined);
      }

      if (normalizedSql.includes("FROM RECIPES WHERE ID =")) {
        const idVal = Number(params[0]);
        const matched = store.recipes.find(r => r.id === idVal);
        return resolve(matched as T | undefined);
      }

      if (normalizedSql.includes("FROM PROMOTIONS WHERE ID =")) {
        const idVal = Number(params[0]);
        const matched = store.promotions.find(p => p.id === idVal);
        return resolve(matched as T | undefined);
      }

      if (normalizedSql.includes("FROM SUPPLIERS WHERE ID =")) {
        const idVal = Number(params[0]);
        const matched = (store.suppliers || []).find(s => s.id === idVal);
        return resolve(matched as T | undefined);
      }

      resolve(undefined);
    } catch (err) {
      reject(err);
    }
  });
}

// Initialize database tables
export async function initializeDatabase() {
  console.log("Inicializando tabelas em memória simulando SQL estruturado...");
  loadData();

  // Populate Default Invisible Costs
  if (store.invisible_costs.length === 0) {
    store.invisible_costs = [
      { key: "packaging", value: 0.35 },
      { key: "delivery", value: 0.8 },
      { key: "energy", value: 0.25 },
      { key: "gas", value: 0.18 },
      { key: "labor", value: 1.2 },
      { key: "ifood_ratio", value: 12.0 }
    ];
  }

  // Populate Default Products
  if (store.products.length === 0) {
    const defaultProducts = [
      { 
        sku: "BRG-001", 
        name: "Brigadeiro Gourmet", 
        stock: 48, 
        minimum: 30, 
        expiration: "2026-05-27", 
        status: "OK" as const,
        price: 5.60, 
        description: "Delicioso brigadeiro tradicional feito com cacau belga 50% e granulado split premium.", 
        image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80",
        category: "Docinhos", 
        is_promo: false, 
        promo_price: 4.50 
      },
      { 
        sku: "BLP-002", 
        name: "Bolo de Pote Ninho", 
        stock: 12, 
        minimum: 15, 
        expiration: "2026-05-23", 
        status: "Baixo" as const,
        price: 12.00, 
        description: "Camadas alternadas de bolo de baunilha fofinho, recheio cremoso de Leite Ninho e calda de chocolate.", 
        image_url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&q=80",
        category: "Bolos", 
        is_promo: false, 
        promo_price: 10.00 
      },
      { 
        sku: "TRF-003", 
        name: "Trufa Belga 70%", 
        stock: 6, 
        minimum: 20, 
        expiration: "2026-05-21", 
        status: "Vencendo" as const,
        price: 7.50, 
        description: "Trufa artesanal cremosa por dentro com casquinha crocante de chocolate amargo 70%.", 
        image_url: "https://images.unsplash.com/photo-1548907040-4d42b52145ca?w=500&q=80",
        category: "Docinhos", 
        is_promo: true, 
        promo_price: 5.90 
      },
      { 
        sku: "CHK-004", 
        name: "Cheesecake Frutas Vermelhas", 
        stock: 22, 
        minimum: 10, 
        expiration: "2026-06-01", 
        status: "OK" as const,
        price: 85.00, 
        description: "Cheesecake assada clássica sobre base de biscoitos amanteigados, finalizada com calda espessa artesanal de frutas vermelhas.", 
        image_url: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=500&q=80",
        category: "Tortas", 
        is_promo: false, 
        promo_price: 75.00 
      },
      { 
        sku: "MCR-005", 
        name: "Macaron Pistache", 
        stock: 4, 
        minimum: 12, 
        expiration: "2026-05-25", 
        status: "Baixo" as const,
        price: 9.00, 
        description: "Clássico macaron de farinha de amêndoas recheado com ganache cremosa de pistache iraniano.", 
        image_url: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&q=80",
        category: "Docinhos", 
        is_promo: false, 
        promo_price: 8.00 
      },
      { 
        sku: "CPC-006", 
        name: "Cupcake Limão Siciliano", 
        stock: 4, 
        minimum: 10, 
        expiration: "2026-05-30", 
        status: "OK" as const,
        price: 8.50, 
        description: "Muffin cítrico aromatizado com raspas de limão siciliano, recheio de lemon curd e cobertura de merengue suíço dourado.", 
        image_url: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500&q=80",
        category: "Bolos", 
        is_promo: false, 
        promo_price: 7.00 
      },
      { 
        sku: "BVR-007", 
        name: "Bolo Red Velvet (fatia)", 
        stock: 3, 
        minimum: 8, 
        expiration: "2026-05-28", 
        status: "OK" as const,
        price: 15.00, 
        description: "Fatia generosa de bolo aveludado vermelho recheado com creme clássico à base de cream cheese e chocolate branco.", 
        image_url: "https://images.unsplash.com/photo-1616260841585-0457aa334645?w=500&q=80",
        category: "Bolos", 
        is_promo: true, 
        promo_price: 12.50 
      },
      {
        sku: "VRT-101",
        name: "Arroz Tipo 1 — Pacote 5kg",
        stock: 84,
        minimum: 24,
        expiration: "2027-01-15",
        status: "OK" as const,
        price: 28.90,
        description: "Arroz branco polido tipo 1, grãos longos e soltos.",
        image_url: "https://images.unsplash.com/photo-1586201375767-b5f0a00b2e3e?w=500&q=80",
        category: "Mercearia",
        is_promo: false,
        promo_price: 26.50,
        barcode: "7891234567890",
        unit_type: "Pacote",
        wholesale_price: 24.90,
      },
      {
        sku: "VRT-102",
        name: "Detergente Líquido Neutro 5L",
        stock: 18,
        minimum: 20,
        expiration: "2028-06-30",
        status: "Baixo" as const,
        price: 22.50,
        description: "Detergente neutro concentrado para louças e uso geral.",
        image_url: "https://images.unsplash.com/photo-1563453392213-326a0d9c3e0c?w=500&q=80",
        category: "Limpeza",
        is_promo: true,
        promo_price: 19.90,
        barcode: "7899876543210",
        unit_type: "Litro",
        wholesale_price: 17.80,
      },
      {
        sku: "VRT-103",
        name: "Café Torrado e Moído 500g",
        stock: 56,
        minimum: 30,
        expiration: "2026-11-20",
        status: "OK" as const,
        price: 18.90,
        description: "Café 100% arábica torrado e moído, embalagem a vácuo.",
        image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55c?w=500&q=80",
        category: "Mercearia",
        is_promo: false,
        barcode: "7895551234567",
        unit_type: "Unidade",
        wholesale_price: 15.40,
      },
    ];
    for (const p of defaultProducts) {
      store.products.push({
        id: ids.products++,
        ...p
      });
    }
  }

  // Populate Default Recipes
  if (store.recipes.length === 0) {
    store.recipes.push({
      id: 1,
      name: "Brigadeiro Gourmet",
      yield: 40,
      margin_ratio: 80.0,
      final_price: 5.60,
      unit_cost: 0.30,
      invisible_costs: 2.78,
      subtotal: 4.92
    });
    if (ids.recipes <= 1) ids.recipes = 2;

    store.recipe_ingredients = [
      { id: ids.recipe_ingredients++, recipe_id: 1, name: "Leite condensado", amount: 395, unit: "g", price: 12.9 },
      { id: ids.recipe_ingredients++, recipe_id: 1, name: "Chocolate em pó", amount: 200, unit: "g", price: 24.5 },
      { id: ids.recipe_ingredients++, recipe_id: 1, name: "Manteiga", amount: 50, unit: "g", price: 38.0 }
    ];
  }

  // Populate Default Sales History for Dashboard
  if (store.sales_history.length === 0) {
    const historicalData = [
      { day: "Seg", revenue: 1000, profit: 420 },
      { day: "Ter", revenue: 1300, profit: 550 },
      { day: "Qua", revenue: 1100, profit: 460 },
      { day: "Qui", revenue: 2000, profit: 840 },
      { day: "Sex", revenue: 2500, profit: 1060 },
      { day: "Sáb", revenue: 3200, profit: 1340 },
      { day: "Dom", revenue: 1390, profit: 550 }
    ];
    for (const sale of historicalData) {
      store.sales_history.push({
        id: ids.sales_history++,
        ...sale
      });
    }
  }

  // Populate Default Promotions
  if (store.promotions.length === 0) {
    const initialPromo = [
      { title: "Combo Trufa + Café", subtitle: "Trufa Belga 70% vence em 3 dias", type: "Combo", discount: "-25%", recovery: 320.0, status: "Aviso" },
      { title: "Leve 3, pague 2 — Macaron Pistache", subtitle: "Pouca saída há 18 dias", type: "BOGO", discount: "L3P2", recovery: 480.0, status: "Normal" },
      { title: "Brigadeiro Box 12un", subtitle: "Excesso em estoque (+48 un)", type: "Desconto", discount: "-15%", recovery: 680.0, status: "Sucesso" }
    ];
    for (const promo of initialPromo) {
      store.promotions.push({
        id: ids.promotions++,
        active: 0,
        ...promo
      });
    }
  }

  // Populate Default Suppliers
  if (!store.suppliers || store.suppliers.length === 0) {
    const defaultSuppliers = [
      {
        name: "Distribuidor Coca-Cola Aliança",
        contact: "(11) 98765-4321 / pedidos@cocacola-alianca.com.br",
        category: "Bebidas & Refrigerantes",
        active: 1,
        items: ["Coca-Cola Lata 350ml", "Coca-Cola Zero 2L", "Suco Del Valle Uva", "Fanta Laranja 350ml", "Água Mineral Crystal"]
      },
      {
        name: "Laticínios Alvorada",
        contact: "(31) 3456-7890 / comercial@laticinios-alvorada.com.br",
        category: "Laticínios & Derivados",
        active: 1,
        items: ["Manteiga Sem Sal Extra", "Creme de Leite Fresco 35%", "Leite Condensado Itambé", "Queijo Minas Padrão", "Requeijão Cremoso Balde"]
      },
      {
        name: "Embalagens MultiBox",
        contact: "vendas@multiboxembalagens.com.br",
        category: "Embalagens & descartáveis",
        active: 1,
        items: ["Caixa para Brigadeiro 12un", "Sacola Kraft Delivery", "Forminha N° 4 Marrom", "Fita de Cetim Vermelha 10mm"]
      }
    ];
    store.suppliers = [];
    ids.suppliers = 1;
    for (const s of defaultSuppliers) {
      store.suppliers.push({
        id: ids.suppliers++,
        ...s
      });
    }
  }

  // Populate Default Orders for Delivery and Logistics
  if (!store.orders || store.orders.length === 0) {
    store.orders = [
      {
        id: 1,
        customer_name: "Mariana Souza",
        customer_phone: "(11) 99876-5432",
        type: "Delivery",
        status: "Rota de Envio",
        items: [
          { id: 1, name: "Brigadeiro Gourmet", quantity: 12, price: 5.60 },
          { id: 2, name: "Bolo de Pote Ninho", quantity: 2, price: 12.00 }
        ],
        total_value: 101.20,
        delivery_fee: 10.00,
        cep: "01310-100",
        rua: "Avenida Paulista",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        estado: "SP",
        numero: "1000",
        complemento: "Apto 42",
        estimated_time: "35-45 min",
        driver_name: "Carlos Costa",
        driver_type: "Próprio",
        driver_phone: "(11) 98888-1111",
        transport_obs: "Cuidado: Manter Resfriado",
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 mins ago
      },
      {
        id: 2,
        customer_name: "Guilherme Santos",
        customer_phone: "(11) 98765-4321",
        type: "Balcão",
        status: "Pronto para Entrega",
        items: [
          { id: 4, name: "Cheesecake Frutas Vermelhas", quantity: 1, price: 85.00 }
        ],
        total_value: 85.00,
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
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      },
      {
        id: 3,
        customer_name: "Ana Beatriz",
        customer_phone: "(11) 97777-6666",
        type: "Encomenda Sazonal",
        status: "Em preparo",
        items: [
          { id: 7, name: "Bolo Red Velvet (fatia)", quantity: 5, price: 15.00 }
        ],
        total_value: 75.00,
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
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 mins ago
      }
    ];
    ids.orders = 4;
  }

  saveData();
  console.log("Banco de dados JSON inicializado com sucesso, simulando driver SQL.");
}
