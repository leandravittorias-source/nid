import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db";
import { GoogleGenAI } from "@google/genai";
import {
  Task,
  TaskCategory,
  TaskPriority,
  EventType,
  ShoppingCategory,
  ExpenseCategory,
  MoodType,
  WishlistCategory,
  ShoppingItem,
  Expense,
  Memory,
  WishlistItem,
  Recipe,
  Event,
  Reward,
  Quest,
  Pet,
  StoreType,
  FixedFunction,
  ActivityReaction
} from "./src/types";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Parsers
app.use(express.json({ limit: "20mb" }));

// Custom simple CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Helper to extract coupleId and userId from the request
function getRequestCredentials(req: express.Request) {
  const coupleId = req.headers["x-couple-id"] || req.query.coupleId || req.body.coupleId;
  const userId = req.headers["x-user-id"] || req.query.userId || req.body.userId;
  return {
    coupleId: typeof coupleId === "string" ? coupleId : "couple_1",
    userId: typeof userId === "string" ? userId : "Leandro"
  };
}

// Middleware to automatically capture coupleId on pushed items
app.use((req, res, next) => {
  const { coupleId } = getRequestCredentials(req);
  const store = db.getStore();
  
  const listsToScope = [
    "tasks", "events", "shopping", "expenses", "memories", "moods",
    "wishlist", "recipes", "mealPlan", "inventory", "rewards", "quests", "quickNotes", "pets",
    "fixedFunctions", "activityReactions", "monthlyAccounts"
  ];
  
  listsToScope.forEach(key => {
    const list = (store as any)[key];
    if (list && Array.isArray(list)) {
      // Overwrite push to intercept and inject coupleId
      (list as any).push = function(...items: any[]) {
        items.forEach(item => {
          if (item && typeof item === "object") {
            item.coupleId = coupleId;
          }
        });
        return Array.prototype.push.apply(this, items);
      };
    }
  });
  
  next();
});

// Lazy client for Google Gen AI
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI:", err);
      }
    }
  }
  return aiClient;
}

// ==========================================
// API REST ENDPOINTS
// ==========================================

// ==========================================
// HELPERS FOR MULTI-TENANCY & AUTHENTICATION
// ==========================================

function getCoupleAndUsers(store: any, coupleId: string) {
  if (!store.couples) {
    store.couples = {};
  }
  if (!store.couples[coupleId]) {
    store.couples[coupleId] = {
      id: coupleId,
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
  if (!store.couplesUsers[coupleId]) {
    store.couplesUsers[coupleId] = {
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
    couple: store.couples[coupleId],
    users: store.couplesUsers[coupleId]
  };
}

function logActivityForCouple(store: any, coupleId: string, prefix: string, message: string) {
  const { couple } = getCoupleAndUsers(store, coupleId);
  if (!couple.unlocked_achievements) {
    couple.unlocked_achievements = [];
  }
  const timestamp = new Date().toISOString();
  couple.unlocked_achievements.push(`activity:${prefix}:${message}:${timestamp}`);
  
  const nonActivities = couple.unlocked_achievements.filter((a: string) => !a.startsWith("activity:"));
  const activities = couple.unlocked_achievements.filter((a: string) => a.startsWith("activity:"));
  couple.unlocked_achievements = [...nonActivities, ...activities.slice(-40)];
}

function generateInviteCode(): string {
  const prefixes = ["AMOR", "CASAL", "LOVE", "PAR", "LAR", "VIDA"];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomNumber = Math.floor(10 + Math.random() * 90); // 10 to 99
  return `${randomPrefix}${randomNumber}`;
}

// 1. Get database state scoped for current coupleId
app.get("/api/state", (req, res) => {
  const { coupleId } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple, users } = getCoupleAndUsers(store, coupleId);

  // Filter items owned by this coupleId
  const filterByCouple = (items: any[]) => {
    if (!items) return [];
    return items.filter(item => (item.coupleId || "couple_1") === coupleId);
  };

  res.json({
    users,
    couple,
    tasks: filterByCouple(store.tasks),
    events: filterByCouple(store.events),
    shopping: filterByCouple(store.shopping),
    expenses: filterByCouple(store.expenses),
    memories: filterByCouple(store.memories).map(m => {
      if (m.is_capsule && m.capsule_unlock_date) {
        const isLocked = new Date(m.capsule_unlock_date).getTime() > Date.now();
        if (isLocked) {
          return {
            ...m,
            isLocked: true,
            url: "", // Clear actual URL
            description: m.description, // Keep description hidden or clear? Let's hide the description or make it custom
            masked_description: `🔒 Cápsula do Tempo Selada até ${new Date(m.capsule_unlock_date).toLocaleDateString("pt-BR")}`
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

// Real Authentic Coupling flow

// SignUp / Registration for User 1
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, nickname, partner_nickname, color, avatar_url } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "E-mail, senha e nome são obrigatórios" });
  }

  const store = db.getStore();
  if (!store.accounts) store.accounts = [];

  const existingAccount = store.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (existingAccount) {
    return res.status(400).json({ error: "Este email de conta já está registrado" });
  }

  const generatedCoupleId = "couple_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const generatedInviteCode = generateInviteCode();

  // Create account
  store.accounts.push({
    email,
    passwordHash: password, // Simple plain text for mock project
    userId: "Leandro", // User 1 maps to Leandro internally
    coupleId: generatedCoupleId
  });

  // Create Couple space
  if (!store.couples) store.couples = {};
  store.couples[generatedCoupleId] = {
    id: generatedCoupleId,
    invite_code: generatedInviteCode,
    connected: false, // Waiting for spouse code integration
    home_level: 1,
    total_points: 0,
    unlocked_achievements: []
  };

  // Initialize Users profile
  if (!store.couplesUsers) store.couplesUsers = {};
  store.couplesUsers[generatedCoupleId] = {
    Leandro: {
      id: "Leandro",
      name: name,
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

  logActivityForCouple(store, generatedCoupleId, "register", `🏠 Lar digital iniciado por ${name}!`);

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

// Login for existing users
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
  }

  const store = db.getStore();
  if (!store.accounts) store.accounts = [];

  const account = store.accounts.find(a => a.email.toLowerCase() === email.toLowerCase() && a.passwordHash === password);
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

// Verify Couple code (for User 2 login route)
app.post("/api/auth/use-code", (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) {
    return res.status(400).json({ error: "Código é obrigatório" });
  }

  const store = db.getStore();
  if (!store.couples) store.couples = {};

  const cleanCode = inviteCode.trim().toUpperCase();
  const coupleId = Object.keys(store.couples).find(cid => store.couples![cid].invite_code === cleanCode);

  if (!coupleId) {
    return res.status(404).json({ error: "Código do casal inválido ou já conectado!" });
  }

  const couple = store.couples[coupleId];
  if (couple.connected) {
    return res.status(400).json({ error: "Código já foi utilizado e o casal já se deparou!" });
  }

  const { users } = getCoupleAndUsers(store, coupleId);

  res.json({
    success: true,
    coupleId,
    couple,
    firstPartnerName: users["Leandro"]?.name || "Parceiro"
  });
});

// Complete register for spouse (User 2)
app.post("/api/auth/complete-partner", (req, res) => {
  const { coupleId, email, password, name, nickname, avatar_url } = req.body;
  if (!coupleId || !email || !password || !name) {
    return res.status(400).json({ error: "Todos os campos de cadastro são obrigatórios" });
  }

  const store = db.getStore();
  if (!store.accounts) store.accounts = [];

  const existingAccount = store.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (existingAccount) {
    return res.status(400).json({ error: "Este email de conta já está registrado" });
  }

  const { couple, users } = getCoupleAndUsers(store, coupleId);

  if (couple.connected) {
    return res.status(400).json({ error: "Casal já conectado para este código!" });
  }

  // Register account for Partner 2
  store.accounts.push({
    email,
    passwordHash: password,
    userId: "Kaisa", // User 2 maps to Kaisa internally
    coupleId
  });

  // Upgrade spouse profile info
  users["Kaisa"] = {
    id: "Kaisa",
    name: name,
    partner_nickname: nickname || "Amor",
    color: "#EC4899",
    timezone: "America/Sao_Paulo",
    avatar_url: avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    points_weekly: 0
  };

  // Mark connected, clear connection code
  couple.connected = true;
  couple.invite_code = null;

  logActivityForCouple(store, coupleId, "couple_connected", `💜 ${name} entrou no lar compartilhado com ${users["Leandro"].name}!`);

  db.saveStore();

  res.json({
    success: true,
    email,
    userId: "Kaisa",
    coupleId,
    couple,
    user: users["Kaisa"],
    users
  });
});

// Delete account and all associated couple data
app.post("/api/auth/delete-account", (req, res) => {
  const { coupleId } = getRequestCredentials(req);
  if (!coupleId || coupleId === "couple_1") {
    return res.status(400).json({ error: "Para fins de demonstração, não é permitido excluir o lar padrão de simulação." });
  }

  const store = db.getStore();

  // Delete accounts from authorization store
  if (store.accounts) {
    store.accounts = store.accounts.filter(a => a.coupleId !== coupleId);
  }

  // Delete couple metadata
  if (store.couples) {
    delete store.couples[coupleId];
  }

  // Delete users entries
  if (store.couplesUsers) {
    delete store.couplesUsers[coupleId];
  }

  // Filter out scoped items belonging to this couple
  const listsToScope = [
    "tasks", "events", "shopping", "expenses", "memories", "moods",
    "wishlist", "recipes", "mealPlan", "inventory", "rewards", "quests", "quickNotes", "pets",
    "fixedFunctions", "activityReactions", "monthlyAccounts"
  ];

  listsToScope.forEach(key => {
    const list = (store as any)[key];
    if (list && Array.isArray(list)) {
      (store as any)[key] = list.filter((item: any) => item.coupleId !== coupleId);
    }
  });

  db.saveStore();

  res.json({
    success: true,
    message: "Todas as contas e histórico do casal foram excluídos com sucesso. Até breve!"
  });
});

// Reset store to original seed data (scoped to Demo space)
app.post("/api/profile/reset", (req, res) => {
  db.resetToDefaults();
  res.json({ success: true, message: "Banco de dados reiniciado com sucesso!", state: db.getStore() });
});

// Update Partner, Name, Nickname, Settings and Preferences (scoped)
app.post("/api/profile/update", (req, res) => {
  const { coupleId } = getRequestCredentials(req);
  const { user_id, name, nickname, partner_nickname, color, timezone, avatar_url, preferences } = req.body;
  const store = db.getStore();
  const { users } = getCoupleAndUsers(store, coupleId);
  
  if (users[user_id]) {
    if (name) {
      users[user_id].name = name;
    }
    if (nickname !== undefined) {
      users[user_id].nickname = nickname;
    }
    if (partner_nickname !== undefined) {
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
    if (preferences !== undefined) {
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

// Couple connection status: disconnect or link demo
app.post("/api/couple/disconnect", (req, res) => {
  const { coupleId } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple } = getCoupleAndUsers(store, coupleId);
  couple.connected = false;
  db.saveStore();
  res.json({ success: true, couple });
});

app.post("/api/couple/reconnect", (req, res) => {
  const { coupleId } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple } = getCoupleAndUsers(store, coupleId);
  couple.connected = true;
  db.saveStore();
  res.json({ success: true, couple });
});

// Helper for keeping a synchronized real-time activity feed inside unlocked_achievements
function logActivity(store: any, prefix: string, message: string) {
  if (!store.couple.unlocked_achievements) {
    store.couple.unlocked_achievements = [];
  }
  const timestamp = new Date().toISOString();
  store.couple.unlocked_achievements.push(`activity:${prefix}:${message}:${timestamp}`);
  
  // Keep last 40 activities to avoid array growing indefinitely
  const nonActivities = store.couple.unlocked_achievements.filter((a: string) => !a.startsWith("activity:"));
  const activities = store.couple.unlocked_achievements.filter((a: string) => a.startsWith("activity:"));
  store.couple.unlocked_achievements = [...nonActivities, ...activities.slice(-40)];
}

// Spend points to redeem a reward coupon
app.post("/api/couple/redeem-reward", (req, res) => {
  const { reward_title, cost, user_id } = req.body;
  const store = db.getStore();
  
  if (store.couple.total_points >= cost) {
    store.couple.total_points -= cost;
    
    // Log achievement / claim
    if (!store.couple.unlocked_achievements) {
      store.couple.unlocked_achievements = [];
    }
    
    const timestampStr = new Date().toISOString();
    store.couple.unlocked_achievements.push(`redeemed:${reward_title}:${user_id}:${timestampStr}`);
    
    db.saveStore();
    res.json({ success: true, message: `Recompensa '${reward_title}' resgatada com sucesso por ${user_id}!`, state: db.getStore() });
  } else {
    res.status(400).json({ error: "Pontos do lar insuficientes para este resgate carinhoso." });
  }
});

// ================= TAREFAS MODULE =================

// Create Task
app.post("/api/tasks/create", (req, res) => {
  const { title, description, responsible_id, due_date, recurrence, category, priority, time_estimate } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }
  
  const store = db.getStore();
  const newTask: Task = {
    id: "task_" + Date.now(),
    title: title.slice(0, 80),
    description: description ? description.slice(0, 500) : "",
    responsible_id: responsible_id || "Ambos",
    due_date: due_date || undefined,
    recurrence: recurrence || "Nenhuma",
    category: category || TaskCategory.OUTRO,
    priority: priority || TaskPriority.NORMAL,
    time_estimate: time_estimate ? parseInt(time_estimate, 10) : undefined,
    points: priority === TaskPriority.URGENTE ? 25 : 10,
    completed: false,
    archived: false,
    comments: []
  };

  store.tasks.push(newTask);
  db.saveStore();
  res.json({ success: true, task: newTask });
});

// Toggle Task Complete & Perform Gamification calculation
app.post("/api/tasks/toggle", (req, res) => {
  const { id, user_id, photo_proof } = req.body; // user_id is the person completing it
  const store = db.getStore();
  const task = store.tasks.find(t => t.id === id);
  
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const wasCompleted = task.completed;
  task.completed = !task.completed;
  
  if (task.completed) {
    task.completed_at = new Date().toISOString();
    if (photo_proof) {
      task.photo_proof = photo_proof;
    }
    
    // Gamification Points
    let earnedPoints = task.priority === TaskPriority.URGENTE ? 25 : 10;
    
    // Check if on-time deadline bonus (due_date exists and completed before or on that date)
    if (task.due_date) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (todayStr <= task.due_date) {
        earnedPoints += 5; // +5 on-time completion bonus!
      }
    }
    
    // Allocate to the user who completed and the couple's total
    if (store.users[user_id]) {
      store.users[user_id].points_weekly += earnedPoints;
    }
    store.couple.total_points += earnedPoints;
    
    logActivity(store, "task_completed", `${user_id} completou a tarefa '${task.title}' (+${earnedPoints} pontos!)`);

    // Recorrência automática de tarefas (automatic reproduction of completed recurring tasks)
    if (task.recurrence && task.recurrence !== "Nenhuma") {
      let baseDate = task.due_date ? new Date(task.due_date + "T12:00:00") : new Date();
      if (isNaN(baseDate.getTime())) {
        baseDate = new Date();
      }
      const nextDate = new Date(baseDate);
      if (task.recurrence === "Diária") {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (task.recurrence === "Semanal") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (task.recurrence === "Quinzenal") {
        nextDate.setDate(nextDate.getDate() + 14);
      } else if (task.recurrence === "Mensal") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      const nextDueDateStr = nextDate.toISOString().split("T")[0];
      
      const recurringTask: any = {
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
        coupleId: (task as any).coupleId
      };
      store.tasks.push(recurringTask);
      logActivity(store, "task_recreated", `Agenda recorrente agendada para ${nextDueDateStr}: ${task.title}`);
    }

    // Check if new Home Level reached (progress 100 points per level)
    const nextLevel = Math.floor(store.couple.total_points / 100) + 1;
    if (nextLevel > store.couple.home_level) {
      store.couple.home_level = nextLevel;
      logActivity(store, "level_up", `🎉 Parabéns! O lar subiu para o Nível ${nextLevel} com ${store.couple.total_points} pontos!`);
    }
  } else {
    // Deduct when uncompleting (within 24h error margin)
    let penaltyPoints = task.priority === TaskPriority.URGENTE ? 25 : 10;
    if (task.due_date) {
      // assume it was on time
      penaltyPoints += 5;
    }
    if (store.users[user_id]) {
      store.users[user_id].points_weekly = Math.max(0, store.users[user_id].points_weekly - penaltyPoints);
    }
    store.couple.total_points = Math.max(0, store.couple.total_points - penaltyPoints);
    task.completed_at = undefined;
    task.photo_proof = undefined;
    logActivity(store, "task_undone", `${user_id} reabriu a tarefa '${task.title}'.`);
  }

  db.saveStore();
  res.json({ success: true, task, couple: store.couple, users: store.users });
});

// Soft Delete / Archive
app.post("/api/tasks/archive", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const task = store.tasks.find(t => t.id === id);
  if (task) {
    task.archived = !task.archived;
    db.saveStore();
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});

// Task Comment / Chat
app.post("/api/tasks/comment", (req, res) => {
  const { task_id, author_id, text } = req.body;
  const store = db.getStore();
  const task = store.tasks.find(t => t.id === task_id);
  
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const newComment = {
    id: "comment_" + Date.now(),
    author_id,
    text: text || "",
    timestamp: new Date().toISOString()
  };

  task.comments.push(newComment);
  db.saveStore();
  res.json({ success: true, comment: newComment, task });
});


// ================= SHOPPING & INVENTORY MODULE =================

// Add Item
app.post("/api/shopping/create", (req, res) => {
  const { name, category, quantity, unit, price, added_by, suggested, reason_suggested, monthId } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const store = db.getStore();
  const targetMonthId = monthId || "2026-05";
  
  // Clean duplicate checks (e.g. "leite" / "leite integral") in the same active list
  const lowercaseName = name.trim().toLowerCase();
  const duplicate = store.shopping.find(
    i => !i.is_bought && 
         (i.monthId === targetMonthId || (!i.monthId && targetMonthId === "2026-05")) && 
         i.name.trim().toLowerCase() === lowercaseName
  );

  if (duplicate) {
    return res.json({ 
      success: true, 
      warning: "Duplicate detected", 
      message: `O item '${name}' já existe na lista pendente deste mês!`, 
      item: duplicate 
    });
  }

  // Auto Category Mapper helper
  let resolvedCategory = category || ShoppingCategory.OUTROS;
  if (!category) {
    const listHorti = ["banana", "maçã", "tomate", "cebola", "alho", "laranja", "batata", "alface", "fruta", "legume"];
    const listLati = ["leite", "queijo", "iogurte", "manteiga", "requeijão", "creme", "sorvete", "yakult"];
    const listCarne = ["carne", "frango", "peixe", "alcatra", "mignon", "porco", "peito", "linguiça", "salsicha"];
    const listLimp = ["detergente", "sabão", "desinfetante", "cloro", "pano", "amaciante", "água sanitária"];
    const listHigi = ["papel higiênico", "sabonete", "shampoo", "creme de dente", "pasta de dente", "fio dental"];

    const isMatch = (arr: string[]) => arr.some(kw => lowercaseName.includes(kw));

    if (isMatch(listHorti)) resolvedCategory = ShoppingCategory.HORTIFRUTI;
    else if (isMatch(listLati)) resolvedCategory = ShoppingCategory.LATICINIOS;
    else if (isMatch(listCarne)) resolvedCategory = ShoppingCategory.CARNES;
    else if (isMatch(listLimp)) resolvedCategory = ShoppingCategory.LIMPEZA;
    else if (isMatch(listHigi)) resolvedCategory = ShoppingCategory.HIGIENE;
  }

  const newItem: ShoppingItem = {
    id: "shop_" + Date.now(),
    name,
    category: resolvedCategory,
    quantity: quantity ? parseFloat(quantity) : 1,
    unit: unit || "unidades",
    price: price ? parseFloat(price) : undefined,
    is_bought: false,
    added_by: added_by || "Parceiro",
    suggested: !!suggested,
    reason_suggested: reason_suggested || undefined,
    monthId: targetMonthId,
    listStatus: "active"
  };

  store.shopping.push(newItem);
  db.saveStore();
  res.json({ success: true, item: newItem });
});

// Add Multiple Items in Bulk (Quick Add)
app.post("/api/shopping/create-bulk", (req, res) => {
  const { items, added_by, monthId } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Items array is required" });
  }

  const store = db.getStore();
  const addedItems: any[] = [];
  const duplicates: string[] = [];
  const targetMonthId = monthId || "2026-05";

  for (const item of items) {
    if (!item.name) continue;
    
    const name = item.name.trim();
    const lowercaseName = name.toLowerCase();
    
    // Check duplicate
    const duplicate = store.shopping.find(
      i => !i.is_bought && 
           (i.monthId === targetMonthId || (!i.monthId && targetMonthId === "2026-05")) && 
           i.name.trim().toLowerCase() === lowercaseName
    );

    if (duplicate) {
      duplicates.push(name);
      continue;
    }

    // Auto Category Mapper helper
    let resolvedCategory = item.category || ShoppingCategory.OUTROS;
    if (!item.category) {
      const listHorti = ["banana", "maçã", "tomate", "cebola", "alho", "laranja", "batata", "alface", "fruta", "legume"];
      const listLati = ["leite", "queijo", "iogurte", "manteiga", "requeijão", "creme", "sorvete", "yakult"];
      const listCarne = ["carne", "frango", "peixe", "alcatra", "mignon", "porco", "peito", "linguiça", "salsicha"];
      const listLimp = ["detergente", "sabão", "desinfetante", "cloro", "pano", "amaciante", "água sanitária"];
      const listHigi = ["papel higiênico", "sabonete", "shampoo", "creme de dente", "pasta de dente", "fio dental"];

      const isMatch = (arr: string[]) => arr.some(kw => lowercaseName.includes(kw));

      if (isMatch(listHorti)) resolvedCategory = ShoppingCategory.HORTIFRUTI;
      else if (isMatch(listLati)) resolvedCategory = ShoppingCategory.LATICINIOS;
      else if (isMatch(listCarne)) resolvedCategory = ShoppingCategory.CARNES;
      else if (isMatch(listLimp)) resolvedCategory = ShoppingCategory.LIMPEZA;
      else if (isMatch(listHigi)) resolvedCategory = ShoppingCategory.HIGIENE;
    }

    const newItem: ShoppingItem = {
      id: "shop_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name,
      category: resolvedCategory,
      quantity: item.quantity ? parseFloat(item.quantity) : 1,
      unit: item.unit || "unidades",
      price: item.price ? parseFloat(item.price) : undefined,
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

// Toggle Bought - simple checkoff (removed automatic inventory sync or complicated automatic additions)
app.post("/api/shopping/toggle", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const item = store.shopping.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  item.is_bought = !item.is_bought;
  item.bought_at = item.is_bought ? new Date().toISOString() : undefined;

  if (item.is_bought) {
    logActivity(store, "shopping", `🛒 Compra Selecionada: '${item.name}' (${item.quantity} ${item.unit}) foi riscado.`);
  } else {
    logActivity(store, "shopping_removed", `🛒 Compra Desmarcada: '${item.name}' está pendente.`);
  }

  db.saveStore();
  res.json({ success: true, item, shopping: store.shopping });
});

// Delete item
app.post("/api/shopping/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  store.shopping = store.shopping.filter(i => i.id !== id);
  db.saveStore();
  res.json({ success: true });
});

// Update or set budget for a given month
app.post("/api/shopping/budget", (req, res) => {
  const { monthId, budget } = req.body;
  if (!monthId) {
    return res.status(400).json({ error: "monthId is required" });
  }
  const store = db.getStore();
  if (!store.couple.shoppingBudgets) {
    store.couple.shoppingBudgets = {};
  }
  store.couple.shoppingBudgets[monthId] = parseFloat(budget) || 0;
  db.saveStore();
  res.json({ success: true, shoppingBudgets: store.couple.shoppingBudgets });
});

// Update single item fields inline in real-time
app.post("/api/shopping/update", (req, res) => {
  const { id, name, quantity, unit, price, category } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Item ID is required" });
  }

  const store = db.getStore();
  const item = store.shopping.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  if (name !== undefined) item.name = name;
  if (quantity !== undefined) item.quantity = parseFloat(quantity) || 0;
  if (unit !== undefined) item.unit = unit;
  if (price !== undefined) item.price = price !== null && price !== "" ? parseFloat(price) : undefined;
  if (category !== undefined) item.category = category;

  db.saveStore();
  res.json({ success: true, item, shopping: store.shopping });
});

// Finalize a monthly list and log into expenses
app.post("/api/shopping/finalize", (req, res) => {
  const { monthId, paymentMethod, totalSpent, paid_by_id, carryOver } = req.body;
  if (!monthId) {
    return res.status(400).json({ error: "monthId is required" });
  }

  const store = db.getStore();
  
  // Find all items for this month (handling defaults)
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
    i => (i.monthId === currentMonthId || (!i.monthId && currentMonthId === "2026-05"))
  );

  if (monthItems.length === 0) {
    return res.status(400).json({ error: "Nenhum item nesta lista para finalizar." });
  }

  const actualSpent = totalSpent !== undefined ? parseFloat(totalSpent) : 0;
  
  // Calculate estimated total based on items checked/bought this month
  const estimatedTotal = monthItems
    .filter(i => i.is_bought)
    .reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0);

  const difference = estimatedTotal - actualSpent;

  // Store detailed finalization record in a custom array on couple
  if (!store.couple.shoppingFinalizations) {
    (store.couple as any).shoppingFinalizations = [];
  }
  
  (store.couple as any).shoppingFinalizations.push({
    id: "fin_" + Date.now(),
    monthId: currentMonthId,
    estimatedTotal,
    realTotal: actualSpent,
    difference,
    paymentMethod: paymentMethod || "Não Informado",
    paidBy: paid_by_id || "Leandro",
    date: new Date().toISOString()
  });

  // Process items
  for (const item of monthItems) {
    if (item.is_bought) {
      item.listStatus = "finalized";
      item.paymentMethod = paymentMethod || "Não Informado";
    } else if (carryOver) {
      // Carry over unchecked items to the next month!
      item.monthId = nextMonthId;
      item.listStatus = "active";
    } else {
      // Keep in current month but archived/finalized status
      item.listStatus = "finalized";
    }
  }

  // Create financial integration expense
  const helperFormatMonth = (ym: string) => {
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const parts = ym.split("-");
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    if (isNaN(m) || m < 1 || m > 12) return ym;
    return `${months[m - 1]}/${y}`;
  };

  const readableMonth = helperFormatMonth(monthId);

  const mapPaymentMethod = (method: string): any => {
    if (!method) return "Outro";
    const lower = method.toLowerCase();
    if (lower === "débito" || lower === "debito") return "Débito";
    if (lower === "crédito" || lower === "credito") return "Crédito";
    if (lower === "pix") return "Pix";
    if (lower === "dinheiro") return "Dinheiro";
    if (lower === "carteira digital" || lower === "vr" || lower === "carteira") return "Carteira digital";
    return "Outro";
  };

  const newExpense: Expense = {
    id: "exp_shop_final_" + Date.now(),
    value: actualSpent,
    currency: "R$",
    description: `Lista de Compras de ${readableMonth} - Método: ${paymentMethod || "Não Informado"}`,
    paid_by_id: paid_by_id || "Leandro",
    split_type: "50/50",
    category: ExpenseCategory.ALIMENTACAO,
    date: new Date().toISOString().split("T")[0],
    is_recurring: false,
    payment_method: mapPaymentMethod(paymentMethod)
  };

  store.expenses.push(newExpense);

  logActivity(
    store,
    "shopping_finalized",
    `✅ Lista de ${readableMonth} finalizada por ${paid_by_id}! R$ ${actualSpent.toLocaleString("pt-BR", {minimumFractionDigits: 2})} pagos via ${paymentMethod || "Não Informado"} lançados automaticamente nas finanças.`
  );

  db.saveStore();
  res.json({ success: true, expenses: store.expenses, shopping: store.shopping, shoppingFinalizations: (store.couple as any).shoppingFinalizations });
});

// ================= HOUSE INVENTORY MODULE =================

// Add or edit stock manually (removed auto check-off triggers)
app.post("/api/inventory/update", (req, res) => {
  const { id, name, quantity, min_quantity, unit } = req.body;
  const store = db.getStore();
  
  const checkAndAddToShopping = (item: any) => {
    if (item.quantity < item.min_quantity) {
      const today = new Date();
      const currentMonthId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const lowercaseName = item.name.trim().toLowerCase();
      const exists = store.shopping.find(
        (s: any) => !s.is_bought && 
             (s.monthId === currentMonthId) && 
             s.name.trim().toLowerCase() === lowercaseName
      );
      if (!exists) {
        const newShopItem = {
          id: "shop_inv_" + Date.now(),
          name: item.name,
          category: ShoppingCategory.OUTROS,
          quantity: Math.max(1, Math.ceil(item.min_quantity - item.quantity)),
          unit: item.unit,
          price: 0,
          is_bought: false,
          added_by: "Estoque Baixo",
          monthId: currentMonthId,
          coupleId: item.coupleId
        };
        store.shopping.push(newShopItem as any);
        logActivity(store, "inventory_low", `Estoque baixo: '${item.name}' caiu para ${item.quantity} ${item.unit}. Item inserido no carrinho! 🛒`);
      }
    }
  };

  if (id) {
    const item = store.inventory.find(i => i.id === id);
    if (item) {
      item.quantity = parseFloat(quantity);
      if (min_quantity !== undefined) item.min_quantity = parseFloat(min_quantity);
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

// ================= QUICK NOTES / ANOTAÇÕES RÁPIDAS (COISAS QUE ACABAM DO NADA) =================

app.post("/api/quick-notes/create", (req, res) => {
  const { text, authorId } = req.body;
  
  if (!text || !authorId) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  
  const store = db.getStore();
  if (!store.quickNotes) {
    store.quickNotes = [];
  }
  
  const newNote = {
    id: "note_" + Date.now(),
    text,
    authorId,
    createdAt: new Date().toISOString()
  };
  
  store.quickNotes.push(newNote);
  db.saveStore();
  
  logActivity(store, "note", `📝 ${authorId} adicionou nota rápida: "${text}"`);
  
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
  
  store.quickNotes = store.quickNotes.filter(n => n.id !== id);
  db.saveStore();
  
  res.json({ success: true, quickNotes: store.quickNotes });
});

// ================= FINANÇAS COMPARTILHADAS =================

// Create expense
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
  const newExpense: Expense = {
    id: "exp_" + Date.now(),
    value: parseFloat(value),
    currency: currency || "R$",
    description: description.slice(0, 100),
    paid_by_id,
    split_type: split_type || "50/50",
    custom_percent: custom_percent ? parseFloat(custom_percent) : undefined,
    category: category || ExpenseCategory.OUTROS,
    date: date || new Date().toISOString().split("T")[0],
    is_recurring: !!is_recurring,
    payment_method: payment_method || undefined,
    card_name: card_name || undefined,
    installments_total: installments_total ? parseInt(installments_total, 10) : undefined,
    installments_current: installments_current ? parseInt(installments_current, 10) : undefined,
    monthly_installment_value: monthly_installment_value ? parseFloat(monthly_installment_value) : undefined
  };

  store.expenses.push(newExpense);
  db.saveStore();
  res.json({ success: true, expense: newExpense });
});

// Delete expense (soft delete)
app.post("/api/expenses/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  store.expenses = store.expenses.filter(e => e.id !== id);
  db.saveStore();
  res.json({ success: true });
});

app.post("/api/expenses/toggle-paid", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const expense = store.expenses.find(e => e.id === id);
  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }
  expense.is_paid_this_month = !expense.is_paid_this_month;
  db.saveStore();
  res.json({ success: true, expense });
});

// Dynamic Rewards Enpoints
app.post("/api/rewards/create", (req, res) => {
  const { title, cost, desc, emoji } = req.body;
  if (!title || !cost) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  const store = db.getStore();
  const newReward: Reward = {
    id: "reward_" + Date.now(),
    title,
    cost: parseInt(cost),
    desc: desc || "",
    emoji: emoji || "🎁"
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
  store.rewards = store.rewards.filter(r => r.id !== id);
  db.saveStore();
  res.json({ success: true });
});

// Dynamic Quests / Missões Endpoints
app.post("/api/quests/create", (req, res) => {
  const { title, description, points, type, target_count } = req.body;
  if (!title || !points) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  const store = db.getStore();
  const newQuest: Quest = {
    id: "quest_" + Date.now(),
    title,
    description: description || "",
    points: parseInt(points) || 10,
    type: type || "Custom",
    target_count: target_count ? parseInt(target_count) : undefined,
    current_count: target_count ? 0 : undefined,
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
  store.quests = store.quests.filter(q => q.id !== id);
  db.saveStore();
  res.json({ success: true });
});

app.post("/api/quests/toggle-complete", (req, res) => {
  const { id, user_id } = req.body;
  const store = db.getStore();
  if (!store.quests) store.quests = [];
  const quest = store.quests.find(q => q.id === id);
  if (!quest) {
    return res.status(404).json({ error: "Quest not found" });
  }
  
  quest.completed = !quest.completed;
  if (quest.completed) {
    store.couple.total_points += quest.points;
    if (user_id && store.users[user_id]) {
      store.users[user_id].points_weekly += quest.points;
    }
  } else {
    store.couple.total_points = Math.max(0, store.couple.total_points - quest.points);
    if (user_id && store.users[user_id]) {
      store.users[user_id].points_weekly = Math.max(0, store.users[user_id].points_weekly - quest.points);
    }
  }

  db.saveStore();
  res.json({ success: true, quest, couple: store.couple, users: store.users });
});

// ================= CALENDÁRIO DO CASAL =================

app.post("/api/events/create", (req, res) => {
  const { title, description, type, start_time, end_time, location, travel_checklist, booking_link, responsible_id } = req.body;
  if (!title || !start_time || !type) {
    return res.status(400).json({ error: "Missing required fields for event" });
  }

  const store = db.getStore();
  const newEvent: Event = {
    id: "event_" + Date.now(),
    title,
    description,
    type,
    start_time,
    end_time,
    location,
    travel_checklist: travel_checklist || (type === EventType.VIAGEM ? [] : undefined),
    booking_link,
    responsible_id: responsible_id || "Ambos",
    comments: []
  };

  store.events.push(newEvent);
  db.saveStore();
  res.json({ success: true, event: newEvent });
});

// Toggle travel checklist items
app.post("/api/events/checklist/toggle", (req, res) => {
  const { event_id, item_text } = req.body;
  const store = db.getStore();
  const event = store.events.find(e => e.id === event_id);
  
  if (!event || !event.travel_checklist) {
    return res.status(404).json({ error: "Event or travel checklist not found" });
  }

  const checkItem = event.travel_checklist.find(i => i.item === item_text);
  if (checkItem) {
    checkItem.checked = !checkItem.checked;
    db.saveStore();
    res.json({ success: true, event });
  } else {
    res.status(404).json({ error: "Checklist item not found" });
  }
});

// Add items to checklist item
app.post("/api/events/checklist/add", (req, res) => {
  const { event_id, item_text } = req.body;
  const store = db.getStore();
  const event = store.events.find(e => e.id === event_id);
  
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

// ================= MEMÓRIAS & ÁLBUM =================

app.post("/api/memories/create", (req, res) => {
  const { url, description, date, location, album_name, is_capsule, capsule_unlock_date } = req.body;
  if (!url || !description) {
    return res.status(400).json({ error: "Photo URL and description are required" });
  }

  const store = db.getStore();
  const newMemory: Memory = {
    id: "mem_" + Date.now(),
    url,
    description,
    date: date || new Date().toISOString().split("T")[0],
    location,
    album_name: album_name || "Geral",
    is_capsule: !!is_capsule,
    capsule_unlock_date: capsule_unlock_date || undefined,
    created_at: new Date().toISOString()
  };

  store.memories.push(newMemory);
  db.saveStore();
  res.json({ success: true, memory: newMemory });
});

// ================= HUMOR & CHECK-IN EMOCIONAL =================

app.post("/api/moods/checkin", (req, res) => {
  const { user_id, mood, note, share_note } = req.body;
  if (!user_id || !mood) {
    return res.status(400).json({ error: "User ID and mood are required" });
  }

  const store = db.getStore();
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Find today's checkin for this user to update or append
  let checkin = store.moods.find(m => m.user_id === user_id && m.date === todayStr);
  
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

  logActivity(store, "mood", `✨ Sintonia do Amor: ${user_id} atualizou o humor para '${mood}'${note ? `: "${note}"` : ""}`);

  db.saveStore();
  res.json({ success: true, checkin });
});


// ================= WISHLIST MODULE =================

app.post("/api/wishlist/create", (req, res) => {
  const { name, link, estimated_price, priority, is_private_to_partner, category, saving_goal, added_by } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: "Name and category are required" });
  }

  const store = db.getStore();
  const newItem: WishlistItem = {
    id: "wish_" + Date.now(),
    name,
    link,
    estimated_price: estimated_price ? parseFloat(estimated_price) : undefined,
    priority: priority || "Média",
    is_private_to_partner: !!is_private_to_partner,
    category,
    saving_goal: saving_goal ? parseFloat(saving_goal) : undefined,
    saving_saved: saving_goal ? 0 : undefined,
    added_by: added_by || "Ambos"
  };

  store.wishlist.push(newItem);
  db.saveStore();
  res.json({ success: true, item: newItem });
});

// Contribute saving to cofrinho
app.post("/api/wishlist/save", (req, res) => {
  const { id, amount } = req.body;
  const store = db.getStore();
  const item = store.wishlist.find(w => w.id === id);
  if (!item || item.saving_goal === undefined) {
    return res.status(404).json({ error: "Wishlist cofrinho not found" });
  }

  const current = item.saving_saved || 0;
  item.saving_saved = Math.min(item.saving_goal, current + parseFloat(amount));
  db.saveStore();
  res.json({ success: true, item });
});

// ================= RECEITAS & CARDÁPIO SEMANAL =================

app.post("/api/recipes/create", (req, res) => {
  const { title, ingredients, instructions, duration, portions, couple_rating, tags, url } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Recipe title is required" });
  }

  const store = db.getStore();
  const newRecipe: Recipe = {
    id: "rec_" + Date.now(),
    title,
    ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
    instructions: instructions || "",
    duration: duration ? parseInt(duration, 10) : 30,
    portions: portions ? parseInt(portions, 10) : 2,
    couple_rating: couple_rating || undefined,
    tags: tags || [],
    photo_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300"
  };

  store.recipes.push(newRecipe);
  db.saveStore();
  res.json({ success: true, recipe: newRecipe });
});

// Import Recipe simulation (via URL context)
app.post("/api/recipes/import-url", (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Simulated scraped data based on some URLs or fallback
  const store = db.getStore();
  const scrapeTitle = url.includes("panelinha") ? "Risoto de Abóbora Panelinha" : "Bolo Formiga Especial";
  const ingreds = url.includes("panelinha") 
    ? ["Abóbora cabotiá picada - 400g", "Arroz arbóreo - 1.5 xícaras", "Parmesão ralado - 80g", "Cebola ralada", "Vinho branco seco - 100ml"]
    : ["Farinha de trigo - 2 xícaras", "Granulado de chocolate - 100g", "Ovos grandes - 3 unidades", "Manteiga amolecida - 100g", "Leite morno"];

  const newRecipe: Recipe = {
    id: "rec_scraped_" + Date.now(),
    title: scrapeTitle,
    ingredients: ingreds,
    instructions: "1. Prepare o batedor ou panela conforme as instruções tradicionais.\n2. Incorpore os ingredientes em fogo brando.\n3. Misture devagar e sirva em porções generosas para o casal adorar.",
    duration: 35,
    portions: 4,
    couple_rating: "Favorita",
    tags: ["rápida", "econômica"],
    photo_url: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&q=80&w=300"
  };

  store.recipes.push(newRecipe);
  db.saveStore();
  res.json({ success: true, recipe: newRecipe });
});

app.post("/api/recipes/rate", (req, res) => {
  const { id, rating } = req.body; // "Gostamos" | "Não repetir" | "Favorita"
  const store = db.getStore();
  const recipe = store.recipes.find(r => r.id === id);
  if (recipe) {
    recipe.couple_rating = rating;
    db.saveStore();
    res.json({ success: true, recipe });
  } else {
    res.status(404).json({ error: "Recipe not found" });
  }
});

// Generate grocery list automatically from recipe items
app.post("/api/recipes/generate-shopping", (req, res) => {
  const { recipe_id, user_id } = req.body;
  const store = db.getStore();
  const recipe = store.recipes.find(r => r.id === recipe_id);
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  const addedItems: string[] = [];
  recipe.ingredients.forEach(rawIng => {
    // split amount
    const cleanName = rawIng.includes("-") ? rawIng.split("-")[0].trim() : rawIng.trim();
    
    // check redundancy
    const exists = store.shopping.some(s => !s.is_bought && s.name.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
      store.shopping.push({
        id: "shop_rec_" + Date.now() + Math.random().toString(36).substring(3, 8),
        name: cleanName,
        category: ShoppingCategory.OUTROS,
        quantity: 1,
        unit: "porção",
        is_bought: false,
        added_by: user_id || "Receitas"
      });
      addedItems.push(cleanName);
    }
  });

  db.saveStore();
  res.json({ success: true, added: addedItems, shopping: store.shopping });
});

// Update weekly plan slot
app.post("/api/mealplan/update", (req, res) => {
  const { day, meal_type, recipe_id, custom_text } = req.body;
  const store = db.getStore();
  
  const slotId = `${day}-${meal_type}`;
  let slot = store.mealPlan.find(m => m.id === slotId);
  
  if (slot) {
    slot.recipe_id = recipe_id || undefined;
    slot.custom_text = custom_text || undefined;
  } else {
    slot = {
      id: slotId,
      day,
      meal_type,
      recipe_id: recipe_id || undefined,
      custom_text: custom_text || undefined
    };
    store.mealPlan.push(slot);
  }

  db.saveStore();
  res.json({ success: true, slot });
});


// ================= CHAT CONTEXTUAL =================

// Add quick contextual comments on any list shop item, calendar event or task
app.post("/api/chat/comment", (req, res) => {
  const { scope_type, scope_id, text, sender_id } = req.body; // scope_type: task, event, shop
  const store = db.getStore();
  
  const comment = {
    id: "c_" + Date.now(),
    author_id: sender_id || "Leandro",
    text: text || "",
    timestamp: new Date().toISOString()
  };

  if (scope_type === "task") {
    const task = store.tasks.find(t => t.id === scope_id);
    if (task) task.comments.push(comment);
  } else if (scope_type === "event") {
    const event = store.events.find(e => e.id === scope_id);
    if (event) event.comments.push(comment);
  } else if (scope_type === "shop") {
    // we can record it as custom log or directly
  }

  db.saveStore();
  res.json({ success: true, comment });
});


// ================= GEMINI AFFECTIVE IA =================

// Endpoint for smart emotional coaching and housekeeping tips
app.post("/api/gemini/insights", (req, res) => {
  const { coupleId } = getRequestCredentials(req);
  const client = getAiClient();
  const store = db.getStore();
  const { couple, users } = getCoupleAndUsers(store, coupleId);
  
  const p1Name = users.Leandro?.name || "Leandro";
  const p2Name = users.Kaisa?.name || "Kaisa";

  const incompleteTasks = (store.tasks || []).filter((t: any) => t.coupleId === coupleId && !t.completed).map((t: any) => `${t.title} (${t.responsible_id})`).join(", ");
  const recentMoods = (store.moods || []).filter((m: any) => m.coupleId === coupleId).slice(-6).map((m: any) => `${m.user_id}: ${m.mood} (${m.note || "Sem nota"})`).join(", ");
  const coupleStats = `Nível do Lar: ${couple.home_level}, Total Pontos: ${couple.total_points}. Pontos ${p1Name}: ${users.Leandro?.points_weekly || 0}, Pontos ${p2Name}: ${users.Kaisa?.points_weekly || 0}`;

  const prompt = `Atue como o assistente emocional "IA Afetiva" do aplicativo de casal NósDois.
  Analise os dados atuais do lar e dê um feedback carinhoso, empático e sutil de até 3 frases em Português do Brasil para apoiar o casal (${p1Name} e ${p2Name}).
  
  Dados Atuais:
  - Estatísticas: ${coupleStats}
  - Tarefas pendentes: ${incompleteTasks || "Nenhuma! Incrível."}
  - Humores recentes: ${recentMoods || "Ainda sem check-ins hoje."}
  
  Importante:
  - Seja caloroso, romântico e apoiador.
  - Faça comentários que gerem união, reduzam o estresse Invisível da rotina, ou sugiram carinho mútuo.
  - Se os dois estiverem cansados, ative conselhos reconfortantes (modo acolhedor).
  - Use o nome de ambos ${p1Name} e ${p2Name} de forma carinhosa ou seus apelidos ("Mozão" e "Meu Amor").
  - Retorne um parágrafo conciso em formato de texto simples. Sem jargões técnicos.`;

  if (!client) {
    // Fallback if API key is not configured or mock
    const fallbackAnswers = [
      `${p1Name} e ${p2Name}, vocês estão indo muito bem nesta semana! Que tal prepararem uma das suas receitas favoritas hoje e relaxarem juntinhos no sofá? Um abraço forte cuida de qualquer cansaço. 💜`,
      `Percebi que a rotina está um pouco cheia hoje. Meu Amor ${p1Name} e Mozão ${p2Name}, lembrem-se de respirar fundo e dividir o peso das tarefas. Uma noite tranquila com fondue pode ser maravilhoso para vocês!`,
      `Parabéns pelo progresso no Nível do Lar! Cada pequena tarefa concluída é um carinho com o outro. Aproveitem a noite de hoje livre de louças para assistirem algo engraçado juntos.`
    ];
    return res.json({ insight: fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)] });
  }

  client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  }).then(response => {
    res.json({ insight: response.text });
  }).catch(err => {
    console.error("Gemini Insight Call failed:", err);
    res.json({ 
      insight: `${p1Name} e ${p2Name}, lembrem-se de respirar fundo e dividir o peso das tarefas cotidianas. Vocês são uma ótima dupla! Que tal uma noite de cafuné e descanso? 💜` 
    });
  });
});


// ================= EDITING & DELETION ENDPOINTS =================

// Tasks
app.post("/api/tasks/update", (req, res) => {
  const { id, title, description, responsible_id, due_date, recurrence, category, priority, time_estimate } = req.body;
  const store = db.getStore();
  const task = store.tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  if (title) task.title = title.slice(0, 80);
  if (description !== undefined) task.description = description.slice(0, 500);
  if (responsible_id) task.responsible_id = responsible_id;
  if (due_date !== undefined) task.due_date = due_date || undefined;
  if (recurrence) task.recurrence = recurrence;
  if (category) task.category = category;
  if (priority) {
    task.priority = priority;
    task.points = priority === TaskPriority.URGENTE ? 25 : 10;
  }
  if (time_estimate !== undefined) task.time_estimate = time_estimate ? parseInt(time_estimate, 10) : undefined;

  db.saveStore();
  res.json({ success: true, task });
});

app.post("/api/tasks/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const initialLen = store.tasks.length;
  store.tasks = store.tasks.filter(t => t.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.tasks.length });
});

// Events
app.post("/api/events/update", (req, res) => {
  const { id, title, description, type, start_time, end_time, location, booking_link, responsible_id } = req.body;
  const store = db.getStore();
  const event = store.events.find(e => e.id === id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  if (title) event.title = title;
  if (description !== undefined) event.description = description;
  if (type) event.type = type;
  if (start_time) event.start_time = start_time;
  if (end_time !== undefined) event.end_time = end_time || undefined;
  if (location !== undefined) event.location = location || undefined;
  if (booking_link !== undefined) event.booking_link = booking_link || undefined;
  if (responsible_id) event.responsible_id = responsible_id;

  db.saveStore();
  res.json({ success: true, event });
});

app.post("/api/events/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const initialLen = store.events.length;
  store.events = store.events.filter(e => e.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.events.length });
});

// Memories
app.post("/api/memories/update", (req, res) => {
  const { id, description, date, location, album_name, is_capsule, capsule_unlock_date } = req.body;
  const store = db.getStore();
  const memory = store.memories.find(m => m.id === id);
  if (!memory) {
    return res.status(404).json({ error: "Memory not found" });
  }
  if (description !== undefined) memory.description = description;
  if (date !== undefined) memory.date = date;
  if (location !== undefined) memory.location = location;
  if (album_name !== undefined) memory.album_name = album_name;
  if (is_capsule !== undefined) memory.is_capsule = !!is_capsule;
  if (capsule_unlock_date !== undefined) memory.capsule_unlock_date = capsule_unlock_date || undefined;

  db.saveStore();
  res.json({ success: true, memory });
});

app.post("/api/memories/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const initialLen = store.memories.length;
  store.memories = store.memories.filter(m => m.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.memories.length });
});

// Wishlist
app.post("/api/wishlist/update", (req, res) => {
  const { id, name, link, estimated_price, priority, is_private_to_partner, category, saving_goal } = req.body;
  const store = db.getStore();
  const wishlist = store.wishlist.find(w => w.id === id);
  if (!wishlist) {
    return res.status(404).json({ error: "Wishlist item not found" });
  }
  if (name) wishlist.name = name;
  if (link !== undefined) wishlist.link = link;
  if (estimated_price !== undefined) wishlist.estimated_price = estimated_price ? parseFloat(estimated_price) : undefined;
  if (priority) wishlist.priority = priority;
  if (is_private_to_partner !== undefined) wishlist.is_private_to_partner = !!is_private_to_partner;
  if (category) wishlist.category = category;
  if (saving_goal !== undefined) {
    wishlist.saving_goal = saving_goal ? parseFloat(saving_goal) : undefined;
    if (saving_goal && wishlist.saving_saved === undefined) {
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
  store.wishlist = store.wishlist.filter(w => w.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.wishlist.length });
});

// Recipes
app.post("/api/recipes/update", (req, res) => {
  const { id, title, ingredients, instructions, duration, portions, couple_rating, tags, photo_url } = req.body;
  const store = db.getStore();
  const recipe = store.recipes.find(r => r.id === id);
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }
  if (title) recipe.title = title;
  if (ingredients !== undefined) recipe.ingredients = Array.isArray(ingredients) ? ingredients : [ingredients];
  if (instructions !== undefined) recipe.instructions = instructions;
  if (duration !== undefined) recipe.duration = duration ? parseInt(duration, 10) : 30;
  if (portions !== undefined) recipe.portions = portions ? parseInt(portions, 10) : 2;
  if (couple_rating !== undefined) recipe.couple_rating = couple_rating || undefined;
  if (tags !== undefined) recipe.tags = tags || [];
  if (photo_url !== undefined) recipe.photo_url = photo_url;

  db.saveStore();
  res.json({ success: true, recipe });
});

app.post("/api/recipes/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  const initialLen = store.recipes.length;
  store.recipes = store.recipes.filter(r => r.id !== id);
  db.saveStore();
  res.json({ success: true, count: initialLen - store.recipes.length });
});


// ================= PET MODULE ENDPOINTS =================

app.post("/api/pets/create", (req, res) => {
  const { name, species, breed, age, avatar_url, food_daily_qty, food_inventory_item_id } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Pet name is required" });
  }

  const store = db.getStore();
  if (!store.pets) store.pets = [];

  const newPet: Pet = {
    id: "pet_" + Date.now(),
    name,
    species: species || "Outros",
    breed: breed || "",
    age: age ? parseInt(age, 10) : undefined,
    avatar_url: avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300",
    vaccines: [],
    medications: [],
    weights: [],
    documents: [],
    food_daily_qty: food_daily_qty ? parseInt(food_daily_qty, 10) : undefined,
    food_inventory_item_id: food_inventory_item_id || undefined
  };

  store.pets.push(newPet);
  logActivity(store, "pet_added", `Novo pet registrado no lar: ${name}! 🐾`);
  db.saveStore();
  res.json({ success: true, pet: newPet });
});

app.post("/api/pets/update", (req, res) => {
  const { id, name, species, breed, age, avatar_url, vaccines, medications, weights, documents, food_daily_qty, food_inventory_item_id } = req.body;
  const store = db.getStore();
  if (!store.pets) store.pets = [];

  const pet = store.pets.find(p => p.id === id);
  if (!pet) {
    return res.status(404).json({ error: "Pet not found" });
  }

  if (name) pet.name = name;
  if (species !== undefined) pet.species = species;
  if (breed !== undefined) pet.breed = breed;
  if (age !== undefined) pet.age = age ? parseInt(age, 10) : undefined;
  if (avatar_url !== undefined) pet.avatar_url = avatar_url;
  if (vaccines !== undefined) pet.vaccines = vaccines;
  if (medications !== undefined) pet.medications = medications;
  if (weights !== undefined) pet.weights = weights;
  if (documents !== undefined) pet.documents = documents;
  if (food_daily_qty !== undefined) pet.food_daily_qty = food_daily_qty ? parseInt(food_daily_qty, 10) : undefined;
  if (food_inventory_item_id !== undefined) pet.food_inventory_item_id = food_inventory_item_id;

  // Let's check food integration! "Controle de ração e alimentação: can deduct and triggers shopping if low"
  // If we update food and we have food_inventory_item_id, let's verify if the connected inventory item exists
  // and trigger checks if needed.
  if (pet.food_inventory_item_id) {
    const invItem = store.inventory.find(i => i.id === pet.food_inventory_item_id);
    if (invItem && invItem.quantity < invItem.min_quantity) {
      // already handled, or let's double trigger
      const today = new Date();
      const currentMonthId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const lowercaseName = invItem.name.trim().toLowerCase();
      const exists = store.shopping.find(
        (s: any) => !s.is_bought && 
             (s.monthId === currentMonthId) && 
             s.name.trim().toLowerCase() === lowercaseName
      );
      if (!exists) {
        const newShopItem = {
          id: "shop_inv_" + Date.now(),
          name: invItem.name,
          category: ShoppingCategory.OUTROS,
          quantity: Math.max(1, Math.ceil(invItem.min_quantity - invItem.quantity)),
          unit: invItem.unit,
          price: 0,
          is_bought: false,
          added_by: "Fome do Pet (" + pet.name + ")",
          monthId: currentMonthId,
          coupleId: pet.coupleId
        };
        store.shopping.push(newShopItem as any);
        logActivity(store, "pet_food_low", `Ração de '${pet.name}' acabando (${invItem.quantity} ${invItem.unit}). Item adicionado às compras!`);
      }
    }
  }

  db.saveStore();
  res.json({ success: true, pet });
});

app.post("/api/pets/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  if (!store.pets) store.pets = [];
  
  const pet = store.pets.find(p => p.id === id);
  if (pet) {
    store.pets = store.pets.filter(p => p.id !== id);
    logActivity(store, "pet_deleted", `Pet removido do lar: ${pet.name}`);
    db.saveStore();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Pet not found" });
  }
});


// ================= BUDGET BY CATEGORY =================

app.post("/api/budget/set", (req, res) => {
  const { category, limit } = req.body;
  const { coupleId } = getRequestCredentials(req);
  const store = db.getStore();
  const { couple } = getCoupleAndUsers(store, coupleId as string);

  if (!couple.expenseBudgets) {
    couple.expenseBudgets = {} as any;
  }
  (couple.expenseBudgets as any)[category] = parseFloat(limit);
  db.saveStore();
  res.json({ success: true, budgets: couple.expenseBudgets });
});

// ================= TASK TRANSFER =================

app.post("/api/tasks/transfer", (req, res) => {
  const { id, to_user_id, note } = req.body;
  const { userId } = getRequestCredentials(req);
  const store = db.getStore();
  const task = store.tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  task.transferred_from = task.responsible_id;
  task.responsible_id = to_user_id;
  if (note) {
    task.transfer_note = note;
    task.comments.push({
      id: "comment_" + Date.now(),
      author_id: userId as string,
      text: `🔄 Transferida de ${task.transferred_from}: "${note}"`,
      timestamp: new Date().toISOString()
    });
  }

  logActivity(store, "task_transferred", `${userId} transferiu tarefa "${task.title}" para ${to_user_id}`);
  db.saveStore();
  res.json({ success: true, task });
});

// ================= FIXED HOUSEHOLD FUNCTIONS =================

app.post("/api/fixed-functions/create", (req, res) => {
  const { title, responsible_id, frequency, category, rotation_enabled } = req.body;
  if (!title || !responsible_id || !frequency) {
    return res.status(400).json({ error: "Title, responsible and frequency are required" });
  }

  const store = db.getStore();
  if (!store.fixedFunctions) store.fixedFunctions = [];

  const newFunction: FixedFunction = {
    id: "func_" + Date.now(),
    title,
    responsible_id,
    frequency,
    category: category || TaskCategory.OUTRO,
    rotation_enabled: !!rotation_enabled,
    current_rotation_owner: responsible_id,
    completion_history: [],
    active: true
  };

  store.fixedFunctions.push(newFunction);
  logActivity(store, "function_created", `Nova rotina fixa: ${title} (${frequency})`);
  db.saveStore();
  res.json({ success: true, func: newFunction });
});

app.post("/api/fixed-functions/toggle-complete", (req, res) => {
  const { id, user_id } = req.body;
  const store = db.getStore();
  if (!store.fixedFunctions) store.fixedFunctions = [];

  const func = store.fixedFunctions.find(f => f.id === id);
  if (!func) {
    return res.status(404).json({ error: "Function not found" });
  }

  const today = new Date().toISOString().split("T")[0];
  const alreadyCompletedToday = func.completion_history.some(h => h.date === today);

  if (alreadyCompletedToday) {
    func.completion_history = func.completion_history.filter(h => h.date !== today);
  } else {
    func.completion_history.push({ date: today, completed_by: user_id });

    if (func.rotation_enabled) {
      const otherUser = func.current_rotation_owner === "Leandro" ? "Kaisa" : "Leandro";
      func.current_rotation_owner = otherUser;
      logActivity(store, "function_rotated", `${func.title} agora é responsabilidade de ${otherUser}`);
    }
  }

  db.saveStore();
  res.json({ success: true, func });
});

app.post("/api/fixed-functions/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  if (!store.fixedFunctions) store.fixedFunctions = [];
  store.fixedFunctions = store.fixedFunctions.filter(f => f.id !== id);
  db.saveStore();
  res.json({ success: true });
});

// ================= ACTIVITY REACTIONS =================

app.post("/api/reactions/add", (req, res) => {
  const { activity_id, emoji } = req.body;
  const { coupleId, userId } = getRequestCredentials(req);
  const store = db.getStore();
  if (!store.activityReactions) store.activityReactions = [];

  const existing = store.activityReactions.find(
    r => r.activity_id === activity_id && r.user_id === userId
  );

  if (existing) {
    existing.emoji = emoji;
    existing.timestamp = new Date().toISOString();
  } else {
    const reaction: ActivityReaction = {
      id: "react_" + Date.now(),
      activity_id,
      user_id: userId as string,
      emoji,
      timestamp: new Date().toISOString()
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
    r => !(r.activity_id === activity_id && r.user_id === userId)
  );
  db.saveStore();
  res.json({ success: true });
});

// ================= MONTHLY FIXED ACCOUNTS =================

app.post("/api/monthly-accounts/create", (req, res) => {
  const { name, value, due_day, paid_by_id, category } = req.body;
  if (!name || !value || !due_day) {
    return res.status(400).json({ error: "Name, value and due_day are required" });
  }

  const store = db.getStore();
  if (!store.monthlyAccounts) store.monthlyAccounts = [];

  // Check for duplicate
  const exists = store.monthlyAccounts.some(a => a.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return res.json({ warning: "Conta já existe" });
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
  logActivity(store, "account_added", `Conta fixa adicionada: ${name} - R$ ${value}`);
  db.saveStore();
  res.json({ success: true, account: newAccount });
});

app.post("/api/monthly-accounts/toggle-paid", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  if (!store.monthlyAccounts) store.monthlyAccounts = [];

  const account = store.monthlyAccounts.find(a => a.id === id);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  account.paid_this_month = !account.paid_this_month;

  if (account.paid_this_month) {
    account.paid_month = currentMonth;
    if (!account.payment_history) account.payment_history = [];
    account.payment_history.push({ month: currentMonth, paid: true });
    logActivity(store, "account_paid", `Conta "${account.name}" paga!`);
  }

  db.saveStore();
  res.json({ success: true, account });
});

app.post("/api/monthly-accounts/delete", (req, res) => {
  const { id } = req.body;
  const store = db.getStore();
  if (!store.monthlyAccounts) store.monthlyAccounts = [];
  store.monthlyAccounts = store.monthlyAccounts.filter(a => a.id !== id);
  db.saveStore();
  res.json({ success: true });
});


// ==========================================
// VITE SETUP / STATIC DELIVERY SYSTEM
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting backend dev server and injecting Vite client-side SPA bundle...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NósDois Server running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
