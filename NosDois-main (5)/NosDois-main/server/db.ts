import fs from "fs";
import path from "path";
import {
  User,
  Couple,
  Task,
  Event,
  ShoppingItem,
  Expense,
  Memory,
  MoodCheckIn,
  WishlistItem,
  Recipe,
  MealPlan,
  InventoryItem,
  TaskCategory,
  TaskPriority,
  EventType,
  ShoppingCategory,
  ExpenseCategory,
  MoodType,
  WishlistCategory,
  Reward,
  Quest,
  QuickNote,
  Pet,
  FixedFunction,
  ActivityReaction,
  MonthlyAccount
} from "../src/types";;

// DB Path
const DB_FILE = path.join(process.cwd(), "nosdois_db.json");

interface DatabaseSchema {
  users: { [key: string]: User };
  couple: Couple;
  couples?: { [key: string]: Couple };
  couplesUsers?: { [key: string]: { [userId: string]: User } };
  accounts?: { email: string; passwordHash: string; userId: string; coupleId: string }[];
  tasks: Task[];
  events: Event[];
  shopping: ShoppingItem[];
  expenses: Expense[];
  memories: Memory[];
  moods: MoodCheckIn[];
  wishlist: WishlistItem[];
  recipes: Recipe[];
  mealPlan: MealPlan[];
  inventory: InventoryItem[];
  rewards: Reward[];
  quests: Quest[];
  quickNotes: QuickNote[];
  pets?: Pet[];
  fixedFunctions?: FixedFunction[];
  activityReactions?: ActivityReaction[];
  monthlyAccounts?: MonthlyAccount[];
}

const DEFAULT_USERS: { [key: string]: User } = {
  Leandro: {
    id: "Leandro",
    name: "Leandro",
    partner_nickname: "Mozão",
    color: "#3B82F6", // Blue
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    points_weekly: 40
  },
  Kaisa: {
    id: "Kaisa",
    name: "Kaisa",
    partner_nickname: "Meu Amor",
    color: "#EC4899", // Pink
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    points_weekly: 55
  }
};

const DEFAULT_COUPLE: Couple = {
  id: "couple_1",
  invite_code: "AMOR42",
  connected: true,
  home_level: 4,
  total_points: 380,
  unlocked_achievements: ["7-days-no-dishes", "first-trip-album"]
};

// Seed realistic tasks
const DEFAULT_TASKS: Task[] = [
  {
    id: "task_1",
    title: "Lavar a louça do jantar",
    description: "Lavar pratos, panelas e limpar a pia para manter a cozinha cheirosa.",
    responsible_id: "Leandro",
    category: TaskCategory.COZINHA,
    priority: TaskPriority.NORMAL,
    due_date: new Date().toISOString().split("T")[0],
    recurrence: "Diária",
    time_estimate: 20,
    points: 10,
    completed: false,
    archived: false,
    comments: [
      { id: "c1", author_id: "Kaisa", text: "Amor, não se esquece de colocar o escorredor no lugar 💜", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: "c2", author_id: "Leandro", text: "Pode deixar, vou fazer isso já já!", timestamp: new Date(Date.now() - 1800000).toISOString() }
    ]
  },
  {
    id: "task_2",
    title: "Dar banho no Luke (Pet)",
    description: "Dar banho, secar bem com toalha e aplicar o spray de cheiro agradável.",
    responsible_id: "Kaisa",
    category: TaskCategory.PET,
    priority: TaskPriority.URGENTE,
    due_date: new Date().toISOString().split("T")[0],
    recurrence: "Semanal",
    time_estimate: 45,
    points: 25,
    completed: true,
    completed_at: new Date(Date.now() - 86400000).toISOString(),
    archived: false,
    comments: [
      { id: "c3", author_id: "Kaisa", text: "Ficou muito cheiroso!", timestamp: new Date(Date.now() - 80000000).toISOString() }
    ]
  },
  {
    id: "task_3",
    title: "Passar pano na sala e quarto",
    description: "Varrer primeiro, depois passar pano úmido com desinfetante lavanda.",
    responsible_id: "Ambos",
    category: TaskCategory.SALA,
    priority: TaskPriority.NORMAL,
    due_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    recurrence: "Semanal",
    time_estimate: 30,
    points: 15,
    completed: false,
    archived: false,
    comments: []
  },
  {
    id: "task_4",
    title: "Trocar lâmpada do banheiro social",
    description: "Comprar lâmpada LED branca de rosca comum e instalar.",
    responsible_id: "Leandro",
    category: TaskCategory.BANHEIRO,
    priority: TaskPriority.BAIXA,
    due_date: new Date(Date.now() + 259200000).toISOString().split("T")[0],
    recurrence: "Nenhuma",
    time_estimate: 10,
    points: 10,
    completed: false,
    archived: false,
    comments: []
  }
];

// Seed realistic events
const DEFAULT_EVENTS: Event[] = [
  {
    id: "event_1",
    title: "Aniversário de Casamento (Celebração)",
    description: "Nosso dia especial! Jantar romântico reservado no restaurante Vista Rooftop.",
    type: EventType.DATA_ESPECIAL,
    start_time: `${new Date().getFullYear()}-06-12T20:00:00`,
    end_time: `${new Date().getFullYear()}-06-12T23:30:00`,
    location: "Restaurante Vista Rooftop",
    booking_link: "https://example.com/reserva-vista",
    responsible_id: "Ambos",
    comments: []
  },
  {
    id: "event_2",
    title: "Viagem de Fim de Semana para Campos do Jordão",
    description: "Mini-férias no frio! Cobertores, fondue e caminhadas ao ar livre.",
    type: EventType.VIAGEM,
    start_time: `${new Date().getFullYear()}-07-15T08:00:00`,
    end_time: `${new Date().getFullYear()}-07-17T18:00:00`,
    location: "Chale Bosque Feliz, Campos do Jordão",
    travel_checklist: [
      { item: "Casacos pesados", checked: true },
      { item: "Estojo de remédios", checked: false },
      { item: "Garrafa térmica de café", checked: true },
      { item: "Carregadores e câmera", checked: false }
    ],
    responsible_id: "Ambos",
    comments: [
      { id: "ec1", author_id: "Leandro", text: "Já abasteci o carro!", timestamp: new Date().toISOString() }
    ]
  },
  {
    id: "event_3",
    title: "Consulta Médica da Kaisa",
    description: "Exames de rotina periódicos.",
    type: EventType.INDIVIDUAL,
    start_time: `${new Date().getFullYear()}-06-05T14:30:00`,
    responsible_id: "Kaisa",
    comments: []
  }
];

// Seed shopping items
const DEFAULT_SHOPPING: ShoppingItem[] = [
  { id: "shop_1", name: "Tomate italiano", category: ShoppingCategory.HORTIFRUTI, quantity: 1, unit: "kg", price: 8.50, is_bought: false, added_by: "Kaisa" },
  { id: "shop_2", name: "Leite Integral Sem Lactose", category: ShoppingCategory.LATICINIOS, quantity: 4, unit: "caixas", price: 5.20, is_bought: false, added_by: "Leandro" },
  { id: "shop_3", name: "Alcatra bovina", category: ShoppingCategory.CARNES, quantity: 1.2, unit: "kg", price: 42.00, is_bought: true, bought_at: new Date(Date.now() - 400000).toISOString(), added_by: "Leandro" },
  { id: "shop_4", name: "Detergente de Maçã", category: ShoppingCategory.LIMPEZA, quantity: 2, unit: "unidades", price: 2.80, is_bought: false, added_by: "Kaisa" },
  { id: "shop_5", name: "Papel higiênico folha dupla", category: ShoppingCategory.HIGIENE, quantity: 1, unit: "pacote (12 un)", price: 18.90, is_bought: false, added_by: "Kaisa" }
];

// Seed expenses
const DEFAULT_EXPENSES: Expense[] = [
  { id: "exp_1", value: 350.00, currency: "R$", description: "Supermercado Semanal (Pão de Açúcar)", paid_by_id: "Leandro", split_type: "50/50", category: ExpenseCategory.ALIMENTACAO, date: new Date().toISOString().split("T")[0], is_recurring: false },
  { id: "exp_2", value: 1200.00, currency: "R$", description: "Aluguel & Condomínio", paid_by_id: "Kaisa", split_type: "50/50", category: ExpenseCategory.MORADIA, date: new Date(Date.now() - 4 * 24 * 3600000).toISOString().split("T")[0], is_recurring: true },
  { id: "exp_3", value: 85.00, currency: "R$", description: "Remédios Higiene Pet Shop (Luke)", paid_by_id: "Kaisa", split_type: "custom", custom_percent: 60, category: ExpenseCategory.PETS, date: new Date(Date.now() - 2 * 24 * 3600000).toISOString().split("T")[0], is_recurring: false },
  { id: "exp_4", value: 160.00, currency: "R$", description: "Cinema e Pipoca (Divertidamente)", paid_by_id: "Leandro", split_type: "paid_all", category: ExpenseCategory.LAZER, date: new Date(Date.now() - 5 * 24 * 3600000).toISOString().split("T")[0], is_recurring: false }
];

// Seed album memories
const DEFAULT_MEMORIES: Memory[] = [
  {
    id: "mem_1",
    url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600",
    description: "Nossos sorrisos congelados na primeira que fomos à praia juntos!",
    date: `${new Date().getFullYear() - 1}-01-10`,
    location: "Ubatuba, SP",
    album_name: "Praia e Verão",
    created_at: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "mem_2",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600",
    description: "O dia que pegamos as chaves do nosso cantinho. Choro e emoção!",
    date: `${new Date().getFullYear()}-03-15`,
    location: "São Paulo, SP",
    album_name: "Nosso Apartamento",
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "mem_3",
    url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
    description: "Luke dormindo com a língua pra fora, não aguentamos e tivemos que tirar foto.",
    date: new Date().toISOString().split("T")[0],
    location: "Em casa",
    album_name: "Adorável Luke",
    created_at: new Date().toISOString()
  }
];

// Seed moods
const DEFAULT_MOODS: MoodCheckIn[] = [
  { id: "mood_1", user_id: "Leandro", mood: MoodType.OTIMO, note: "Reunião de sprint deu super certo hoje!", share_note: true, date: new Date().toISOString().split("T")[0] },
  { id: "mood_2", user_id: "Kaisa", mood: MoodType.BEM, note: "Rotina corrida mas tudo sob controle", share_note: false, date: new Date().toISOString().split("T")[0] },
  { id: "mood_prev_1", user_id: "Leandro", mood: MoodType.BEM, date: new Date(Date.now() - 86400000).toISOString().split("T")[0], share_note: false },
  { id: "mood_prev_2", user_id: "Kaisa", mood: MoodType.CANSADO, note: "Faculdade cansativa demais", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], share_note: true },
  { id: "mood_prev_3", user_id: "Leandro", mood: MoodType.ANSIOSO, date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], share_note: false },
  { id: "mood_prev_4", user_id: "Kaisa", mood: MoodType.OTIMO, date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], share_note: false }
];

// Seed wishlists
const DEFAULT_WISHLIST: WishlistItem[] = [
  { id: "wish_1", name: "Smart TV 4K 55 Polegadas", priority: "Alta", category: WishlistCategory.LAR, link: "https://example.com/tv", estimated_price: 2500, added_by: "Kaisa", saving_goal: 2500, saving_saved: 1200 },
  { id: "wish_2", name: "Anel de Prata Minimalista", priority: "Média", category: WishlistCategory.PESSOAL, link: "https://example.com/ring", estimated_price: 180, is_private_to_partner: true, added_by: "Leandro" }, // Surprise to Kaisa
  { id: "wish_3", name: "Máquina de Café Espresso Exclusiva", priority: "Média", category: WishlistCategory.LAR, estimated_price: 950, added_by: "Leandro", saving_goal: 950, saving_saved: 300 },
  { id: "wish_4", name: "Passagem de balão em Boituva", priority: "Alta", category: WishlistCategory.EXPERIENCIA, estimated_price: 800, added_by: "Ambos", saving_goal: 800, saving_saved: 800 } // fully funded!
];

// Seed recipes
const DEFAULT_RECIPES: Recipe[] = [
  {
    id: "rec_1",
    title: "Macarrão Cremoso de Manjericão",
    ingredients: ["Macarrão Penne - 300g", "Molho de tomate - 1 lata", "Manjericão fresco - 1 punhado", "Creme de leite - 1 caixinha", "Alho amassado - 2 dentes", "Azeite de oliva"],
    instructions: "1. Cozinhe o penne em água salgada até ficar al dente.\n2. Refogue o alho no azeite, adicione o molho de tomate e manjericão, cozinhe por 5 min.\n3. Misture o creme de leite no molho em fogo baixo.\n4. Escorra a massa e envolva-a completamente no creme aromático. Sirva quente com queijo ralado.",
    duration: 20,
    portions: 2,
    couple_rating: "Favorita",
    tags: ["rápida", "econômica", "vegetariana"]
  },
  {
    id: "rec_2",
    title: "Escondidinho de Carne Seca",
    ingredients: ["Mandioca cozida - 1kg", "Carne seca desfiada dessalgada - 500g", "Cebola picada - 1 un", "Manteiga - 2 colheres", "Leite integral - 1 xícara", "Queijo coalho ralado - 150g"],
    instructions: "1. Amasse a mandioca quente com manteiga e leite até virar um purê homogêneo.\n2. Refogue a carne seca com cebola até dourar.\n3. Num refratário, faça uma camada de carne, cubra com o purê de mandioca e polvilhe o queijo coalho.\n4. Leve ao forno para gratinar por 20 minutos a 200°C.",
    duration: 50,
    portions: 3,
    couple_rating: "Gostamos",
    tags: ["especial"]
  }
];

// Seed meal plans
const DEFAULT_MEAL_PLAN: MealPlan[] = [
  { id: "Segunda-Café", day: "Segunda", meal_type: "Café", custom_text: "Mamão, ovos mexidos e café puro" },
  { id: "Segunda-Almoço", day: "Segunda", meal_type: "Almoço", recipe_id: "rec_1" }, // penne
  { id: "Segunda-Jantar", day: "Segunda", meal_type: "Jantar", custom_text: "Sopa leve de legumes e torrada" },
  { id: "Quarta-Jantar", day: "Quarta", meal_type: "Jantar", recipe_id: "rec_2" }, // escondidinho
];

// Seed inventory
const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "inv_1", name: "Arroz agulhinha", quantity: 2, unit: "kg", min_quantity: 1 },
  { id: "inv_2", name: "Café Gourmet moído", quantity: 0.5, unit: "kg", min_quantity: 0.5 },
  { id: "inv_3", name: "Açúcar demerara", quantity: 0.2, unit: "kg", min_quantity: 0.5 }, // low stock! Should auto sug
  { id: "inv_4", name: "Sabonete líquido corpo", quantity: 1, unit: "unidade", min_quantity: 2 }, // low stock! Should auto sug
  { id: "inv_5", name: "Detergente de Maçã", quantity: 1, unit: "unidade", min_quantity: 1 }
];

const DEFAULT_REWARDS: Reward[] = [
  { id: "feet_massage", title: "Massagem nos Pés de 30min", cost: 65, desc: "Mozão massageia seus pés após um dia tenso de rotina.", emoji: "💆‍♂️" },
  { id: "breakfast_bed", title: "Café da Manhã na Cama", cost: 95, desc: "Servido com torrada, café quentinho e beijinhos de bom dia.", emoji: "☕" },
  { id: "movie_choice", title: "Escolha Soberana do Filme", cost: 35, desc: "Decide o filme de hoje sem receber reclamações do parceiro.", emoji: "🎬" },
  { id: "no_dishes", title: "Folga da Louça por 1 Dia", cost: 50, desc: "Isenção integral de lavar louça de qualquer refeição do dia.", emoji: "🧼" },
  { id: "dream_dessert", title: "Sobremesa Especial do Amor", cost: 75, desc: "Mozão prepara ou compra o doce ou bolo que você pedir.", emoji: "🍰" },
  { id: "full_massage", title: "Massageador nos Ombros & Costas", cost: 120, desc: "Sessão caprichada com óleos relaxantes e silêncio absoluto.", emoji: "🕯️" }
];

const DEFAULT_QUESTS: Quest[] = [
  { id: "quest_1", title: "Guardiões da Faxina", description: "Concluir 3 tarefas de limpeza no painel.", points: 20, type: "Faxina", target_count: 3, current_count: 0, completed: false },
  { id: "quest_2", title: "Dupla Harmonia", description: "Ambos fazerem o check-in de humor de hoje.", points: 15, type: "Afeto", target_count: 2, current_count: 0, completed: false },
  { id: "quest_3", title: "Menu NósDois", description: "Registrar receitas especiais e favoritas.", points: 25, type: "Culinária", target_count: 1, current_count: 0, completed: false }
];

export class DBStore {
  private data!: DatabaseSchema;

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        
        // Dynamic additions for backward compatibility
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

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing database file", err);
    }
  }

  public resetToDefaults() {
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
  public getStore(): DatabaseSchema {
    return this.data;
  }

  public saveStore() {
    this.save();
  }
}

export const db = new DBStore();
