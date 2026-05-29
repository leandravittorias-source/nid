var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DB_FILE = import_path.default.join(process.cwd(), "nosdois_db.json");
var DEFAULT_USERS = {
  Leandro: {
    id: "Leandro",
    name: "Leandro",
    partner_nickname: "Moz\xE3o",
    color: "#3B82F6",
    // Blue
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    points_weekly: 40
  },
  Kaisa: {
    id: "Kaisa",
    name: "Kaisa",
    partner_nickname: "Meu Amor",
    color: "#EC4899",
    // Pink
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    points_weekly: 55
  }
};
var DEFAULT_COUPLE = {
  id: "couple_1",
  invite_code: "AMOR42",
  connected: true,
  home_level: 4,
  total_points: 380,
  unlocked_achievements: ["7-days-no-dishes", "first-trip-album"]
};
var DEFAULT_TASKS = [
  {
    id: "task_1",
    title: "Lavar a lou\xE7a do jantar",
    description: "Lavar pratos, panelas e limpar a pia para manter a cozinha cheirosa.",
    responsible_id: "Leandro",
    category: "Cozinha" /* COZINHA */,
    priority: "Normal" /* NORMAL */,
    due_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    recurrence: "Di\xE1ria",
    time_estimate: 20,
    points: 10,
    completed: false,
    archived: false,
    comments: [
      { id: "c1", author_id: "Kaisa", text: "Amor, n\xE3o se esquece de colocar o escorredor no lugar \u{1F49C}", timestamp: new Date(Date.now() - 36e5).toISOString() },
      { id: "c2", author_id: "Leandro", text: "Pode deixar, vou fazer isso j\xE1 j\xE1!", timestamp: new Date(Date.now() - 18e5).toISOString() }
    ]
  },
  {
    id: "task_2",
    title: "Dar banho no Luke (Pet)",
    description: "Dar banho, secar bem com toalha e aplicar o spray de cheiro agrad\xE1vel.",
    responsible_id: "Kaisa",
    category: "Pet" /* PET */,
    priority: "Urgente" /* URGENTE */,
    due_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    recurrence: "Semanal",
    time_estimate: 45,
    points: 25,
    completed: true,
    completed_at: new Date(Date.now() - 864e5).toISOString(),
    archived: false,
    comments: [
      { id: "c3", author_id: "Kaisa", text: "Ficou muito cheiroso!", timestamp: new Date(Date.now() - 8e7).toISOString() }
    ]
  },
  {
    id: "task_3",
    title: "Passar pano na sala e quarto",
    description: "Varrer primeiro, depois passar pano \xFAmido com desinfetante lavanda.",
    responsible_id: "Ambos",
    category: "Sala" /* SALA */,
    priority: "Normal" /* NORMAL */,
    due_date: new Date(Date.now() + 864e5).toISOString().split("T")[0],
    recurrence: "Semanal",
    time_estimate: 30,
    points: 15,
    completed: false,
    archived: false,
    comments: []
  },
  {
    id: "task_4",
    title: "Trocar l\xE2mpada do banheiro social",
    description: "Comprar l\xE2mpada LED branca de rosca comum e instalar.",
    responsible_id: "Leandro",
    category: "Banheiro" /* BANHEIRO */,
    priority: "Baixa" /* BAIXA */,
    due_date: new Date(Date.now() + 2592e5).toISOString().split("T")[0],
    recurrence: "Nenhuma",
    time_estimate: 10,
    points: 10,
    completed: false,
    archived: false,
    comments: []
  }
];
var DEFAULT_EVENTS = [
  {
    id: "event_1",
    title: "Anivers\xE1rio de Casamento (Celebra\xE7\xE3o)",
    description: "Nosso dia especial! Jantar rom\xE2ntico reservado no restaurante Vista Rooftop.",
    type: "Data especial" /* DATA_ESPECIAL */,
    start_time: `${(/* @__PURE__ */ new Date()).getFullYear()}-06-12T20:00:00`,
    end_time: `${(/* @__PURE__ */ new Date()).getFullYear()}-06-12T23:30:00`,
    location: "Restaurante Vista Rooftop",
    booking_link: "https://example.com/reserva-vista",
    responsible_id: "Ambos",
    comments: []
  },
  {
    id: "event_2",
    title: "Viagem de Fim de Semana para Campos do Jord\xE3o",
    description: "Mini-f\xE9rias no frio! Cobertores, fondue e caminhadas ao ar livre.",
    type: "Viagem" /* VIAGEM */,
    start_time: `${(/* @__PURE__ */ new Date()).getFullYear()}-07-15T08:00:00`,
    end_time: `${(/* @__PURE__ */ new Date()).getFullYear()}-07-17T18:00:00`,
    location: "Chale Bosque Feliz, Campos do Jord\xE3o",
    travel_checklist: [
      { item: "Casacos pesados", checked: true },
      { item: "Estojo de rem\xE9dios", checked: false },
      { item: "Garrafa t\xE9rmica de caf\xE9", checked: true },
      { item: "Carregadores e c\xE2mera", checked: false }
    ],
    responsible_id: "Ambos",
    comments: [
      { id: "ec1", author_id: "Leandro", text: "J\xE1 abasteci o carro!", timestamp: (/* @__PURE__ */ new Date()).toISOString() }
    ]
  },
  {
    id: "event_3",
    title: "Consulta M\xE9dica da Kaisa",
    description: "Exames de rotina peri\xF3dicos.",
    type: "Evento individual" /* INDIVIDUAL */,
    start_time: `${(/* @__PURE__ */ new Date()).getFullYear()}-06-05T14:30:00`,
    responsible_id: "Kaisa",
    comments: []
  }
];
var DEFAULT_SHOPPING = [
  { id: "shop_1", name: "Tomate italiano", category: "Hortifr\xFAti" /* HORTIFRUTI */, quantity: 1, unit: "kg", price: 8.5, is_bought: false, added_by: "Kaisa" },
  { id: "shop_2", name: "Leite Integral Sem Lactose", category: "Latic\xEDnios" /* LATICINIOS */, quantity: 4, unit: "caixas", price: 5.2, is_bought: false, added_by: "Leandro" },
  { id: "shop_3", name: "Alcatra bovina", category: "Carnes" /* CARNES */, quantity: 1.2, unit: "kg", price: 42, is_bought: true, bought_at: new Date(Date.now() - 4e5).toISOString(), added_by: "Leandro" },
  { id: "shop_4", name: "Detergente de Ma\xE7\xE3", category: "Limpeza" /* LIMPEZA */, quantity: 2, unit: "unidades", price: 2.8, is_bought: false, added_by: "Kaisa" },
  { id: "shop_5", name: "Papel higi\xEAnico folha dupla", category: "Higiene" /* HIGIENE */, quantity: 1, unit: "pacote (12 un)", price: 18.9, is_bought: false, added_by: "Kaisa" }
];
var DEFAULT_EXPENSES = [
  { id: "exp_1", value: 350, currency: "R$", description: "Supermercado Semanal (P\xE3o de A\xE7\xFAcar)", paid_by_id: "Leandro", split_type: "50/50", category: "Alimenta\xE7\xE3o" /* ALIMENTACAO */, date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], is_recurring: false },
  { id: "exp_2", value: 1200, currency: "R$", description: "Aluguel & Condom\xEDnio", paid_by_id: "Kaisa", split_type: "50/50", category: "Moradia" /* MORADIA */, date: new Date(Date.now() - 4 * 24 * 36e5).toISOString().split("T")[0], is_recurring: true },
  { id: "exp_3", value: 85, currency: "R$", description: "Rem\xE9dios Higiene Pet Shop (Luke)", paid_by_id: "Kaisa", split_type: "custom", custom_percent: 60, category: "Pets" /* PETS */, date: new Date(Date.now() - 2 * 24 * 36e5).toISOString().split("T")[0], is_recurring: false },
  { id: "exp_4", value: 160, currency: "R$", description: "Cinema e Pipoca (Divertidamente)", paid_by_id: "Leandro", split_type: "paid_all", category: "Lazer" /* LAZER */, date: new Date(Date.now() - 5 * 24 * 36e5).toISOString().split("T")[0], is_recurring: false }
];
var DEFAULT_MEMORIES = [
  {
    id: "mem_1",
    url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600",
    description: "Nossos sorrisos congelados na primeira que fomos \xE0 praia juntos!",
    date: `${(/* @__PURE__ */ new Date()).getFullYear() - 1}-01-10`,
    location: "Ubatuba, SP",
    album_name: "Praia e Ver\xE3o",
    created_at: new Date(Date.now() - 365 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: "mem_2",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600",
    description: "O dia que pegamos as chaves do nosso cantinho. Choro e emo\xE7\xE3o!",
    date: `${(/* @__PURE__ */ new Date()).getFullYear()}-03-15`,
    location: "S\xE3o Paulo, SP",
    album_name: "Nosso Apartamento",
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: "mem_3",
    url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
    description: "Luke dormindo com a l\xEDngua pra fora, n\xE3o aguentamos e tivemos que tirar foto.",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    location: "Em casa",
    album_name: "Ador\xE1vel Luke",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var DEFAULT_MOODS = [
  { id: "mood_1", user_id: "Leandro", mood: "\xD3timo" /* OTIMO */, note: "Reuni\xE3o de sprint deu super certo hoje!", share_note: true, date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] },
  { id: "mood_2", user_id: "Kaisa", mood: "Bem" /* BEM */, note: "Rotina corrida mas tudo sob controle", share_note: false, date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] },
  { id: "mood_prev_1", user_id: "Leandro", mood: "Bem" /* BEM */, date: new Date(Date.now() - 864e5).toISOString().split("T")[0], share_note: false },
  { id: "mood_prev_2", user_id: "Kaisa", mood: "Cansado" /* CANSADO */, note: "Faculdade cansativa demais", date: new Date(Date.now() - 864e5).toISOString().split("T")[0], share_note: true },
  { id: "mood_prev_3", user_id: "Leandro", mood: "Ansioso" /* ANSIOSO */, date: new Date(Date.now() - 2 * 864e5).toISOString().split("T")[0], share_note: false },
  { id: "mood_prev_4", user_id: "Kaisa", mood: "\xD3timo" /* OTIMO */, date: new Date(Date.now() - 2 * 864e5).toISOString().split("T")[0], share_note: false }
];
var DEFAULT_WISHLIST = [
  { id: "wish_1", name: "Smart TV 4K 55 Polegadas", priority: "Alta", category: "Para o Lar" /* LAR */, link: "https://example.com/tv", estimated_price: 2500, added_by: "Kaisa", saving_goal: 2500, saving_saved: 1200 },
  { id: "wish_2", name: "Anel de Prata Minimalista", priority: "M\xE9dia", category: "Pessoal" /* PESSOAL */, link: "https://example.com/ring", estimated_price: 180, is_private_to_partner: true, added_by: "Leandro" },
  // Surprise to Kaisa
  { id: "wish_3", name: "M\xE1quina de Caf\xE9 Espresso Exclusiva", priority: "M\xE9dia", category: "Para o Lar" /* LAR */, estimated_price: 950, added_by: "Leandro", saving_goal: 950, saving_saved: 300 },
  { id: "wish_4", name: "Passagem de bal\xE3o em Boituva", priority: "Alta", category: "Experi\xEAncias" /* EXPERIENCIA */, estimated_price: 800, added_by: "Ambos", saving_goal: 800, saving_saved: 800 }
  // fully funded!
];
var DEFAULT_RECIPES = [
  {
    id: "rec_1",
    title: "Macarr\xE3o Cremoso de Manjeric\xE3o",
    ingredients: ["Macarr\xE3o Penne - 300g", "Molho de tomate - 1 lata", "Manjeric\xE3o fresco - 1 punhado", "Creme de leite - 1 caixinha", "Alho amassado - 2 dentes", "Azeite de oliva"],
    instructions: "1. Cozinhe o penne em \xE1gua salgada at\xE9 ficar al dente.\n2. Refogue o alho no azeite, adicione o molho de tomate e manjeric\xE3o, cozinhe por 5 min.\n3. Misture o creme de leite no molho em fogo baixo.\n4. Escorra a massa e envolva-a completamente no creme arom\xE1tico. Sirva quente com queijo ralado.",
    duration: 20,
    portions: 2,
    couple_rating: "Favorita",
    tags: ["r\xE1pida", "econ\xF4mica", "vegetariana"]
  },
  {
    id: "rec_2",
    title: "Escondidinho de Carne Seca",
    ingredients: ["Mandioca cozida - 1kg", "Carne seca desfiada dessalgada - 500g", "Cebola picada - 1 un", "Manteiga - 2 colheres", "Leite integral - 1 x\xEDcara", "Queijo coalho ralado - 150g"],
    instructions: "1. Amasse a mandioca quente com manteiga e leite at\xE9 virar um pur\xEA homog\xEAneo.\n2. Refogue a carne seca com cebola at\xE9 dourar.\n3. Num refrat\xE1rio, fa\xE7a uma camada de carne, cubra com o pur\xEA de mandioca e polvilhe o queijo coalho.\n4. Leve ao forno para gratinar por 20 minutos a 200\xB0C.",
    duration: 50,
    portions: 3,
    couple_rating: "Gostamos",
    tags: ["especial"]
  }
];
var DEFAULT_MEAL_PLAN = [
  { id: "Segunda-Caf\xE9", day: "Segunda", meal_type: "Caf\xE9", custom_text: "Mam\xE3o, ovos mexidos e caf\xE9 puro" },
  { id: "Segunda-Almo\xE7o", day: "Segunda", meal_type: "Almo\xE7o", recipe_id: "rec_1" },
  // penne
  { id: "Segunda-Jantar", day: "Segunda", meal_type: "Jantar", custom_text: "Sopa leve de legumes e torrada" },
  { id: "Quarta-Jantar", day: "Quarta", meal_type: "Jantar", recipe_id: "rec_2" }
  // escondidinho
];
var DEFAULT_INVENTORY = [
  { id: "inv_1", name: "Arroz agulhinha", quantity: 2, unit: "kg", min_quantity: 1 },
  { id: "inv_2", name: "Caf\xE9 Gourmet mo\xEDdo", quantity: 0.5, unit: "kg", min_quantity: 0.5 },
  { id: "inv_3", name: "A\xE7\xFAcar demerara", quantity: 0.2, unit: "kg", min_quantity: 0.5 },
  // low stock! Should auto sug
  { id: "inv_4", name: "Sabonete l\xEDquido corpo", quantity: 1, unit: "unidade", min_quantity: 2 },
  // low stock! Should auto sug
  { id: "inv_5", name: "Detergente de Ma\xE7\xE3", quantity: 1, unit: "unidade", min_quantity: 1 }
];
var DEFAULT_REWARDS = [
  { id: "feet_massage", title: "Massagem nos P\xE9s de 30min", cost: 65, desc: "Moz\xE3o massageia seus p\xE9s ap\xF3s um dia tenso de rotina.", emoji: "\u{1F486}\u200D\u2642\uFE0F" },
  { id: "breakfast_bed", title: "Caf\xE9 da Manh\xE3 na Cama", cost: 95, desc: "Servido com torrada, caf\xE9 quentinho e beijinhos de bom dia.", emoji: "\u2615" },
  { id: "movie_choice", title: "Escolha Soberana do Filme", cost: 35, desc: "Decide o filme de hoje sem receber reclama\xE7\xF5es do parceiro.", emoji: "\u{1F3AC}" },
  { id: "no_dishes", title: "Folga da Lou\xE7a por 1 Dia", cost: 50, desc: "Isen\xE7\xE3o integral de lavar lou\xE7a de qualquer refei\xE7\xE3o do dia.", emoji: "\u{1F9FC}" },
  { id: "dream_dessert", title: "Sobremesa Especial do Amor", cost: 75, desc: "Moz\xE3o prepara ou compra o doce ou bolo que voc\xEA pedir.", emoji: "\u{1F370}" },
  { id: "full_massage", title: "Massageador nos Ombros & Costas", cost: 120, desc: "Sess\xE3o caprichada com \xF3leos relaxantes e sil\xEAncio absoluto.", emoji: "\u{1F56F}\uFE0F" }
];
var DEFAULT_QUESTS = [
  { id: "quest_1", title: "Guardi\xF5es da Faxina", description: "Concluir 3 tarefas de limpeza no painel.", points: 20, type: "Faxina", target_count: 3, current_count: 0, completed: false },
  { id: "quest_2", title: "Dupla Harmonia", description: "Ambos fazerem o check-in de humor de hoje.", points: 15, type: "Afeto", target_count: 2, current_count: 0, completed: false },
  { id: "quest_3", title: "Menu N\xF3sDois", description: "Registrar receitas especiais e favoritas.", points: 25, type: "Culin\xE1ria", target_count: 1, current_count: 0, completed: false }
];
var DBStore = class {
  constructor() {
    this.load();
  }
  load() {
    if (import_fs.default.existsSync(DB_FILE)) {
      try {
        const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        if (!this.data.rewards) {
          this.data.rewards = [...DEFAULT_REWARDS];
        }
        if (!this.data.quests) {
          this.data.quests = [...DEFAULT_QUESTS];
        }
        if (!this.data.quickNotes) {
          this.data.quickNotes = [];
        }
        if (!this.data.couples) {
          this.data.couples = {
            "couple_1": { ...this.data.couple }
          };
        }
        if (!this.data.accounts) {
          this.data.accounts = [
            { email: "leandro@nosdois.com", passwordHash: "123456", userId: "Leandro", coupleId: "couple_1" },
            { email: "kaisa@nosdois.com", passwordHash: "123456", userId: "Kaisa", coupleId: "couple_1" }
          ];
        }
        if (!this.data.couplesUsers) {
          this.data.couplesUsers = {
            "couple_1": { ...this.data.users }
          };
        }
        if (!this.data.pets) {
          this.data.pets = [];
        }
        if (!this.data.fixedFunctions) {
          this.data.fixedFunctions = [];
        }
        if (!this.data.activityReactions) {
          this.data.activityReactions = [];
        }
        if (!this.data.monthlyAccounts) {
          this.data.monthlyAccounts = [];
        }
      } catch (err) {
        console.error("Error reading database file, resetting to seeds", err);
        this.resetToDefaults();
      }
    } else {
      this.resetToDefaults();
    }
  }
  save() {
    try {
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing database file", err);
    }
  }
  resetToDefaults() {
    this.data = {
      users: { ...DEFAULT_USERS },
      couple: { ...DEFAULT_COUPLE },
      couples: {
        "couple_1": { ...DEFAULT_COUPLE }
      },
      couplesUsers: {
        "couple_1": { ...DEFAULT_USERS }
      },
      accounts: [
        { email: "leandro@nosdois.com", passwordHash: "123456", userId: "Leandro", coupleId: "couple_1" },
        { email: "kaisa@nosdois.com", passwordHash: "123456", userId: "Kaisa", coupleId: "couple_1" }
      ],
      tasks: [...DEFAULT_TASKS],
      events: [...DEFAULT_EVENTS],
      shopping: [...DEFAULT_SHOPPING],
      expenses: [...DEFAULT_EXPENSES],
      memories: [...DEFAULT_MEMORIES],
      moods: [...DEFAULT_MOODS],
      wishlist: [...DEFAULT_WISHLIST],
      recipes: [...DEFAULT_RECIPES],
      mealPlan: [...DEFAULT_MEAL_PLAN],
      inventory: [...DEFAULT_INVENTORY],
      rewards: [...DEFAULT_REWARDS],
      quests: [...DEFAULT_QUESTS],
      quickNotes: [],
      pets: [],
      fixedFunctions: [],
      activityReactions: [],
      monthlyAccounts: []
    };
    this.save();
  }
  // General Access
  getStore() {
    return this.data;
  }
  saveStore() {
    this.save();
  }
};
var db = new DBStore();

// server.ts
var import_genai = require("@google/genai");
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(import_express.default.json({ limit: "20mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
function getRequestCredentials(req) {
  const coupleId2 = req.headers["x-couple-id"] || req.query.coupleId || req.body.coupleId;
  const userId = req.headers["x-user-id"] || req.query.userId || req.body.userId;
  return {
    coupleId: typeof coupleId2 === "string" ? coupleId2 : "couple_1",
    userId: typeof userId === "string" ? userId : "Leandro"
  };
}
app.use((req, res, next) => {
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const listsToScope = [
    "tasks",
    "events",
    "shopping",
    "expenses",
    "memories",
    "moods",
    "wishlist",
    "recipes",
    "mealPlan",
    "inventory",
    "rewards",
    "quests",
    "quickNotes",
    "pets",
    "fixedFunctions",
    "activityReactions",
    "monthlyAccounts"
  ];
  listsToScope.forEach((key) => {
    const list = store[key];
    if (list && Array.isArray(list)) {
      list.push = function(...items) {
        items.forEach((item) => {
          if (item && typeof item === "object") {
            item.coupleId = coupleId2;
          }
        });
        return Array.prototype.push.apply(this, items);
      };
    }
  });
  next();
});
var aiClient = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new import_genai.GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI:", err);
      }
    }
  }
  return aiClient;
}
function getCoupleAndUsers(store, coupleId2) {
  if (!store.couples) {
    store.couples = {};
  }
  if (!store.couples[coupleId2]) {
    store.couples[coupleId2] = {
      id: coupleId2,
      invite_code: null,
      connected: true,
      home_level: 1,
      total_points: 0,
      unlocked_achievements: []
    };
  }
  if (!store.couplesUsers) {
    store.couplesUsers = {};
  }
  if (!store.couplesUsers[coupleId2]) {
    store.couplesUsers[coupleId2] = {
      Leandro: {
        id: "Leandro",
        name: "Parceiro 1",
        partner_nickname: "Amor",
        color: "#3B82F6",
        timezone: "America/Sao_Paulo",
        avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        points_weekly: 0
      },
      Kaisa: {
        id: "Kaisa",
        name: "Parceiro 2",
        partner_nickname: "Vida",
        color: "#EC4899",
        timezone: "America/Sao_Paulo",
        avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
        points_weekly: 0
      }
    };
  }
  return {
    couple: store.couples[coupleId2],
    users: store.couplesUsers[coupleId2]
  };
}
function logActivityForCouple(store, coupleId2, prefix, message) {
  const { couple } = getCoupleAndUsers(store, coupleId2);
  if (!couple.unlocked_achievements) {
    couple.unlocked_achievements = [];
  }
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  couple.unlocked_achievements.push(`activity:${prefix}:${message}:${timestamp}`);
  const nonActivities = couple.unlocked_achievements.filter((a) => !a.startsWith("activity:"));
  const activities = couple.unlocked_achievements.filter((a) => a.startsWith("activity:"));
  couple.unlocked_achievements = [...nonActivities, ...activities.slice(-40)];
}
function generateInviteCode() {
  const prefixes = ["AMOR", "CASAL", "LOVE", "PAR", "LAR", "VIDA"];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomNumber = Math.floor(10 + Math.random() * 90);
  return `${randomPrefix}${randomNumber}`;
}
app.get("/api/state", (req, res) => {
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple, users } = getCoupleAndUsers(store, coupleId2);
  const filterByCouple = (items) => {
    if (!items) return [];
    return items.filter((item) => {
      const itemCoupleId = item.coupleId || "couple_1";
      return itemCoupleId === coupleId2;
    });
  };
  res.json({
    users,
    couple,
    tasks: filterByCouple(store.tasks),
    events: filterByCouple(store.events),
    shopping: filterByCouple(store.shopping),
    expenses: filterByCouple(store.expenses),
    memories: filterByCouple(store.memories).map((m) => {
      if (m.is_capsule && m.capsule_unlock_date) {
        const isLocked = new Date(m.capsule_unlock_date).getTime() > Date.now();
        if (isLocked) {
          return {
            ...m,
            isLocked: true,
            url: "",
            // Clear actual URL
            description: m.description,
            // Keep description hidden or clear? Let's hide the description or make it custom
            masked_description: `\u{1F512} C\xE1psula do Tempo Selada at\xE9 ${new Date(m.capsule_unlock_date).toLocaleDateString("pt-BR")}`
          };
        }
      }
      return m;
    }),
    moods: filterByCouple(store.moods),
    wishlist: filterByCouple(store.wishlist),
    recipes: filterByCouple(store.recipes),
    mealPlan: filterByCouple(store.mealPlan),
    inventory: filterByCouple(store.inventory),
    rewards: filterByCouple(store.rewards),
    quests: filterByCouple(store.quests),
    quickNotes: filterByCouple(store.quickNotes),
    pets: filterByCouple(store.pets || []),
    fixedFunctions: filterByCouple(store.fixedFunctions || []),
    activityReactions: filterByCouple(store.activityReactions || []),
    monthlyAccounts: filterByCouple(store.monthlyAccounts || [])
  });
});
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, nickname, partner_nickname, color, avatar_url } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "E-mail, senha e nome s\xE3o obrigat\xF3rios" });
  }
  const store = db.getStore();
  if (!store.accounts) store.accounts = [];
  const existingAccount = store.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (existingAccount) {
    return res.status(400).json({ error: "Este email de conta j\xE1 est\xE1 registrado" });
  }
  const generatedCoupleId = "couple_" + Date.now() + "_" + Math.floor(Math.random() * 1e3);
  const generatedInviteCode = generateInviteCode();
  store.accounts.push({
    email,
    passwordHash: password,
    // Simple plain text for mock project
    userId: "Leandro",
    // User 1 maps to Leandro internally
    coupleId: generatedCoupleId
  });
  if (!store.couples) store.couples = {};
  store.couples[generatedCoupleId] = {
    id: generatedCoupleId,
    invite_code: generatedInviteCode,
    connected: false,
    // Waiting for spouse code integration
    home_level: 1,
    total_points: 0,
    unlocked_achievements: []
  };
  if (!store.couplesUsers) store.couplesUsers = {};
  store.couplesUsers[generatedCoupleId] = {
    Leandro: {
      id: "Leandro",
      name,
      partner_nickname: partner_nickname || "Meu Amor",
      color: color || "#3B82F6",
      timezone: "America/Sao_Paulo",
      avatar_url: avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      points_weekly: 0
    },
    Kaisa: {
      id: "Kaisa",
      name: "Parceiro 2",
      partner_nickname: "Minha Vida",
      color: "#EC4899",
      timezone: "America/Sao_Paulo",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      points_weekly: 0
    }
  };
  logActivityForCouple(store, generatedCoupleId, "register", `\u{1F3E0} Lar digital iniciado por ${name}!`);
  db.saveStore();
  res.json({
    success: true,
    email,
    userId: "Leandro",
    coupleId: generatedCoupleId,
    couple: store.couples[generatedCoupleId],
    user: store.couplesUsers[generatedCoupleId]["Leandro"]
  });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha s\xE3o obrigat\xF3rios" });
  }
  const store = db.getStore();
  if (!store.accounts) store.accounts = [];
  const account = store.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.passwordHash === password);
  if (!account) {
    return res.status(401).json({ error: "E-mail ou senha incorretos" });
  }
  const { couple, users } = getCoupleAndUsers(store, account.coupleId);
  res.json({
    success: true,
    email,
    userId: account.userId,
    coupleId: account.coupleId,
    couple,
    user: users[account.userId],
    users
  });
});
app.post("/api/auth/use-code", (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) {
    return res.status(400).json({ error: "C\xF3digo \xE9 obrigat\xF3rio" });
  }
  const store = db.getStore();
  if (!store.couples) store.couples = {};
  const cleanCode = inviteCode.trim().toUpperCase();
  const coupleId2 = Object.keys(store.couples).find((cid) => store.couples[cid].invite_code === cleanCode);
  if (!coupleId2) {
    return res.status(404).json({ error: "C\xF3digo do casal inv\xE1lido ou j\xE1 conectado!" });
  }
  const couple = store.couples[coupleId2];
  const { users } = getCoupleAndUsers(store, coupleId2);
  res.json({
    success: true,
    coupleId: coupleId2,
    couple,
    firstPartnerName: users["Leandro"]?.name || "Parceiro"
  });
});
app.post("/api/auth/complete-partner", (req, res) => {
  const { coupleId: coupleId2, email, password, name, nickname, avatar_url } = req.body;
  if (!coupleId2 || !email || !password || !name) {
    return res.status(400).json({ error: "Todos os campos de cadastro s\xE3o obrigat\xF3rios" });
  }
  const store = db.getStore();
  if (!store.accounts) store.accounts = [];
  const existingAccount = store.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (existingAccount) {
    return res.status(400).json({ error: "Este email de conta j\xE1 est\xE1 registrado" });
  }
  const { couple, users } = getCoupleAndUsers(store, coupleId2);
  const partnerAccount = store.accounts.find((a) => a.coupleId === coupleId2 && a.userId === "Kaisa");
  if (couple.connected && partnerAccount) {
    return res.status(400).json({ error: "O parceiro j\xE1 possui uma conta registrada. Use 'Entrar' com seu email e senha." });
  }
  store.accounts.push({
    email,
    passwordHash: password,
    userId: "Kaisa",
    // User 2 maps to Kaisa internally
    coupleId: coupleId2
  });
  users["Kaisa"] = {
    id: "Kaisa",
    name,
    partner_nickname: nickname || "Amor",
    color: "#EC4899",
    timezone: "America/Sao_Paulo",
    avatar_url: avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    points_weekly: 0
  };
  couple.connected = true;
  logActivityForCouple(store, coupleId2, "couple_connected", `\u{1F49C} ${name} entrou no lar compartilhado com ${users["Leandro"].name}!`);
  db.saveStore();
  res.json({
    success: true,
    email,
    userId: "Kaisa",
    coupleId: coupleId2,
    couple,
    user: users["Kaisa"],
    users
  });
});
app.post("/api/auth/delete-account", (req, res) => {
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  if (!coupleId2 || coupleId2 === "couple_1") {
    return res.status(400).json({ error: "Para fins de demonstra\xE7\xE3o, n\xE3o \xE9 permitido excluir o lar padr\xE3o de simula\xE7\xE3o." });
  }
  const store = db.getStore();
  if (store.accounts) {
    store.accounts = store.accounts.filter((a) => a.coupleId !== coupleId2);
  }
  if (store.couples) {
    delete store.couples[coupleId2];
  }
  if (store.couplesUsers) {
    delete store.couplesUsers[coupleId2];
  }
  const listsToScope = [
    "tasks",
    "events",
    "shopping",
    "expenses",
    "memories",
    "moods",
    "wishlist",
    "recipes",
    "mealPlan",
    "inventory",
    "rewards",
    "quests",
    "quickNotes",
    "pets",
    "fixedFunctions",
    "activityReactions",
    "monthlyAccounts"
  ];
  listsToScope.forEach((key) => {
    const list = store[key];
    if (list && Array.isArray(list)) {
      store[key] = list.filter((item) => item.coupleId !== coupleId2);
    }
  });
  db.saveStore();
  res.json({
    success: true,
    message: "Todas as contas e hist\xF3rico do casal foram exclu\xEDdos com sucesso. At\xE9 breve!"
  });
});
app.post("/api/profile/reset", (req, res) => {
  db.resetToDefaults();
  res.json({ success: true, message: "Banco de dados reiniciado com sucesso!", state: db.getStore() });
});
app.post("/api/profile/update", (req, res) => {
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const { user_id, name, nickname, partner_nickname, color, timezone, avatar_url, preferences } = req.body;
  const store = db.getStore();
  const { users } = getCoupleAndUsers(store, coupleId2);
  if (users[user_id]) {
    if (name) {
      users[user_id].name = name;
    }
    if (nickname !== void 0) {
      users[user_id].nickname = nickname;
    }
    if (partner_nickname !== void 0) {
      users[user_id].partner_nickname = partner_nickname;
    }
    if (color) {
      users[user_id].color = color;
    }
    if (timezone) {
      users[user_id].timezone = timezone;
    }
    if (avatar_url) {
      users[user_id].avatar_url = avatar_url;
    }
    if (preferences !== void 0) {
      users[user_id].preferences = {
        ...users[user_id].preferences,
        ...preferences
      };
    }
    db.saveStore();
    res.json({ success: true, user: users[user_id] });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});
app.post("/api/couple/disconnect", (req, res) => {
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple } = getCoupleAndUsers(store, coupleId2);
  couple.connected = false;
  db.saveStore();
  res.json({ success: true, couple });
});
app.post("/api/couple/reconnect", (req, res) => {
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple } = getCoupleAndUsers(store, coupleId2);
  couple.connected = true;
  db.saveStore();
  res.json({ success: true, couple });
});
function logActivity(store, prefix, message, coupleId2) {
  let couple;
  if (coupleId2 && store.couples && store.couples[coupleId2]) {
    couple = store.couples[coupleId2];
  } else {
    couple = store.couple;
  }
  if (!couple) return;
  if (!couple.unlocked_achievements) {
    couple.unlocked_achievements = [];
  }
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  couple.unlocked_achievements.push(`activity:${prefix}:${message}:${timestamp}`);
  const nonActivities = couple.unlocked_achievements.filter((a) => !a.startsWith("activity:"));
  const activities = couple.unlocked_achievements.filter((a) => a.startsWith("activity:"));
  couple.unlocked_achievements = [...nonActivities, ...activities.slice(-40)];
}
app.post("/api/couple/redeem-reward", (req, res) => {
  const { reward_title, cost, user_id } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple } = getCoupleAndUsers(store, coupleId2);
  if (couple.total_points >= cost) {
    couple.total_points -= cost;
    if (!couple.unlocked_achievements) {
      couple.unlocked_achievements = [];
    }
    const timestampStr = (/* @__PURE__ */ new Date()).toISOString();
    couple.unlocked_achievements.push(`redeemed:${reward_title}:${user_id}:${timestampStr}`);
    db.saveStore();
    res.json({ success: true, message: `Recompensa '${reward_title}' resgatada com sucesso por ${user_id}!` });
  } else {
    res.status(400).json({ error: "Pontos do lar insuficientes para este resgate carinhoso." });
  }
});
app.post("/api/tasks/create", (req, res) => {
  const { title, description, responsible_id, due_date, recurrence, category, priority, time_estimate } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }
  const store = db.getStore();
  const newTask = {
    id: "task_" + Date.now(),
    title: title.slice(0, 80),
    description: description ? description.slice(0, 500) : "",
    responsible_id: responsible_id || "Ambos",
    due_date: due_date || void 0,
    recurrence: recurrence || "Nenhuma",
    category: category || "Outro" /* OUTRO */,
    priority: priority || "Normal" /* NORMAL */,
    time_estimate: time_estimate ? parseInt(time_estimate, 10) : void 0,
    points: priority === "Urgente" /* URGENTE */ ? 25 : 10,
    completed: false,
    archived: false,
    comments: []
  };
  store.tasks.push(newTask);
  db.saveStore();
  res.json({ success: true, task: newTask });
});
app.post("/api/tasks/toggle", (req, res) => {
  const { id, user_id, photo_proof } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple, users } = getCoupleAndUsers(store, coupleId2);
  const task = store.tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  task.completed = !task.completed;
  if (task.completed) {
    task.completed_at = (/* @__PURE__ */ new Date()).toISOString();
    if (photo_proof) {
      task.photo_proof = photo_proof;
    }
    let earnedPoints = task.priority === "Urgente" /* URGENTE */ ? 25 : 10;
    if (task.due_date) {
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (todayStr <= task.due_date) {
        earnedPoints += 5;
      }
    }
    if (users[user_id]) {
      users[user_id].points_weekly += earnedPoints;
    }
    couple.total_points += earnedPoints;
    logActivity(store, "task_completed", `${user_id} completou a tarefa '${task.title}' (+${earnedPoints} pontos!)`, coupleId2);
    if (task.recurrence && task.recurrence !== "Nenhuma") {
      let baseDate = task.due_date ? /* @__PURE__ */ new Date(task.due_date + "T12:00:00") : /* @__PURE__ */ new Date();
      if (isNaN(baseDate.getTime())) {
        baseDate = /* @__PURE__ */ new Date();
      }
      const nextDate = new Date(baseDate);
      if (task.recurrence === "Di\xE1ria") {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (task.recurrence === "Semanal") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (task.recurrence === "Quinzenal") {
        nextDate.setDate(nextDate.getDate() + 14);
      } else if (task.recurrence === "Mensal") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      const nextDueDateStr = nextDate.toISOString().split("T")[0];
      const recurringTask = {
        id: "task_rec_" + Date.now(),
        title: task.title,
        description: task.description,
        responsible_id: task.responsible_id,
        due_date: nextDueDateStr,
        recurrence: task.recurrence,
        category: task.category,
        priority: task.priority,
        time_estimate: task.time_estimate,
        points: task.points,
        completed: false,
        archived: false,
        comments: [],
        coupleId: task.coupleId
      };
      store.tasks.push(recurringTask);
      logActivity(store, "task_recreated", `Agenda recorrente agendada para ${nextDueDateStr}: ${task.title}`, coupleId2);
    }
    const nextLevel = Math.floor(couple.total_points / 100) + 1;
    if (nextLevel > couple.home_level) {
      couple.home_level = nextLevel;
      logActivity(store, "level_up", `\u{1F389} Parab\xE9ns! O lar subiu para o N\xEDvel ${nextLevel} com ${couple.total_points} pontos!`, coupleId2);
    }
  } else {
    let penaltyPoints = task.priority === "Urgente" /* URGENTE */ ? 25 : 10;
    if (task.due_date) {
      penaltyPoints += 5;
    }
    if (users[user_id]) {
      users[user_id].points_weekly = Math.max(0, users[user_id].points_weekly - penaltyPoints);
    }
    couple.total_points = Math.max(0, couple.total_points - penaltyPoints);
    task.completed_at = void 0;
    task.photo_proof = void 0;
    logActivity(store, "task_undone", `${user_id} reabriu a tarefa '${task.title}'.`, coupleId2);
  }
  db.saveStore();
  res.json({ success: true, task, couple, users });
});
app.post("/api/tasks/archive", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const task = store.tasks.find((t) => t.id === id);
  if (task) {
    task.archived = !task.archived;
    db.saveStore();
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});
app.post("/api/tasks/comment", (req, res) => {
  const { task_id, author_id, text } = req.body;
  const store = db.getStore();
  const task = store.tasks.find((t) => t.id === task_id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const newComment = {
    id: "comment_" + Date.now(),
    author_id,
    text: text || "",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  task.comments.push(newComment);
  db.saveStore();
  res.json({ success: true, comment: newComment, task });
});
app.post("/api/shopping/create", (req, res) => {
  const { name, category, quantity, unit, price, added_by, suggested, reason_suggested, monthId } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const store = db.getStore();
  const targetMonthId = monthId || "2026-05";
  const lowercaseName = name.trim().toLowerCase();
  const duplicate = store.shopping.find(
    (i) => !i.is_bought && (i.monthId === targetMonthId || !i.monthId && targetMonthId === "2026-05") && i.name.trim().toLowerCase() === lowercaseName
  );
  if (duplicate) {
    return res.json({
      success: true,
      warning: "Duplicate detected",
      message: `O item '${name}' j\xE1 existe na lista pendente deste m\xEAs!`,
      item: duplicate
    });
  }
  let resolvedCategory = category || "Outros" /* OUTROS */;
  if (!category) {
    const listHorti = ["banana", "ma\xE7\xE3", "tomate", "cebola", "alho", "laranja", "batata", "alface", "fruta", "legume"];
    const listLati = ["leite", "queijo", "iogurte", "manteiga", "requeij\xE3o", "creme", "sorvete", "yakult"];
    const listCarne = ["carne", "frango", "peixe", "alcatra", "mignon", "porco", "peito", "lingui\xE7a", "salsicha"];
    const listLimp = ["detergente", "sab\xE3o", "desinfetante", "cloro", "pano", "amaciante", "\xE1gua sanit\xE1ria"];
    const listHigi = ["papel higi\xEAnico", "sabonete", "shampoo", "creme de dente", "pasta de dente", "fio dental"];
    const isMatch = (arr) => arr.some((kw) => lowercaseName.includes(kw));
    if (isMatch(listHorti)) resolvedCategory = "Hortifr\xFAti" /* HORTIFRUTI */;
    else if (isMatch(listLati)) resolvedCategory = "Latic\xEDnios" /* LATICINIOS */;
    else if (isMatch(listCarne)) resolvedCategory = "Carnes" /* CARNES */;
    else if (isMatch(listLimp)) resolvedCategory = "Limpeza" /* LIMPEZA */;
    else if (isMatch(listHigi)) resolvedCategory = "Higiene" /* HIGIENE */;
  }
  const newItem = {
    id: "shop_" + Date.now(),
    name,
    category: resolvedCategory,
    quantity: quantity ? parseFloat(quantity) : 1,
    unit: unit || "unidades",
    price: price ? parseFloat(price) : void 0,
    is_bought: false,
    added_by: added_by || "Parceiro",
    suggested: !!suggested,
    reason_suggested: reason_suggested || void 0,
    monthId: targetMonthId,
    listStatus: "active"
  };
  store.shopping.push(newItem);
  db.saveStore();
  res.json({ success: true, item: newItem });
});
app.post("/api/shopping/create-bulk", (req, res) => {
  const { items, added_by, monthId } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Items array is required" });
  }
  const store = db.getStore();
  const addedItems = [];
  const duplicates = [];
  const targetMonthId = monthId || "2026-05";
  for (const item of items) {
    if (!item.name) continue;
    const name = item.name.trim();
    const lowercaseName = name.toLowerCase();
    const duplicate = store.shopping.find(
      (i) => !i.is_bought && (i.monthId === targetMonthId || !i.monthId && targetMonthId === "2026-05") && i.name.trim().toLowerCase() === lowercaseName
    );
    if (duplicate) {
      duplicates.push(name);
      continue;
    }
    let resolvedCategory = item.category || "Outros" /* OUTROS */;
    if (!item.category) {
      const listHorti = ["banana", "ma\xE7\xE3", "tomate", "cebola", "alho", "laranja", "batata", "alface", "fruta", "legume"];
      const listLati = ["leite", "queijo", "iogurte", "manteiga", "requeij\xE3o", "creme", "sorvete", "yakult"];
      const listCarne = ["carne", "frango", "peixe", "alcatra", "mignon", "porco", "peito", "lingui\xE7a", "salsicha"];
      const listLimp = ["detergente", "sab\xE3o", "desinfetante", "cloro", "pano", "amaciante", "\xE1gua sanit\xE1ria"];
      const listHigi = ["papel higi\xEAnico", "sabonete", "shampoo", "creme de dente", "pasta de dente", "fio dental"];
      const isMatch = (arr) => arr.some((kw) => lowercaseName.includes(kw));
      if (isMatch(listHorti)) resolvedCategory = "Hortifr\xFAti" /* HORTIFRUTI */;
      else if (isMatch(listLati)) resolvedCategory = "Latic\xEDnios" /* LATICINIOS */;
      else if (isMatch(listCarne)) resolvedCategory = "Carnes" /* CARNES */;
      else if (isMatch(listLimp)) resolvedCategory = "Limpeza" /* LIMPEZA */;
      else if (isMatch(listHigi)) resolvedCategory = "Higiene" /* HIGIENE */;
    }
    const newItem = {
      id: "shop_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name,
      category: resolvedCategory,
      quantity: item.quantity ? parseFloat(item.quantity) : 1,
      unit: item.unit || "unidades",
      price: item.price ? parseFloat(item.price) : void 0,
      is_bought: false,
      added_by: added_by || "Parceiro",
      monthId: targetMonthId,
      listStatus: "active"
    };
    store.shopping.push(newItem);
    addedItems.push(newItem);
  }
  db.saveStore();
  res.json({ success: true, addedItems, duplicates });
});
app.post("/api/shopping/toggle", (req, res) => {
  const { id } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const item = store.shopping.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  item.is_bought = !item.is_bought;
  item.bought_at = item.is_bought ? (/* @__PURE__ */ new Date()).toISOString() : void 0;
  if (item.is_bought) {
    logActivity(store, "shopping", `\u{1F6D2} Compra Selecionada: '${item.name}' (${item.quantity} ${item.unit}) foi riscado.`, coupleId2);
  } else {
    logActivity(store, "shopping_removed", `\u{1F6D2} Compra Desmarcada: '${item.name}' est\xE1 pendente.`, coupleId2);
  }
  db.saveStore();
  res.json({ success: true, item, shopping: store.shopping });
});
app.post("/api/shopping/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  store.shopping = store.shopping.filter((i) => i.id !== id);
  db.saveStore();
  res.json({ success: true });
});
app.post("/api/shopping/budget", (req, res) => {
  const { monthId, budget } = req.body;
  if (!monthId) {
    return res.status(400).json({ error: "monthId is required" });
  }
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple } = getCoupleAndUsers(store, coupleId2);
  if (!couple.shoppingBudgets) {
    couple.shoppingBudgets = {};
  }
  couple.shoppingBudgets[monthId] = parseFloat(budget) || 0;
  db.saveStore();
  res.json({ success: true, shoppingBudgets: couple.shoppingBudgets });
});
app.post("/api/shopping/update", (req, res) => {
  const { id, name, quantity, unit, price, category } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Item ID is required" });
  }
  const store = db.getStore();
  const item = store.shopping.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  if (name !== void 0) item.name = name;
  if (quantity !== void 0) item.quantity = parseFloat(quantity) || 0;
  if (unit !== void 0) item.unit = unit;
  if (price !== void 0) item.price = price !== null && price !== "" ? parseFloat(price) : void 0;
  if (category !== void 0) item.category = category;
  db.saveStore();
  res.json({ success: true, item, shopping: store.shopping });
});
app.post("/api/shopping/finalize", (req, res) => {
  const { monthId, paymentMethod, totalSpent, paid_by_id, carryOver } = req.body;
  if (!monthId) {
    return res.status(400).json({ error: "monthId is required" });
  }
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple } = getCoupleAndUsers(store, coupleId2);
  const currentMonthId = monthId;
  const nextMonthId = (() => {
    const [y, m] = currentMonthId.split("-").map(Number);
    if (!m) return "2026-06";
    let nextY = y;
    let nextM = m + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    return `${nextY}-${String(nextM).padStart(2, "0")}`;
  })();
  const monthItems = store.shopping.filter(
    (i) => i.monthId === currentMonthId || !i.monthId && currentMonthId === "2026-05"
  );
  if (monthItems.length === 0) {
    return res.status(400).json({ error: "Nenhum item nesta lista para finalizar." });
  }
  const actualSpent = totalSpent !== void 0 ? parseFloat(totalSpent) : 0;
  const estimatedTotal = monthItems.filter((i) => i.is_bought).reduce((acc, i) => acc + (i.price || 0) * i.quantity, 0);
  const difference = estimatedTotal - actualSpent;
  if (!couple.shoppingFinalizations) {
    couple.shoppingFinalizations = [];
  }
  couple.shoppingFinalizations.push({
    id: "fin_" + Date.now(),
    monthId: currentMonthId,
    estimatedTotal,
    realTotal: actualSpent,
    difference,
    paymentMethod: paymentMethod || "N\xE3o Informado",
    paidBy: paid_by_id || "Leandro",
    date: (/* @__PURE__ */ new Date()).toISOString()
  });
  for (const item of monthItems) {
    if (item.is_bought) {
      item.listStatus = "finalized";
      item.paymentMethod = paymentMethod || "N\xE3o Informado";
    } else if (carryOver) {
      item.monthId = nextMonthId;
      item.listStatus = "active";
    } else {
      item.listStatus = "finalized";
    }
  }
  const helperFormatMonth = (ym) => {
    const months = ["Janeiro", "Fevereiro", "Mar\xE7o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const parts = ym.split("-");
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    if (isNaN(m) || m < 1 || m > 12) return ym;
    return `${months[m - 1]}/${y}`;
  };
  const readableMonth = helperFormatMonth(monthId);
  const mapPaymentMethod = (method) => {
    if (!method) return "Outro";
    const lower = method.toLowerCase();
    if (lower === "d\xE9bito" || lower === "debito") return "D\xE9bito";
    if (lower === "cr\xE9dito" || lower === "credito") return "Cr\xE9dito";
    if (lower === "pix") return "Pix";
    if (lower === "dinheiro") return "Dinheiro";
    if (lower === "carteira digital" || lower === "vr" || lower === "carteira") return "Carteira digital";
    return "Outro";
  };
  const newExpense = {
    id: "exp_shop_final_" + Date.now(),
    value: actualSpent,
    currency: "R$",
    description: `Lista de Compras de ${readableMonth} - M\xE9todo: ${paymentMethod || "N\xE3o Informado"}`,
    paid_by_id: paid_by_id || "Leandro",
    split_type: "50/50",
    category: "Alimenta\xE7\xE3o" /* ALIMENTACAO */,
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    is_recurring: false,
    payment_method: mapPaymentMethod(paymentMethod)
  };
  store.expenses.push(newExpense);
  logActivity(
    store,
    "shopping_finalized",
    `\u2705 Lista de ${readableMonth} finalizada por ${paid_by_id}! R$ ${actualSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pagos via ${paymentMethod || "N\xE3o Informado"} lan\xE7ados automaticamente nas finan\xE7as.`,
    coupleId2
  );
  db.saveStore();
  res.json({ success: true, expenses: store.expenses, shopping: store.shopping, shoppingFinalizations: couple.shoppingFinalizations });
});
app.post("/api/inventory/update", (req, res) => {
  const { id, name, quantity, min_quantity, unit } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const checkAndAddToShopping = (item) => {
    if (item.quantity < item.min_quantity) {
      const today = /* @__PURE__ */ new Date();
      const currentMonthId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const lowercaseName = item.name.trim().toLowerCase();
      const exists = store.shopping.find(
        (s) => !s.is_bought && s.monthId === currentMonthId && s.name.trim().toLowerCase() === lowercaseName
      );
      if (!exists) {
        const newShopItem = {
          id: "shop_inv_" + Date.now(),
          name: item.name,
          category: "Outros" /* OUTROS */,
          quantity: Math.max(1, Math.ceil(item.min_quantity - item.quantity)),
          unit: item.unit,
          price: 0,
          is_bought: false,
          added_by: "Estoque Baixo",
          monthId: currentMonthId,
          coupleId: item.coupleId
        };
        store.shopping.push(newShopItem);
        logActivity(store, "inventory_low", `Estoque baixo: '${item.name}' caiu para ${item.quantity} ${item.unit}. Item inserido no carrinho! \u{1F6D2}`, coupleId2);
      }
    }
  };
  if (id) {
    const item = store.inventory.find((i) => i.id === id);
    if (item) {
      item.quantity = parseFloat(quantity);
      if (min_quantity !== void 0) item.min_quantity = parseFloat(min_quantity);
      if (unit) item.unit = unit;
      checkAndAddToShopping(item);
      db.saveStore();
      return res.json({ success: true, item, shopping: store.shopping });
    }
  } else if (name) {
    const newItem = {
      id: "inv_" + Date.now(),
      name,
      quantity: parseFloat(quantity) || 0,
      unit: unit || "unidades",
      min_quantity: parseFloat(min_quantity) || 1
    };
    store.inventory.push(newItem);
    checkAndAddToShopping(newItem);
    db.saveStore();
    return res.json({ success: true, item: newItem, shopping: store.shopping });
  }
  res.status(400).json({ error: "Invalid action" });
});
app.post("/api/quick-notes/create", (req, res) => {
  const { text, authorId } = req.body;
  if (!text || !authorId) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.quickNotes) {
    store.quickNotes = [];
  }
  const newNote = {
    id: "note_" + Date.now(),
    text,
    authorId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  store.quickNotes.push(newNote);
  db.saveStore();
  logActivity(store, "note", `\u{1F4DD} ${authorId} adicionou nota r\xE1pida: "${text}"`, coupleId2);
  res.json({ success: true, note: newNote, quickNotes: store.quickNotes });
});
app.post("/api/quick-notes/delete", (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  const store = db.getStore();
  if (!store.quickNotes) {
    store.quickNotes = [];
  }
  store.quickNotes = store.quickNotes.filter((n) => n.id !== id);
  db.saveStore();
  res.json({ success: true, quickNotes: store.quickNotes });
});
app.post("/api/expenses/create", (req, res) => {
  const {
    value,
    currency,
    description,
    paid_by_id,
    split_type,
    custom_percent,
    category,
    date,
    is_recurring,
    payment_method,
    card_name,
    installments_total,
    installments_current,
    monthly_installment_value
  } = req.body;
  if (!value || !description || !paid_by_id) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  const store = db.getStore();
  const newExpense = {
    id: "exp_" + Date.now(),
    value: parseFloat(value),
    currency: currency || "R$",
    description: description.slice(0, 100),
    paid_by_id,
    split_type: split_type || "50/50",
    custom_percent: custom_percent ? parseFloat(custom_percent) : void 0,
    category: category || "Outros" /* OUTROS */,
    date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    is_recurring: !!is_recurring,
    payment_method: payment_method || void 0,
    card_name: card_name || void 0,
    installments_total: installments_total ? parseInt(installments_total, 10) : void 0,
    installments_current: installments_current ? parseInt(installments_current, 10) : void 0,
    monthly_installment_value: monthly_installment_value ? parseFloat(monthly_installment_value) : void 0
  };
  store.expenses.push(newExpense);
  db.saveStore();
  res.json({ success: true, expense: newExpense });
});
app.post("/api/expenses/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  store.expenses = store.expenses.filter((e) => e.id !== id);
  db.saveStore();
  res.json({ success: true });
});
app.post("/api/expenses/toggle-paid", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const expense = store.expenses.find((e) => e.id === id);
  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }
  expense.is_paid_this_month = !expense.is_paid_this_month;
  db.saveStore();
  res.json({ success: true, expense });
});
app.post("/api/rewards/create", (req, res) => {
  const { title, cost, desc, emoji } = req.body;
  if (!title || !cost) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  const store = db.getStore();
  const newReward = {
    id: "reward_" + Date.now(),
    title,
    cost: parseInt(cost),
    desc: desc || "",
    emoji: emoji || "\u{1F381}"
  };
  if (!store.rewards) store.rewards = [];
  store.rewards.push(newReward);
  db.saveStore();
  res.json({ success: true, reward: newReward });
});
app.post("/api/rewards/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  if (!store.rewards) store.rewards = [];
  store.rewards = store.rewards.filter((r) => r.id !== id);
  db.saveStore();
  res.json({ success: true });
});
app.post("/api/quests/create", (req, res) => {
  const { title, description, points, type, target_count } = req.body;
  if (!title || !points) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  const store = db.getStore();
  const newQuest = {
    id: "quest_" + Date.now(),
    title,
    description: description || "",
    points: parseInt(points) || 10,
    type: type || "Custom",
    target_count: target_count ? parseInt(target_count) : void 0,
    current_count: target_count ? 0 : void 0,
    completed: false
  };
  if (!store.quests) store.quests = [];
  store.quests.push(newQuest);
  db.saveStore();
  res.json({ success: true, quest: newQuest });
});
app.post("/api/quests/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  if (!store.quests) store.quests = [];
  store.quests = store.quests.filter((q) => q.id !== id);
  db.saveStore();
  res.json({ success: true });
});
app.post("/api/quests/toggle-complete", (req, res) => {
  const { id, user_id } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple, users } = getCoupleAndUsers(store, coupleId2);
  if (!store.quests) store.quests = [];
  const quest = store.quests.find((q) => q.id === id);
  if (!quest) {
    return res.status(404).json({ error: "Quest not found" });
  }
  quest.completed = !quest.completed;
  if (quest.completed) {
    couple.total_points += quest.points;
    if (user_id && users[user_id]) {
      users[user_id].points_weekly += quest.points;
    }
  } else {
    couple.total_points = Math.max(0, couple.total_points - quest.points);
    if (user_id && users[user_id]) {
      users[user_id].points_weekly = Math.max(0, users[user_id].points_weekly - quest.points);
    }
  }
  db.saveStore();
  res.json({ success: true, quest, couple, users });
});
app.post("/api/events/create", (req, res) => {
  const { title, description, type, start_time, end_time, location, travel_checklist, booking_link, responsible_id } = req.body;
  if (!title || !start_time || !type) {
    return res.status(400).json({ error: "Missing required fields for event" });
  }
  const store = db.getStore();
  const newEvent = {
    id: "event_" + Date.now(),
    title,
    description,
    type,
    start_time,
    end_time,
    location,
    travel_checklist: travel_checklist || (type === "Viagem" /* VIAGEM */ ? [] : void 0),
    booking_link,
    responsible_id: responsible_id || "Ambos",
    comments: []
  };
  store.events.push(newEvent);
  db.saveStore();
  res.json({ success: true, event: newEvent });
});
app.post("/api/events/checklist/toggle", (req, res) => {
  const { event_id, item_text } = req.body;
  const store = db.getStore();
  const event = store.events.find((e) => e.id === event_id);
  if (!event || !event.travel_checklist) {
    return res.status(404).json({ error: "Event or travel checklist not found" });
  }
  const checkItem = event.travel_checklist.find((i) => i.item === item_text);
  if (checkItem) {
    checkItem.checked = !checkItem.checked;
    db.saveStore();
    res.json({ success: true, event });
  } else {
    res.status(404).json({ error: "Checklist item not found" });
  }
});
app.post("/api/events/checklist/add", (req, res) => {
  const { event_id, item_text } = req.body;
  const store = db.getStore();
  const event = store.events.find((e) => e.id === event_id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  if (!event.travel_checklist) {
    event.travel_checklist = [];
  }
  event.travel_checklist.push({ item: item_text, checked: false });
  db.saveStore();
  res.json({ success: true, event });
});
app.post("/api/memories/create", (req, res) => {
  const { url, description, date, location, album_name, is_capsule, capsule_unlock_date } = req.body;
  if (!url || !description) {
    return res.status(400).json({ error: "Photo URL and description are required" });
  }
  const store = db.getStore();
  const newMemory = {
    id: "mem_" + Date.now(),
    url,
    description,
    date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    location,
    album_name: album_name || "Geral",
    is_capsule: !!is_capsule,
    capsule_unlock_date: capsule_unlock_date || void 0,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  store.memories.push(newMemory);
  db.saveStore();
  res.json({ success: true, memory: newMemory });
});
app.post("/api/moods/checkin", (req, res) => {
  const { user_id, mood, note, share_note } = req.body;
  if (!user_id || !mood) {
    return res.status(400).json({ error: "User ID and mood are required" });
  }
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let checkin = store.moods.find((m) => m.user_id === user_id && m.date === todayStr && m.coupleId === coupleId2);
  if (checkin) {
    checkin.mood = mood;
    checkin.note = note || "";
    checkin.share_note = !!share_note;
  } else {
    checkin = {
      id: "mood_" + Date.now(),
      user_id,
      mood,
      note: note || "",
      share_note: !!share_note,
      date: todayStr
    };
    store.moods.push(checkin);
  }
  logActivity(store, "mood", `\u2728 Sintonia do Amor: ${user_id} atualizou o humor para '${mood}'${note ? `: "${note}"` : ""}`, coupleId2);
  db.saveStore();
  res.json({ success: true, checkin });
});
app.post("/api/wishlist/create", (req, res) => {
  const { name, link, estimated_price, priority, is_private_to_partner, category, saving_goal, added_by } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: "Name and category are required" });
  }
  const store = db.getStore();
  const newItem = {
    id: "wish_" + Date.now(),
    name,
    link,
    estimated_price: estimated_price ? parseFloat(estimated_price) : void 0,
    priority: priority || "M\xE9dia",
    is_private_to_partner: !!is_private_to_partner,
    category,
    saving_goal: saving_goal ? parseFloat(saving_goal) : void 0,
    saving_saved: saving_goal ? 0 : void 0,
    added_by: added_by || "Ambos"
  };
  store.wishlist.push(newItem);
  db.saveStore();
  res.json({ success: true, item: newItem });
});
app.post("/api/wishlist/save", (req, res) => {
  const { id, amount } = req.body;
  const store = db.getStore();
  const item = store.wishlist.find((w) => w.id === id);
  if (!item || item.saving_goal === void 0) {
    return res.status(404).json({ error: "Wishlist cofrinho not found" });
  }
  const current = item.saving_saved || 0;
  item.saving_saved = Math.min(item.saving_goal, current + parseFloat(amount));
  db.saveStore();
  res.json({ success: true, item });
});
app.post("/api/recipes/create", (req, res) => {
  const { title, ingredients, instructions, duration, portions, couple_rating, tags, url } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Recipe title is required" });
  }
  const store = db.getStore();
  const newRecipe = {
    id: "rec_" + Date.now(),
    title,
    ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
    instructions: instructions || "",
    duration: duration ? parseInt(duration, 10) : 30,
    portions: portions ? parseInt(portions, 10) : 2,
    couple_rating: couple_rating || void 0,
    tags: tags || [],
    photo_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300"
  };
  store.recipes.push(newRecipe);
  db.saveStore();
  res.json({ success: true, recipe: newRecipe });
});
app.post("/api/recipes/import-url", (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }
  const store = db.getStore();
  const scrapeTitle = url.includes("panelinha") ? "Risoto de Ab\xF3bora Panelinha" : "Bolo Formiga Especial";
  const ingreds = url.includes("panelinha") ? ["Ab\xF3bora caboti\xE1 picada - 400g", "Arroz arb\xF3reo - 1.5 x\xEDcaras", "Parmes\xE3o ralado - 80g", "Cebola ralada", "Vinho branco seco - 100ml"] : ["Farinha de trigo - 2 x\xEDcaras", "Granulado de chocolate - 100g", "Ovos grandes - 3 unidades", "Manteiga amolecida - 100g", "Leite morno"];
  const newRecipe = {
    id: "rec_scraped_" + Date.now(),
    title: scrapeTitle,
    ingredients: ingreds,
    instructions: "1. Prepare o batedor ou panela conforme as instru\xE7\xF5es tradicionais.\n2. Incorpore os ingredientes em fogo brando.\n3. Misture devagar e sirva em por\xE7\xF5es generosas para o casal adorar.",
    duration: 35,
    portions: 4,
    couple_rating: "Favorita",
    tags: ["r\xE1pida", "econ\xF4mica"],
    photo_url: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&q=80&w=300"
  };
  store.recipes.push(newRecipe);
  db.saveStore();
  res.json({ success: true, recipe: newRecipe });
});
app.post("/api/recipes/rate", (req, res) => {
  const { id, rating } = req.body;
  const store = db.getStore();
  const recipe = store.recipes.find((r) => r.id === id);
  if (recipe) {
    recipe.couple_rating = rating;
    db.saveStore();
    res.json({ success: true, recipe });
  } else {
    res.status(404).json({ error: "Recipe not found" });
  }
});
app.post("/api/recipes/generate-shopping", (req, res) => {
  const { recipe_id, user_id } = req.body;
  const store = db.getStore();
  const recipe = store.recipes.find((r) => r.id === recipe_id);
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }
  const addedItems = [];
  recipe.ingredients.forEach((rawIng) => {
    const cleanName = rawIng.includes("-") ? rawIng.split("-")[0].trim() : rawIng.trim();
    const exists = store.shopping.some((s) => !s.is_bought && s.name.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
      store.shopping.push({
        id: "shop_rec_" + Date.now() + Math.random().toString(36).substring(3, 8),
        name: cleanName,
        category: "Outros" /* OUTROS */,
        quantity: 1,
        unit: "por\xE7\xE3o",
        is_bought: false,
        added_by: user_id || "Receitas"
      });
      addedItems.push(cleanName);
    }
  });
  db.saveStore();
  res.json({ success: true, added: addedItems, shopping: store.shopping });
});
app.post("/api/mealplan/update", (req, res) => {
  const { day, meal_type, recipe_id, custom_text } = req.body;
  const store = db.getStore();
  const slotId = `${day}-${meal_type}`;
  let slot = store.mealPlan.find((m) => m.id === slotId);
  if (slot) {
    slot.recipe_id = recipe_id || void 0;
    slot.custom_text = custom_text || void 0;
  } else {
    slot = {
      id: slotId,
      day,
      meal_type,
      recipe_id: recipe_id || void 0,
      custom_text: custom_text || void 0
    };
    store.mealPlan.push(slot);
  }
  db.saveStore();
  res.json({ success: true, slot });
});
app.post("/api/chat/comment", (req, res) => {
  const { scope_type, scope_id, text, sender_id } = req.body;
  const store = db.getStore();
  const comment = {
    id: "c_" + Date.now(),
    author_id: sender_id || "Leandro",
    text: text || "",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (scope_type === "task") {
    const task = store.tasks.find((t) => t.id === scope_id);
    if (task) task.comments.push(comment);
  } else if (scope_type === "event") {
    const event = store.events.find((e) => e.id === scope_id);
    if (event) event.comments.push(comment);
  } else if (scope_type === "shop") {
  }
  db.saveStore();
  res.json({ success: true, comment });
});
app.post("/api/gemini/insights", (req, res) => {
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const client = getAiClient();
  const store = db.getStore();
  const { couple, users } = getCoupleAndUsers(store, coupleId2);
  const p1Name = users.Leandro?.name || "Leandro";
  const p2Name = users.Kaisa?.name || "Kaisa";
  const incompleteTasks = (store.tasks || []).filter((t) => t.coupleId === coupleId2 && !t.completed).map((t) => `${t.title} (${t.responsible_id})`).join(", ");
  const recentMoods = (store.moods || []).filter((m) => m.coupleId === coupleId2).slice(-6).map((m) => `${m.user_id}: ${m.mood} (${m.note || "Sem nota"})`).join(", ");
  const coupleStats = `N\xEDvel do Lar: ${couple.home_level}, Total Pontos: ${couple.total_points}. Pontos ${p1Name}: ${users.Leandro?.points_weekly || 0}, Pontos ${p2Name}: ${users.Kaisa?.points_weekly || 0}`;
  const prompt = `Atue como o assistente emocional "IA Afetiva" do aplicativo de casal N\xF3sDois.
  Analise os dados atuais do lar e d\xEA um feedback carinhoso, emp\xE1tico e sutil de at\xE9 3 frases em Portugu\xEAs do Brasil para apoiar o casal (${p1Name} e ${p2Name}).
  
  Dados Atuais:
  - Estat\xEDsticas: ${coupleStats}
  - Tarefas pendentes: ${incompleteTasks || "Nenhuma! Incr\xEDvel."}
  - Humores recentes: ${recentMoods || "Ainda sem check-ins hoje."}
  
  Importante:
  - Seja caloroso, rom\xE2ntico e apoiador.
  - Fa\xE7a coment\xE1rios que gerem uni\xE3o, reduzam o estresse Invis\xEDvel da rotina, ou sugiram carinho m\xFAtuo.
  - Se os dois estiverem cansados, ative conselhos reconfortantes (modo acolhedor).
  - Use o nome de ambos ${p1Name} e ${p2Name} de forma carinhosa ou seus apelidos ("Moz\xE3o" e "Meu Amor").
  - Retorne um par\xE1grafo conciso em formato de texto simples. Sem jarg\xF5es t\xE9cnicos.`;
  if (!client) {
    const fallbackAnswers = [
      `${p1Name} e ${p2Name}, voc\xEAs est\xE3o indo muito bem nesta semana! Que tal prepararem uma das suas receitas favoritas hoje e relaxarem juntinhos no sof\xE1? Um abra\xE7o forte cuida de qualquer cansa\xE7o. \u{1F49C}`,
      `Percebi que a rotina est\xE1 um pouco cheia hoje. Meu Amor ${p1Name} e Moz\xE3o ${p2Name}, lembrem-se de respirar fundo e dividir o peso das tarefas. Uma noite tranquila com fondue pode ser maravilhoso para voc\xEAs!`,
      `Parab\xE9ns pelo progresso no N\xEDvel do Lar! Cada pequena tarefa conclu\xEDda \xE9 um carinho com o outro. Aproveitem a noite de hoje livre de lou\xE7as para assistirem algo engra\xE7ado juntos.`
    ];
    return res.json({ insight: fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)] });
  }
  client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt
  }).then((response) => {
    res.json({ insight: response.text });
  }).catch((err) => {
    console.error("Gemini Insight Call failed:", err);
    res.json({
      insight: `${p1Name} e ${p2Name}, lembrem-se de respirar fundo e dividir o peso das tarefas cotidianas. Voc\xEAs s\xE3o uma \xF3tima dupla! Que tal uma noite de cafun\xE9 e descanso? \u{1F49C}`
    });
  });
});
app.post("/api/tasks/update", (req, res) => {
  const { id, title, description, responsible_id, due_date, recurrence, category, priority, time_estimate } = req.body;
  const store = db.getStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  if (title) task.title = title.slice(0, 80);
  if (description !== void 0) task.description = description.slice(0, 500);
  if (responsible_id) task.responsible_id = responsible_id;
  if (due_date !== void 0) task.due_date = due_date || void 0;
  if (recurrence) task.recurrence = recurrence;
  if (category) task.category = category;
  if (priority) {
    task.priority = priority;
    task.points = priority === "Urgente" /* URGENTE */ ? 25 : 10;
  }
  if (time_estimate !== void 0) task.time_estimate = time_estimate ? parseInt(time_estimate, 10) : void 0;
  db.saveStore();
  res.json({ success: true, task });
});
app.post("/api/tasks/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const initialLen = store.tasks.length;
  store.tasks = store.tasks.filter((t) => t.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.tasks.length });
});
app.post("/api/events/update", (req, res) => {
  const { id, title, description, type, start_time, end_time, location, booking_link, responsible_id } = req.body;
  const store = db.getStore();
  const event = store.events.find((e) => e.id === id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  if (title) event.title = title;
  if (description !== void 0) event.description = description;
  if (type) event.type = type;
  if (start_time) event.start_time = start_time;
  if (end_time !== void 0) event.end_time = end_time || void 0;
  if (location !== void 0) event.location = location || void 0;
  if (booking_link !== void 0) event.booking_link = booking_link || void 0;
  if (responsible_id) event.responsible_id = responsible_id;
  db.saveStore();
  res.json({ success: true, event });
});
app.post("/api/events/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const initialLen = store.events.length;
  store.events = store.events.filter((e) => e.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.events.length });
});
app.post("/api/memories/update", (req, res) => {
  const { id, description, date, location, album_name, is_capsule, capsule_unlock_date } = req.body;
  const store = db.getStore();
  const memory = store.memories.find((m) => m.id === id);
  if (!memory) {
    return res.status(404).json({ error: "Memory not found" });
  }
  if (description !== void 0) memory.description = description;
  if (date !== void 0) memory.date = date;
  if (location !== void 0) memory.location = location;
  if (album_name !== void 0) memory.album_name = album_name;
  if (is_capsule !== void 0) memory.is_capsule = !!is_capsule;
  if (capsule_unlock_date !== void 0) memory.capsule_unlock_date = capsule_unlock_date || void 0;
  db.saveStore();
  res.json({ success: true, memory });
});
app.post("/api/memories/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const initialLen = store.memories.length;
  store.memories = store.memories.filter((m) => m.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.memories.length });
});
app.post("/api/wishlist/update", (req, res) => {
  const { id, name, link, estimated_price, priority, is_private_to_partner, category, saving_goal } = req.body;
  const store = db.getStore();
  const wishlist = store.wishlist.find((w) => w.id === id);
  if (!wishlist) {
    return res.status(404).json({ error: "Wishlist item not found" });
  }
  if (name) wishlist.name = name;
  if (link !== void 0) wishlist.link = link;
  if (estimated_price !== void 0) wishlist.estimated_price = estimated_price ? parseFloat(estimated_price) : void 0;
  if (priority) wishlist.priority = priority;
  if (is_private_to_partner !== void 0) wishlist.is_private_to_partner = !!is_private_to_partner;
  if (category) wishlist.category = category;
  if (saving_goal !== void 0) {
    wishlist.saving_goal = saving_goal ? parseFloat(saving_goal) : void 0;
    if (saving_goal && wishlist.saving_saved === void 0) {
      wishlist.saving_saved = 0;
    }
  }
  db.saveStore();
  res.json({ success: true, item: wishlist });
});
app.post("/api/wishlist/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const initialLen = store.wishlist.length;
  store.wishlist = store.wishlist.filter((w) => w.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.wishlist.length });
});
app.post("/api/recipes/update", (req, res) => {
  const { id, title, ingredients, instructions, duration, portions, couple_rating, tags, photo_url } = req.body;
  const store = db.getStore();
  const recipe = store.recipes.find((r) => r.id === id);
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }
  if (title) recipe.title = title;
  if (ingredients !== void 0) recipe.ingredients = Array.isArray(ingredients) ? ingredients : [ingredients];
  if (instructions !== void 0) recipe.instructions = instructions;
  if (duration !== void 0) recipe.duration = duration ? parseInt(duration, 10) : 30;
  if (portions !== void 0) recipe.portions = portions ? parseInt(portions, 10) : 2;
  if (couple_rating !== void 0) recipe.couple_rating = couple_rating || void 0;
  if (tags !== void 0) recipe.tags = tags || [];
  if (photo_url !== void 0) recipe.photo_url = photo_url;
  db.saveStore();
  res.json({ success: true, recipe });
});
app.post("/api/recipes/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const initialLen = store.recipes.length;
  store.recipes = store.recipes.filter((r) => r.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.recipes.length });
});
app.post("/api/pets/create", (req, res) => {
  const { name, species, breed, age, avatar_url, food_daily_qty, food_inventory_item_id } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Pet name is required" });
  }
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.pets) store.pets = [];
  const newPet = {
    id: "pet_" + Date.now(),
    name,
    species: species || "Outros",
    breed: breed || "",
    age: age ? parseInt(age, 10) : void 0,
    avatar_url: avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300",
    vaccines: [],
    medications: [],
    weights: [],
    documents: [],
    food_daily_qty: food_daily_qty ? parseInt(food_daily_qty, 10) : void 0,
    food_inventory_item_id: food_inventory_item_id || void 0
  };
  store.pets.push(newPet);
  logActivity(store, "pet_added", `Novo pet registrado no lar: ${name}! \u{1F43E}`, coupleId2);
  db.saveStore();
  res.json({ success: true, pet: newPet });
});
app.post("/api/pets/update", (req, res) => {
  const { id, name, species, breed, age, avatar_url, vaccines, medications, weights, documents, food_daily_qty, food_inventory_item_id } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.pets) store.pets = [];
  const pet = store.pets.find((p) => p.id === id);
  if (!pet) {
    return res.status(404).json({ error: "Pet not found" });
  }
  if (name) pet.name = name;
  if (species !== void 0) pet.species = species;
  if (breed !== void 0) pet.breed = breed;
  if (age !== void 0) pet.age = age ? parseInt(age, 10) : void 0;
  if (avatar_url !== void 0) pet.avatar_url = avatar_url;
  if (vaccines !== void 0) pet.vaccines = vaccines;
  if (medications !== void 0) pet.medications = medications;
  if (weights !== void 0) pet.weights = weights;
  if (documents !== void 0) pet.documents = documents;
  if (food_daily_qty !== void 0) pet.food_daily_qty = food_daily_qty ? parseInt(food_daily_qty, 10) : void 0;
  if (food_inventory_item_id !== void 0) pet.food_inventory_item_id = food_inventory_item_id;
  if (pet.food_inventory_item_id) {
    const invItem = store.inventory.find((i) => i.id === pet.food_inventory_item_id);
    if (invItem && invItem.quantity < invItem.min_quantity) {
      const today = /* @__PURE__ */ new Date();
      const currentMonthId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const lowercaseName = invItem.name.trim().toLowerCase();
      const exists = store.shopping.find(
        (s) => !s.is_bought && s.monthId === currentMonthId && s.name.trim().toLowerCase() === lowercaseName
      );
      if (!exists) {
        const newShopItem = {
          id: "shop_inv_" + Date.now(),
          name: invItem.name,
          category: "Outros" /* OUTROS */,
          quantity: Math.max(1, Math.ceil(invItem.min_quantity - invItem.quantity)),
          unit: invItem.unit,
          price: 0,
          is_bought: false,
          added_by: "Fome do Pet (" + pet.name + ")",
          monthId: currentMonthId,
          coupleId: pet.coupleId
        };
        store.shopping.push(newShopItem);
        logActivity(store, "pet_food_low", `Ra\xE7\xE3o de '${pet.name}' acabando (${invItem.quantity} ${invItem.unit}). Item adicionado \xE0s compras!`, coupleId2);
      }
    }
  }
  db.saveStore();
  res.json({ success: true, pet });
});
app.post("/api/pets/delete", (req, res) => {
  const { id } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.pets) store.pets = [];
  const pet = store.pets.find((p) => p.id === id);
  if (pet) {
    store.pets = store.pets.filter((p) => p.id !== id);
    logActivity(store, "pet_deleted", `Pet removido do lar: ${pet.name}`, coupleId2);
    db.saveStore();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Pet not found" });
  }
});
app.post("/api/budget/set", (req, res) => {
  const { category, limit } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple } = getCoupleAndUsers(store, coupleId2);
  if (!couple.expenseBudgets) {
    couple.expenseBudgets = {};
  }
  couple.expenseBudgets[category] = parseFloat(limit);
  db.saveStore();
  res.json({ success: true, budgets: couple.expenseBudgets });
});
app.post("/api/tasks/transfer", (req, res) => {
  const { id, to_user_id, note } = req.body;
  const { userId } = getRequestCredentials(req);
  const store = db.getStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  task.transferred_from = task.responsible_id;
  task.responsible_id = to_user_id;
  if (note) {
    task.transfer_note = note;
    task.comments.push({
      id: "comment_" + Date.now(),
      author_id: userId,
      text: `\u{1F504} Transferida de ${task.transferred_from}: "${note}"`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  logActivity(store, "task_transferred", `${userId} transferiu tarefa "${task.title}" para ${to_user_id}`, coupleId);
  db.saveStore();
  res.json({ success: true, task });
});
app.post("/api/fixed-functions/create", (req, res) => {
  const { title, responsible_id, frequency, category, rotation_enabled } = req.body;
  if (!title || !responsible_id || !frequency) {
    return res.status(400).json({ error: "Title, responsible and frequency are required" });
  }
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.fixedFunctions) store.fixedFunctions = [];
  const newFunction = {
    id: "func_" + Date.now(),
    title,
    responsible_id,
    frequency,
    category: category || "Outro" /* OUTRO */,
    rotation_enabled: !!rotation_enabled,
    current_rotation_owner: responsible_id,
    completion_history: [],
    active: true
  };
  store.fixedFunctions.push(newFunction);
  logActivity(store, "function_created", `Nova rotina fixa: ${title} (${frequency})`, coupleId2);
  db.saveStore();
  res.json({ success: true, func: newFunction });
});
app.post("/api/fixed-functions/toggle-complete", (req, res) => {
  const { id, user_id } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.fixedFunctions) store.fixedFunctions = [];
  const func = store.fixedFunctions.find((f) => f.id === id);
  if (!func) {
    return res.status(404).json({ error: "Function not found" });
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const alreadyCompletedToday = func.completion_history.some((h) => h.date === today);
  if (alreadyCompletedToday) {
    func.completion_history = func.completion_history.filter((h) => h.date !== today);
  } else {
    func.completion_history.push({ date: today, completed_by: user_id });
    if (func.rotation_enabled) {
      const otherUser = func.current_rotation_owner === "Leandro" ? "Kaisa" : "Leandro";
      func.current_rotation_owner = otherUser;
      logActivity(store, "function_rotated", `${func.title} agora \xE9 responsabilidade de ${otherUser}`, coupleId2);
    }
  }
  db.saveStore();
  res.json({ success: true, func });
});
app.post("/api/fixed-functions/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  if (!store.fixedFunctions) store.fixedFunctions = [];
  store.fixedFunctions = store.fixedFunctions.filter((f) => f.id !== id);
  db.saveStore();
  res.json({ success: true });
});
app.post("/api/reactions/add", (req, res) => {
  const { activity_id, emoji } = req.body;
  const { coupleId: coupleId2, userId } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.activityReactions) store.activityReactions = [];
  const existing = store.activityReactions.find(
    (r) => r.activity_id === activity_id && r.user_id === userId
  );
  if (existing) {
    existing.emoji = emoji;
    existing.timestamp = (/* @__PURE__ */ new Date()).toISOString();
  } else {
    const reaction = {
      id: "react_" + Date.now(),
      activity_id,
      user_id: userId,
      emoji,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.activityReactions.push(reaction);
  }
  db.saveStore();
  res.json({ success: true });
});
app.post("/api/reactions/remove", (req, res) => {
  const { activity_id } = req.body;
  const { userId } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.activityReactions) store.activityReactions = [];
  store.activityReactions = store.activityReactions.filter(
    (r) => !(r.activity_id === activity_id && r.user_id === userId)
  );
  db.saveStore();
  res.json({ success: true });
});
app.post("/api/monthly-accounts/create", (req, res) => {
  const { name, value, due_day, paid_by_id, category } = req.body;
  if (!name || !value || !due_day) {
    return res.status(400).json({ error: "Name, value and due_day are required" });
  }
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.monthlyAccounts) store.monthlyAccounts = [];
  const exists = store.monthlyAccounts.some((a) => a.coupleId === coupleId2 && a.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return res.json({ warning: "Conta j\xE1 existe" });
  }
  const newAccount = {
    id: "acc_" + Date.now(),
    name,
    value: parseFloat(value),
    due_day: parseInt(due_day, 10),
    paid_by_id: paid_by_id || "Ambos",
    category: category || "Moradia",
    paid_this_month: false,
    payment_history: []
  };
  store.monthlyAccounts.push(newAccount);
  logActivity(store, "account_added", `Conta fixa adicionada: ${name} - R$ ${value}`, coupleId2);
  db.saveStore();
  res.json({ success: true, account: newAccount });
});
app.post("/api/monthly-accounts/toggle-paid", (req, res) => {
  const { id } = req.body;
  const { coupleId: coupleId2 } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.monthlyAccounts) store.monthlyAccounts = [];
  const account = store.monthlyAccounts.find((a) => a.id === id);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  account.paid_this_month = !account.paid_this_month;
  if (account.paid_this_month) {
    account.paid_month = currentMonth;
    if (!account.payment_history) account.payment_history = [];
    account.payment_history.push({ month: currentMonth, paid: true });
    logActivity(store, "account_paid", `Conta "${account.name}" paga!`, coupleId2);
  }
  db.saveStore();
  res.json({ success: true, account });
});
app.post("/api/monthly-accounts/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  if (!store.monthlyAccounts) store.monthlyAccounts = [];
  store.monthlyAccounts = store.monthlyAccounts.filter((a) => a.id !== id);
  db.saveStore();
  res.json({ success: true });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting backend dev server and injecting Vite client-side SPA bundle...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`N\xF3sDois Server running successfully on http://0.0.0.0:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
