/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import PetsTab from "./components/PetsTab";
import HouseTab from "./components/HouseTab";
import { Hop as HomeIcon, SquareCheck as CheckSquare, Calendar as CalendarIcon, ShoppingBag, MoveHorizontal as MoreHorizontal, Sparkles, Heart, Plus, MessageSquare, Trash2, DollarSign, Image as ImageIcon, Smile, Settings, Users, RotateCcw, TriangleAlert as AlertTriangle, ArrowRight, Clipboard, MapPin, Gift, Clock, ShieldAlert, ChevronRight, Sparkle, BookOpen, Info, Award, Trophy, Check, CreditCard as Edit, Archive } from "lucide-react";
import {
  TaskCategory,
  TaskPriority,
  EventType,
  ShoppingCategory,
  ExpenseCategory,
  MoodType,
  WishlistCategory,
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
  HouseStatus,
  WeeklySummary,
  StoreType,
  FixedFunction,
  MonthlyAccount
} from "./types";

// Helper to parse quick-add items for the shopping list (Brazilian Portuguese style)
const parseQuickAddItem = (raw: string) => {
  const text = raw.trim();
  if (!text) return null;

  // Pattern matches e.g. "3.5 kg de batata", "2caixas suco", "5 l de refrigerante", "300g queijo"
  // Group 1: quantity, Group 2: unit string, Group 3: name
  const match = text.match(/^(\d+(?:[.,]\d+)?)\s*(litros?|l|mils?|ml|g|kg?|potes?|pacotes?|pct|unidades?|un|latas?|cx|caixas?|caixinha?s?|vidros?|bandejas?|sachês?|folhas?|unid?)\s*(?:de\s+)?(.*)$/i);

  if (match) {
    const qNum = parseFloat(match[1].replace(",", "."));
    const rawUnit = match[2]?.toLowerCase() || "";
    const rawName = match[3]?.trim();

    if (rawName) {
      let unit = "Unidades";
      if (["l", "litro", "litros"].includes(rawUnit)) unit = "Litros";
      else if (["ml", "mil", "mils"].includes(rawUnit)) unit = "ml";
      else if (["g"].includes(rawUnit)) unit = "g";
      else if (["kg", "k"].includes(rawUnit)) unit = "kg";
      else if (["pacote", "pacotes", "pct"].includes(rawUnit)) unit = "Pacotes";
      else if (["cx", "caixa", "caixas", "caixinha", "caixinhas"].includes(rawUnit)) unit = "Caixas";
      else if (["lata", "latas"].includes(rawUnit)) unit = "Latas";
      else if (["un", "unid", "unidade", "unidades"].includes(rawUnit)) unit = "Unidades";
      else if (rawUnit) unit = rawUnit.charAt(0).toUpperCase() + rawUnit.slice(1); // capitalize other units

      return { name: rawName, quantity: qNum, unit };
    }
  }

  // Simple text match starting with number e.g. "3 ovos"
  const simpleMatch = text.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (simpleMatch) {
    const qNum = parseFloat(simpleMatch[1].replace(",", "."));
    const rawName = simpleMatch[2].trim();
    if (rawName) {
      return { name: rawName, quantity: qNum, unit: "Unidades" };
    }
  }

  // Default
  return { name: text, quantity: 1, unit: "Unidades" };
};

export default function App() {
  // Authenticated state variables
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem("nosdois_userId");
  });
  
  const [coupleId, setCoupleId] = useState<string | null>(() => {
    return localStorage.getItem("nosdois_coupleId");
  });

  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(() => {
    return localStorage.getItem("nosdois_email");
  });

  // Dynamic fetch wrapper to append tenancy headers and parameters
  const appFetch = async (url: string, options: any = {}) => {
    const activeCoupleId = coupleId || localStorage.getItem("nosdois_coupleId") || "couple_1";
    const activeUserId = currentUser || localStorage.getItem("nosdois_userId") || "Leandro";

    const headers = {
      "Content-Type": "application/json",
      "x-couple-id": activeCoupleId,
      "x-user-id": activeUserId,
      ...(options.headers || {})
    };

    let body = options.body;
    if (body) {
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed === "object" && parsed !== null) {
          parsed.coupleId = activeCoupleId;
          parsed.userId = activeUserId;
          body = JSON.stringify(parsed);
        }
      } catch (e) {
        // non-JSON
      }
    }

    const cleanUrl = url.split("?")[0];
    const prevParams = url.split("?")[1] || "";
    const searchParams = new URLSearchParams(prevParams);
    searchParams.set("coupleId", activeCoupleId);
    searchParams.set("userId", activeUserId);

    return fetch(`${cleanUrl}?${searchParams.toString()}`, {
      ...options,
      headers,
      body
    });
  };
  
  // Entire DB State loaded from Express
  const [state, setState] = useState<{
    users: { [key: string]: User };
    couple: Couple;
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
    fixedFunctions?: any[];
    activityReactions?: any[];
    monthlyAccounts?: any[];
  } | null>(null);

  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState<"home" | "tasks" | "agenda" | "shopping" | "more">("home");
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("nosdois_darkMode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    localStorage.setItem("nosdois_darkMode", String(darkMode));
  }, [darkMode]);
  
  // More tab sub-categories
  const currentInitialMonth = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const [moreSubTab, setMoreSubTab] = useState<"finances" | "gamification" | "memories" | "mood" | "wishlist" | "recipes" | "settings" | "pets" | "house">("finances");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentInitialMonth); // default to current month
  const [financeActiveTab, setFinanceActiveTab] = useState<"dashboard" | "list" | "cards">("dashboard");

  // Custom Toast Notifications & Beautiful Dialog Confirms
  const [customNotify, setCustomNotify] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{ message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);

  const triggerCustomNotify = (msg: string, type: "success" | "error" | "info" = "success") => {
    setCustomNotify({ message: msg, type });
    setTimeout(() => {
      setCustomNotify(prev => prev && prev.message === msg ? null : prev);
    }, 4500);
  };

  const triggerCustomConfirm = (msg: string, action: () => void) => {
    setCustomConfirm({
      message: msg,
      onConfirm: () => {
        action();
        setCustomConfirm(null);
      },
      onCancel: () => {
        setCustomConfirm(null);
      }
    });
  };

  // Input states & Modal sheets triggers
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [recipeImportModalOpen, setRecipeImportModalOpen] = useState(false);

  // New item draft states
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskResp, setNewTaskResp] = useState<"Leandro" | "Kaisa" | "Ambos">("Ambos");
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>(TaskCategory.COZINHA);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.NORMAL);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<"Nenhuma" | "Diária" | "Semanal" | "Quinzenal" | "Mensal">("Nenhuma");
  const [newTaskEstimate, setNewTaskEstimate] = useState("");

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventType, setNewEventType] = useState<EventType>(EventType.COMPROMISSO);
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventBooking, setNewEventBooking] = useState("");
  const [newEventResp, setNewEventResp] = useState<"Leandro" | "Kaisa" | "Ambos">("Ambos");

  const [newShopName, setNewShopName] = useState("");
  const [newShopCategory, setNewShopCategory] = useState<string>("");
  const [newShopQty, setNewShopQty] = useState("1");
  const [newShopUnit, setNewShopUnit] = useState("unidades");
  const [newShopPrice, setNewShopPrice] = useState("");

  const [newExpenseValue, setNewExpenseValue] = useState("");
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpensePaidBy, setNewExpensePaidBy] = useState<"Leandro" | "Kaisa">("Leandro");
  const [newExpenseSplit, setNewExpenseSplit] = useState<"50/50" | "paid_all" | "partner_all" | "custom">("50/50");
  const [newExpenseCustomPct, setNewExpenseCustomPct] = useState("50");
  const [newExpenseCategory, setNewExpenseCategory] = useState<ExpenseCategory>(ExpenseCategory.ALIMENTACAO);
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [newExpenseRecurring, setNewExpenseRecurring] = useState(false);
  const [newExpensePaymentMethod, setNewExpensePaymentMethod] = useState<string>("Pix");
  const [newExpenseCardName, setNewExpenseCardName] = useState("");
  const [newExpenseIsInstallment, setNewExpenseIsInstallment] = useState(false);
  const [newExpenseInstallmentsTotal, setNewExpenseInstallmentsTotal] = useState("10");
  const [newExpenseInstallmentsCurrent, setNewExpenseInstallmentsCurrent] = useState("1");
  const [newExpenseMonthlyInstallmentValue, setNewExpenseMonthlyInstallmentValue] = useState("");

  const [newMemoryUrl, setNewMemoryUrl] = useState("");
  const [newMemoryDesc, setNewMemoryDesc] = useState("");
  const [newMemoryDate, setNewMemoryDate] = useState(new Date().toISOString().split("T")[0]);
  const [newMemoryLoc, setNewMemoryLoc] = useState("");
  const [newMemoryAlbum, setNewMemoryAlbum] = useState("Geral");
  const [newMemoryIsCapsule, setNewMemoryIsCapsule] = useState(false);
  const [newMemoryUnlockDate, setNewMemoryUnlockDate] = useState("");

  const [newWishName, setNewWishName] = useState("");
  const [newWishLink, setNewWishLink] = useState("");
  const [newWishPrice, setNewWishPrice] = useState("");
  const [newWishPriority, setNewWishPriority] = useState<"Baixa" | "Média" | "Alta">("Média");
  const [newWishPrivate, setNewWishPrivate] = useState(false);
  const [newWishCategory, setNewWishCategory] = useState<WishlistCategory>(WishlistCategory.LAR);
  const [newWishGoal, setNewWishGoal] = useState("");

  const [newRecipeTitle, setNewRecipeTitle] = useState("");
  const [newRecipeIngreds, setNewRecipeIngreds] = useState("");
  const [newRecipeInst, setNewRecipeInst] = useState("");
  const [newRecipeDuration, setNewRecipeDuration] = useState("30");
  const [newRecipePortions, setNewRecipePortions] = useState("2");
  const [newRecipeTags, setNewRecipeTags] = useState("");
  
  const [importRecipeUrl, setImportRecipeUrl] = useState("");

  // New customized states for Modo Foco, rewards, and quests
  const [taskViewMode, setTaskViewMode] = useState<"mural" | "person" | "room" | "focus">("mural");
  const [showAddReward, setShowAddReward] = useState(false);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardCost, setNewRewardCost] = useState("");
  const [newRewardDesc, setNewRewardDesc] = useState("");
  const [newRewardEmoji, setNewRewardEmoji] = useState("🎁");
  
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDesc, setNewQuestDesc] = useState("");
  const [newQuestPoints, setNewQuestPoints] = useState("20");
  const [newQuestType, setNewQuestType] = useState("Afeto");
  const [newQuestTargetCount, setNewQuestTargetCount] = useState("");

  // Contextual Chat comment drafts
  const [activeChatType, setActiveChatType] = useState<"task" | "event" | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");

  // Check-In Emocional individual drafts
  const [myMood, setMyMood] = useState<MoodType>(MoodType.BEM);
  const [myMoodNote, setMyMoodNote] = useState("");
  const [myMoodShare, setMyMoodShare] = useState(true);

  // Manual stock editing
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockQty, setEditingStockQty] = useState("");

  // Individual component edit states
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editingMemory, setEditingMemory] = useState<any | null>(null);
  const [editingWishlist, setEditingWishlist] = useState<any | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);

  // Photo proof inline input per task
  const [photoProofTaskId, setPhotoProofTaskId] = useState<string | null>(null);
  const [photoProofUrl, setPhotoProofUrl] = useState("");

  // Wishlist savings inline input
  const [savingsInputId, setSavingsInputId] = useState<string | null>(null);
  const [savingsAmount, setSavingsAmount] = useState("");

  // Meal plan inline edit
  const [editingMealPlanSlot, setEditingMealPlanSlot] = useState<{ day: string; meal: string } | null>(null);
  const [editingMealText, setEditingMealText] = useState("");

  // Quick Add Shopping items text
  const [quickAddText, setQuickAddText] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  // Local profile editing states to avoid keystroke lag/focus loss
  const [profileAvatarLocal, setProfileAvatarLocal] = useState<string | null>(null);
  const [profileNicknameLocal, setProfileNicknameLocal] = useState<string | null>(null);
  const [profileNameLocal, setProfileNameLocal] = useState<string | null>(null);
  const [profileOwnNicknameLocal, setProfileOwnNicknameLocal] = useState<string | null>(null);
  const [profileLoveLanguageLocal, setProfileLoveLanguageLocal] = useState<string | null>(null);
  const [profilePaymentMethodLocal, setProfilePaymentMethodLocal] = useState<string | null>(null);
  const [profileNotificationsLocal, setProfileNotificationsLocal] = useState<boolean | null>(null);

  // Monthly shopping lists states
  const [selectedMonthId, setSelectedMonthId] = useState<string>(currentInitialMonth);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [finalizePaymentMethod, setFinalizePaymentMethod] = useState<string>("VR");
  const [finalizeTotalSpent, setFinalizeTotalSpent] = useState<string>("");
  const [finalizePaidBy, setFinalizePaidBy] = useState<string>("Leandro");
  const [finalizeCarryOver, setFinalizeCarryOver] = useState<boolean>(true);
  const [isCreatingNewMonth, setIsCreatingNewMonth] = useState(false);
  const [newMonthValue, setNewMonthValue] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showAdvancedShopping, setShowAdvancedShopping] = useState(false);

  // Fetch full state on load
  const loadState = async () => {
    const activeCoupleId = coupleId || localStorage.getItem("nosdois_coupleId");
    if (!activeCoupleId) {
      return;
    }
    try {
      const response = await appFetch("/api/state");
      const data = await response.json();
      setState(data);
    } catch (err) {
      console.error("Erro ao carregar estado do banco:", err);
    }
  };

  useEffect(() => {
    if (coupleId) {
      loadState();
      // Dynamic real-time synchronization polling (Sincronização em tempo real oficial)
      const interval = setInterval(() => {
        loadState();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [coupleId, currentUser]);

  if (!coupleId) {
    return (
      <AuthScreen
        onAuthSuccess={(uId, cId, email) => {
          localStorage.setItem("nosdois_userId", uId);
          localStorage.setItem("nosdois_coupleId", cId);
          localStorage.setItem("nosdois_email", email);
          
          setCurrentUser(uId as "Leandro" | "Kaisa");
          setCoupleId(cId);
          setLoggedInEmail(email);
          
          setTimeout(() => {
            loadState();
          }, 100);
        }}
      />
    );
  }

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-violet-50 text-violet-950 p-6">
        <Heart className="w-12 h-12 text-pink-500 animate-pulse mb-3" />
        <p className="text-lg font-medium font-display">Carregando o Lar do Casal...</p>
        <p className="text-sm text-gray-400 mt-1">Conectando ao banco seguro NósDois</p>
      </div>
    );
  }

  const { 
    users = {}, 
    couple = {} as any,
    tasks = [],
    events = [],
    shopping = [],
    expenses = [],
    memories = [],
    moods = [],
    wishlist = [],
    recipes = [],
    mealPlan = [],
    inventory = [],
    rewards = [],
    quests = [],
    quickNotes = [],
    pets = [],
    fixedFunctions = [],
    activityReactions = [],
    monthlyAccounts = []
  } = state || {};

  // Determine partner object dynamically based on database keys
  const userKeys = Object.keys(users);
  const firstUserId = userKeys[0] || "Leandro";
  const secondUserId = userKeys[1] || "Kaisa";
  const partnerId = currentUser === firstUserId ? secondUserId : firstUserId;
  const userObj = (users && currentUser && users[currentUser]) || {
    id: currentUser || "Leandro",
    name: currentUser || "Leandro",
    partner_nickname: "Amor",
    color: "#3B82F6",
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    points_weekly: 0
  };
  const partnerObj = (users && users[partnerId]) || {
    id: partnerId,
    name: partnerId,
    partner_nickname: "Vida",
    color: "#EC4899",
    timezone: "America/Sao_Paulo",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    points_weekly: 0
  };

  // Derive "Saúde do Lar" Macro Indicator (Rule v1.2 specifications)
  // Default is "Tudo em ordem" or "Casa equilibrada" depending on tasks overdue
  const todayStr = new Date().toISOString().split("T")[0];
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueTasks = pendingTasks.filter(t => t.due_date && t.due_date < todayStr);

  let houseStatus: HouseStatus = {
    status: "order",
    headline: "✨ Tudo em ordem",
    description: "Excelente trabalho! Vocês estão em perfeita sintonia e o lar brilha."
  };

  if (overdueTasks.length > 3) {
    houseStatus = {
      status: "reorganize",
      headline: "🚨 Precisam reorganizar a semana",
      description: "Acúmulo crítico de prazos! Que tal sentar 10 min e redividir os pesos das pendências?"
    };
  } else if (overdueTasks.length > 0) {
    houseStatus = {
      status: "accumulating",
      headline: "⚠️ Rotina acumulando",
      description: "Algumas responsabilidades venceram nos cantos da casa. Hora do mutirão da tarde!"
    };
  } else if (pendingTasks.length > 5) {
    houseStatus = {
      status: "balanced",
      headline: "🏡 Casa equilibrada",
      description: "Várias tarefas pendentes, mas nenhuma atrasada. O ritmo está sustentável!"
    };
  }

  // Derive "Modo Crise" (Triggered automatically if both reported MoodType.CANSADO or BAD)
  // Let's check today's checkins
  const leandroTodayMood = moods.find(m => m.user_id === firstUserId && m.date === todayStr);
  const kaisaTodayMood = moods.find(m => m.user_id === secondUserId && m.date === todayStr);
  
  const isLeandroLow = leandroTodayMood && (leandroTodayMood.mood === MoodType.CANSADO || leandroTodayMood.mood === MoodType.BAIXA || leandroTodayMood.mood === MoodType.ANSIOSO);
  const isKaisaLow = kaisaTodayMood && (kaisaTodayMood.mood === MoodType.CANSADO || kaisaTodayMood.mood === MoodType.BAIXA || kaisaTodayMood.mood === MoodType.ANSIOSO);
  const isCriseModeActive = isLeandroLow && isKaisaLow;

  // Next special date
  const upcomingSpecialEvent = events
    .filter(e => e.type === EventType.DATA_ESPECIAL && e.start_time >= todayStr)
    .sort((a,b) => a.start_time.localeCompare(b.start_time))[0];

  const getDaysCountdown = (dateString: string) => {
    const diffTime = new Date(dateString).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  // Helper APIs Wrapper
  const handleAction = async (endpoint: string, payload: any) => {
    try {
      const response = await appFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        await loadState();
      }
    } catch (err) {
      console.error(`Erro ao postar ação no endpoint ${endpoint}:`, err);
    }
  };

  const handleUpdateShopItem = async (id: string, fields: any) => {
    // Optimistic Update
    setState((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        shopping: prev.shopping.map((item: any) => {
          if (item.id === id) {
            return { ...item, ...fields };
          }
          return item;
        })
      };
    });

    try {
      const response = await appFetch("/api/shopping/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields })
      });
      const result = await response.json();
      if (!result.success) {
        await loadState();
      }
    } catch (err) {
      console.error("Erro ao atualizar item de compra:", err);
      await loadState();
    }
  };

  const handleReset = async () => {
    triggerCustomConfirm("Deseja realmente reiniciar todos os dados para a demonstração original do casal?", async () => {
      await handleAction("/api/profile/reset", {});
    });
  };

  const getUrgencyColor = (p: TaskPriority) => {
    if (p === TaskPriority.URGENTE) return "bg-red-50 text-red-600 border border-red-200";
    if (p === TaskPriority.NORMAL) return "bg-blue-50 text-blue-600 border border-blue-200";
    return "bg-emerald-50 text-emerald-600 border border-emerald-100";
  };

  // Finance calculator
  const getExpenseMonthlyVal = (e: Expense) => {
    if (e.payment_method === "Crédito" && e.installments_total && e.installments_total > 1) {
      return e.monthly_installment_value || (e.value / e.installments_total);
    }
    return e.value;
  };

  const dynamicFilteredExpenses = expenses.filter(e => {
    if (selectedMonth === "all") return true;
    return e.date && e.date.substring(0, 7) === selectedMonth;
  });

  const totalAmountPaid = dynamicFilteredExpenses.reduce((sum, e) => sum + getExpenseMonthlyVal(e), 0);
  const leandroPaid = dynamicFilteredExpenses.filter(e => e.paid_by_id === firstUserId).reduce((sum, e) => sum + getExpenseMonthlyVal(e), 0);
  const kaisaPaid = dynamicFilteredExpenses.filter(e => e.paid_by_id === secondUserId).reduce((sum, e) => sum + getExpenseMonthlyVal(e), 0);
  
  // Calculate exact debt balance with non-judgmental calculations
  // Split type parsing
  let leandroTargetPayShare = 0;
  dynamicFilteredExpenses.forEach(e => {
    const cost = getExpenseMonthlyVal(e);
    if (e.split_type === "50/50") {
      leandroTargetPayShare += cost * 0.5;
    } else if (e.split_type === "paid_all") {
      leandroTargetPayShare += cost; // leandro completely covers
    } else if (e.split_type === "partner_all") {
      leandroTargetPayShare += 0; // kaisa completely covers
    } else if (e.split_type === "custom") {
      const pct = (e.custom_percent ?? 50) / 100;
      leandroTargetPayShare += cost * pct;
    }
  });

  const leandroOwes = leandroTargetPayShare;
  const netBalance = leandroPaid - leandroOwes; // positive means Kaisa owes Leandro, negative means Leandro owes Kaisa

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 text-slate-900 selection:bg-violet-200 w-full max-w-full" id="main-container">
      


      {/* GLOBAL SYSTEM LEVEL ALERT - MODO CRISE */}
      {isCriseModeActive && (
        <div className="bg-gradient-to-r from-pink-500/10 to-violet-500/10 text-violet-950 px-4 py-3 border-y border-pink-200 text-sm flex items-center gap-3 animate-pulse-subtle" id="crisis-banner">
          <ShieldAlert className="w-5 h-5 text-pink-600 shrink-0" />
          <div>
            <p className="font-bold">✨ Modo Acolhimento Ativado</p>
            <p className="text-xs text-violet-800">
              Notei que ambos andam muito cansados hoje. Silenciamos as cobranças, suavizamos a linguagem de finanças e trouxemos um abraço digital pra vocês. Vai dar tudo certo!
            </p>
          </div>
        </div>
      )}

      {/* RESPONSIVE LAYOUT CONTAINER FOR DESKTOP (SIDEBAR + MAIN) AND MOBILE */}
      <div className="flex flex-col md:flex-row flex-1 max-w-7xl w-full mx-auto md:p-6 md:gap-6 min-h-0 md:h-[calc(100vh-45px)] overflow-y-auto md:overflow-hidden" id="responsive-wrapper">
        
        {/* DESKTOP BRAND & NAVIGATION SIDEBAR (Visible only on md: screens and above) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border border-slate-100/80 rounded-3xl p-5 shadow-xs sticky top-6 self-start max-h-[calc(100vh-48px)] overflow-y-auto select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-350 shrink-0" id="desktop-sidebar">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1" id="sidebar-brand">
              <span className="text-xl">🏡</span>
              <span className="font-extrabold font-display text-slate-800 text-lg tracking-tight">NósDois</span>
            </div>
            
            {/* House status & level header badge */}
            <div 
              className="bg-violet-50/50 border border-violet-100 p-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-violet-150 transition" 
              id="sidebar-house-level"
              onClick={() => {
                setActiveTab('more');
                setMoreSubTab('gamification');
              }}
            >
              <Trophy className="w-5 h-5 text-amber-500 animate-bounce" style={{ animationDuration: '3s' }} />
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Conquista do Lar</p>
                <p className="text-xs font-semibold text-violet-900">Nível {couple.home_level} da Casa</p>
              </div>
            </div>

            {/* Sidebar main navigation links */}
            <nav className="flex flex-col gap-1" id="sidebar-nav">
              {[
                { tab: 'home', label: 'Início / Painel', icon: <HomeIcon className="w-4 h-4" /> },
                { tab: 'tasks', label: 'Grade de Tarefas', icon: <CheckSquare className="w-4 h-4" /> },
                { tab: 'agenda', label: 'Agenda & Compromissos', icon: <CalendarIcon className="w-4 h-4" /> },
                { tab: 'shopping', label: 'Carrinho de Compras', icon: <ShoppingBag className="w-4 h-4" /> }
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab as any)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition text-xs font-semibold ${
                    activeTab === item.tab 
                      ? "bg-violet-600 text-white shadow-sm" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="border-t border-slate-100 my-2"></div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider px-2.5 mb-1.5">Módulos do Casal</p>

              {[
                { s: 'finances', label: 'Finanças Seguras', icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> },
                { s: 'gamification', label: 'Conquistas & Nível', icon: <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" /> },
                { s: 'memories', label: 'Álbum de Fotos', icon: <ImageIcon className="w-3.5 h-3.5 text-pink-500 shrink-0" /> },
                { s: 'mood', label: 'Insights & Humores', icon: <Smile className="w-3.5 h-3.5 text-sky-500 shrink-0" /> },
                { s: 'wishlist', label: 'Lista de Desejos', icon: <Gift className="w-3.5 h-3.5 text-orange-400 shrink-0" /> },
                { s: 'recipes', label: 'Receitas & Cardápio', icon: <BookOpen className="w-3.5 h-3.5 text-teal-500 shrink-0" /> },
                { s: 'pets', label: 'Controle de Pets', icon: <Heart className="w-3.5 h-3.5 text-teal-600 shrink-0" /> },
                { s: 'house', label: 'Casa & Contatos', icon: <HomeIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" /> },
                { s: 'settings', label: 'Perfis do Casal', icon: <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" /> }
              ].map(sub => (
                <button
                  key={sub.s}
                  onClick={() => {
                    setActiveTab('more');
                    setMoreSubTab(sub.s as any);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 text-xs rounded-xl transition font-medium ${
                    activeTab === 'more' && moreSubTab === sub.s
                      ? "bg-violet-100 text-violet-950 font-bold border-l-2 border-violet-600 shadow-2xs"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {sub.icon}
                  <span>{sub.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3 mt-4 border-t border-slate-100 pt-3">
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[10px] text-slate-500">
              <span className="font-bold text-slate-700 block mb-0.5">Sintonia NósDois</span>
              {leandroTodayMood && kaisaTodayMood ? "Vocês fizeram check-in hoje! ✨" : "Lembrem de registrar o humor hoje!"}
            </div>
            <button 
              onClick={handleReset} 
              className="text-[10px] text-slate-400 hover:text-red-500 hover:underline text-left px-2 font-medium"
            >
              🔄 Restaurar Demonstração
            </button>
          </div>
        </aside>

        {/* MAIN VIEWPORT BODY WITH BOTTOM ACCESSIBILITY HEIGHT */}
        <main className="flex-1 w-full md:max-w-none md:mx-0 pb-24 md:pb-6 bg-white min-h-[calc(100vh-80px)] md:min-h-0 md:h-full md:overflow-y-auto shadow-md md:shadow-xs md:rounded-3xl border border-slate-100/80 flex flex-col relative animate-fade-in" id="app-viewport">
          {activeTab !== "home" && !couple.connected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto min-h-[450px] animate-fade-in" id="couple-lock-screen">
              <div className="bg-pink-500/10 text-pink-500 p-4 rounded-3xl mb-4 animate-bounce border border-pink-500/20">
                <Heart className="w-8 h-8 fill-pink-500" />
              </div>
              <h2 className="text-base font-bold font-display text-slate-850">Espaço do Lar Compartilhado Trancado</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                As abas de Tarefas, Compras e Agenda são bloqueadas temporariamente até que seu parceiro se conecte usando o código de convite do lar!
              </p>
              <div className="mt-5 bg-slate-50 border border-slate-150 rounded-2xl py-3 px-5 shadow-3xs w-full max-w-xs text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Código do seu Lar</span>
                <span className="text-xl font-black font-mono text-violet-600 tracking-widest block mt-1 select-all">{couple.invite_code || "VENCIDO"}</span>
              </div>
              <button
                 onClick={() => setActiveTab("home")}
                 className="mt-6 text-xs text-violet-600 hover:text-violet-750 font-bold flex items-center gap-1.5 cursor-pointer border border-violet-200/50 rounded-xl px-4 py-2 hover:bg-violet-50 transition"
              >
                 Ir para o Início
              </button>
            </div>
          ) : (
            <React.Fragment>
        
        {/* TAB 1: HOME (DASHBOARD) */}
        {activeTab === "home" && (
          <div className="p-4 sm:p-6 flex-1 flex flex-col gap-4 sm:gap-6" id="view-home">
            
            {!couple.connected && (
              <div className="bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 text-white p-5 rounded-2xl border border-violet-500/20 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse relative overflow-hidden" id="couple-invite-card">
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
                  <Heart className="w-24 h-24 fill-white text-white" />
                </div>
                <div className="flex-grow z-10 text-center sm:text-left">
                  <h3 className="font-extrabold text-sm sm:text-base font-display">Conecte seu Amor ao Lar! 💜</h3>
                  <p className="text-xs text-violet-100 mt-1 max-w-sm font-sans font-medium">
                    As telas compartilhadas serão liberadas automaticamente assim que seu parceiro usar o código convite:
                  </p>
                  <div className="flex items-center gap-2 mt-3.5 justify-center sm:justify-start">
                    <span className="bg-white/15 border border-white/20 px-4 py-1.5 rounded-xl text-lg font-black font-mono tracking-widest uppercase">{couple.invite_code || "LOVE91"}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(couple.invite_code || "LOVE91");
                        triggerCustomNotify("Código de convite copiado!");
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold transition text-white cursor-pointer select-none border border-white/10 shadow-3xs"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0 z-10 text-center text-xs bg-white/10 border border-white/15 p-3.5 rounded-xl max-w-[170px] font-medium leading-relaxed">
                  <span>✨ O aplicativo de vocês irá sincronizar os dados na mesma hora em tempo real!</span>
                </div>
              </div>
            )}
            
            {/* Header: Greeting & Core Indicator */}
            <div className="flex items-center justify-between" id="home-greeting">
              <div>
                <h1 className="text-2xl font-bold font-display text-slate-900">
                  {isCriseModeActive ? "Fica bem, " : "Bom dia, "}{userObj.name} 💜
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Seu parceiro está com humor <strong className="text-violet-600">
                    {moods.find(m => m.user_id === partnerId && m.date === todayStr)?.mood || "Não compartilhado hoje"}
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full" id="home-level">
                <Sparkle className="w-4 h-4 text-violet-500 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-xs font-semibold text-violet-850">Nível {couple.home_level} do Lar</span>
              </div>
            </div>

            {/* General state of the house macro banner */}
            <div className={`p-4 rounded-2xl border ${
              houseStatus.status === "reorganize" ? "bg-amber-50 border-amber-200 text-amber-950" :
              houseStatus.status === "accumulating" ? "bg-amber-50/50 border-amber-200 text-amber-900" :
              houseStatus.status === "balanced" ? "bg-sky-50 border-sky-100 text-sky-950" :
              "bg-emerald-50 border-emerald-100 text-emerald-950"
            }`} id="house-health-banner">
              <div className="flex items-center gap-2">
                <span className="text-lg">{houseStatus.headline.split(" ")[0]}</span>
                <h3 className="font-bold text-sm font-display">{houseStatus.headline.split(" ").slice(1).join(" ")}</h3>
              </div>
              <p className="text-xs mt-1 opacity-80">{houseStatus.description}</p>
            </div>

            {/* IN-HOME HOUSEHOLD REFRIGERATOR STICKY NOTESBOARD (Anúncios & Recados do Lar) */}
            <div className="border border-slate-100 bg-white rounded-3xl p-5 shadow-3xs animate-fade-in" id="refrigerator-notes-board">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎴</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Mural da Geladeira (Recados Rápidos)</h3>
                    <p className="text-[10px] text-slate-400">Postem avisos e tarefas urgentes sobre a rotina da casa</p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full select-none">
                  {quickNotes.length} avisos
                </span>
              </div>

              {/* Add sticky note widget form */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl mb-4" id="add-quick-note-form">
                <p className="text-[10.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Deixar um bilhete na geladeira:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Ex: Não esqueça de tirar a louça da máquina! / Comprar gás..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newNoteText.trim()) {
                        handleAction("/api/quick-notes/create", { text: newNoteText, authorId: currentUser });
                        setNewNoteText("");
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-850 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <button
                    onClick={() => {
                      if (!newNoteText.trim()) return;
                      handleAction("/api/quick-notes/create", { text: newNoteText, authorId: currentUser });
                      setNewNoteText("");
                    }}
                    className="bg-violet-600 hover:bg-violet-750 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 select-none transition"
                  >
                    Fixar 📌
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1.5 px-0.5 text-[9px] text-slate-400">
                  <span>Pressione Enter para enviar na geladeira</span>
                  <span className={newNoteText.length >= 100 ? "text-amber-600 font-bold" : ""}>
                    {newNoteText.length}/120
                  </span>
                </div>
              </div>

              {/* Grid of Sticky Notes (Realistic Visuals with Tilts) */}
              {quickNotes.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                  Geladeira vazia! Deixe recados para lembrar o parceiro de afazeres domésticos ou avisos rápidos do lar. 🏡🥛
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5" id="sticky-notes-grid">
                  {quickNotes.map((note, index) => {
                    // Generate cyclic soft pastel background colors
                    const stickiesBackgrounds = [
                      "bg-[#FFF9C4] border-[#FFF59D] text-[#5D4037]", // pastel yellow
                      "bg-[#E8F5E9] border-[#C8E6C9] text-[#1B5E20]", // pastel green
                      "bg-[#FCE4EC] border-[#F8BBD0] text-[#880E4F]", // pastel pink
                      "bg-[#E1F5FE] border-[#B3E5FC] text-[#01579B]"  // pastel blue
                    ];
                    const bgClass = stickiesBackgrounds[index % stickiesBackgrounds.length];

                    // Subtle cyclic visual tilt rotation to mimic realistic fridge notes
                    const tilts = ["-rotate-1.5", "rotate-2", "-rotate-2", "rotate-1.5", "-rotate-1", "rotate-1"];
                    const tiltClass = tilts[index % tilts.length];

                    // Cute fridge magnets emojis
                    const magnets = ["🍉", "🍕", "🍦", "🦆", "🍎", "🥝", "🍩", "🧁", "🍄"];
                    const magnetEmoji = magnets[index % magnets.length];

                    const authorName = users[note.authorId]?.name || note.authorId;

                    return (
                      <div
                        key={note.id}
                        className={`p-3.5 rounded-xl border relative shadow-xs flex flex-col justify-between min-h-[110px] transform transition hover:scale-105 hover:rotate-0 hover:shadow-md duration-200 ${bgClass} ${tiltClass}`}
                      >
                        {/* Realistic Magnet Header Cap */}
                        <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 text-base select-none filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                          {magnetEmoji}
                        </div>

                        {/* Note Body Text */}
                        <div className="mt-1.5 text-xs font-semibold leading-relaxed break-words pr-2">
                          {note.text}
                        </div>

                        {/* Info Footer with Delete */}
                        <div className="flex items-end justify-between mt-3 pt-2 border-t border-black/5 text-[9px] opacity-80">
                          <div>
                            <span className="font-extrabold uppercase tracking-wide block">De: {authorName}</span>
                            <span className="font-mono text-[8px] opacity-60">
                              {note.createdAt ? new Date(note.createdAt).toLocaleDateString("pt-BR") : "Recentemente"}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              handleAction("/api/quick-notes/delete", { id: note.id });
                            }}
                            className="p-1 rounded-full hover:bg-black/5 text-black/50 hover:text-black transition"
                            title="Desafixar da geladeira"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Countdowns, special dates card */}
            {upcomingSpecialEvent && (
              <div className="bg-gradient-to-r from-pink-500 to-rose-400 text-white p-3 px-4 rounded-2xl shadow-xs relative overflow-hidden flex items-center justify-between gap-3 shrink-0" id="countdown-card">
                <div className="absolute right-[-5px] top-[-5px] opacity-10 pointer-events-none">
                  <Heart className="w-16 h-16 fill-current" />
                </div>
                <div className="flex-1 min-w-0 z-10">
                  <span className="text-[9px] uppercase font-heavy tracking-wider bg-white/20 px-2 py-0.5 rounded">Próxima data especial</span>
                  <h3 className="font-extrabold text-sm font-display mt-1 truncate">{upcomingSpecialEvent.title}</h3>
                  <p className="text-[10px] opacity-85 truncate flex items-center gap-1 mt-0.5">
                    <span>📍</span> {upcomingSpecialEvent.location || "Nosso Lar"}
                  </p>
                </div>
                <div className="text-right shrink-0 z-10 bg-white/15 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[65px]">
                  <span className="text-base font-extrabold font-display leading-none">
                    {getDaysCountdown(upcomingSpecialEvent.start_time)}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider opacity-90 mt-0.5">dias</span>
                </div>
              </div>
            )}

            {/* REAL-TIME ACTIVITY SYNERGY FEED */}
            {(() => {
              const feedActivities = (couple.unlocked_achievements || [])
                .filter((a: string) => a.startsWith("activity:"))
                .map((act: string) => {
                  const parts = act.split(":");
                  const prefix = parts[1] || "system";
                  const timestampStr = parts[parts.length - 1];
                  const message = parts.slice(2, parts.length - 1).join(":");
                  return { prefix, message, timestamp: timestampStr };
                })
                .reverse() // newest first!
                .slice(0, 4); // compact 4 items

              const activitiesToRender = feedActivities;

              return (
                <div className="border border-violet-100/60 rounded-3xl p-4 bg-violet-50/20 shadow-3xs" id="home-synergy-feed">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1.5 min-[380px]:gap-4">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse shrink-0"></span>
                      ⚡ Sincronia do Lar
                    </span>
                    <span className="text-[9px] text-violet-600 font-bold uppercase bg-violet-100/80 px-2 py-0.5 rounded-full select-none w-fit">
                      Sincronizado
                    </span>
                  </h3>
                  <div className="flex flex-col gap-2 relative max-h-[220px] overflow-y-auto pr-2">
                    {activitiesToRender.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                        <span className="text-lg">✨</span>
                        <p className="text-[11px] font-medium max-w-[240px] mt-1.5 leading-relaxed">
                          Ainda não há atividades registradas no lar. Comece cumprindo tarefas ou atualizando seu humor! 💜 Plano de sintonia ativo.
                        </p>
                      </div>
                    ) : (
                      activitiesToRender.map((act, index) => {
                        let icon = "📝";
                        let colorClass = "bg-slate-50/60 text-slate-800 border border-slate-200/50";
                        if (act.prefix === "task_completed") {
                          icon = "✅";
                          colorClass = "bg-emerald-50/50 text-emerald-900 border border-emerald-200/60 shadow-[0_1px_2px_rgba(16,185,129,0.03)]";
                        } else if (act.prefix === "mood") {
                          icon = "💖";
                          colorClass = "bg-pink-50/50 text-pink-900 border border-pink-200/60 shadow-[0_1px_2px_rgba(236,72,153,0.03)]";
                        } else if (act.prefix === "auto_replenish") {
                          icon = "💡";
                          colorClass = "bg-slate-900 text-slate-100 border border-slate-800 shadow-sm";
                        } else if (act.prefix === "shopping" || act.prefix === "shopping_finalized" || act.prefix === "pet_food_low" || act.prefix === "inventory_low") {
                          icon = "🛒";
                          colorClass = "bg-violet-50/50 text-violet-900 border border-violet-200/60 shadow-[0_1px_2px_rgba(139,92,246,0.03)]";
                        } else if (act.prefix === "level_up" || act.prefix === "pet_added") {
                          icon = "⭐";
                          colorClass = "bg-amber-50/50 text-amber-900 border border-amber-200/60 shadow-[0_1px_2px_rgba(245,158,11,0.03)]";
                        }
                        
                        return (
                          <div key={index} className={`flex items-start gap-2.5 p-2.5 rounded-2xl text-[11px] ${colorClass} transition hover:scale-[1.01]`}>
                            <span className="text-sm select-none shrink-0">{icon}</span>
                            <div className="flex-1">
                              <p className="font-semibold leading-normal">{act.message}</p>
                              <span className="text-[9px] text-slate-400 block mt-0.5">
                                {new Date(act.timestamp).toLocaleTimeString("pt-BR", {hour: "2-digit", minute:"2-digit"})}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Tasks of today summary */}
            <div className="border border-slate-100 rounded-2xl p-4" id="home-today-tasks">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wide">Minhas urgências (hoje)</span>
                <button onClick={() => setActiveTab("tasks")} className="text-violet-600 font-medium hover:underline flex items-center gap-0.5">
                  Ver tudo <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {tasks.filter(t => !t.completed && (t.responsible_id === currentUser || t.responsible_id === "Ambos")).slice(0, 3).length === 0 ? (
                  <div className="py-2 text-center text-xs text-slate-400 italic">
                    {isCriseModeActive ? "Nenhuma tarefa urgente hoje. Sentem e assistam um filme juntinhos 💜" : "Parabéns, nenhuma tarefa urgente pendente!"}
                  </div>
                ) : (
                  tasks.filter(t => !t.completed && (t.responsible_id === currentUser || t.responsible_id === "Ambos")).slice(0, 3).map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => {
                        setActiveTab("tasks");
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-50 cursor-pointer transition text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                        <span className="font-medium text-slate-700">{task.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${getUrgencyColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bento block counts */}
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4" id="home-bento-grid">
              <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between" id="bento-shopping">
                <div>
                  <ShoppingBag className="w-5 h-5 text-indigo-500 mb-2" />
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Carrinho</h4>
                  <p className="text-lg font-bold font-display mt-1">
                    {shopping.filter(i => !i.is_bought).length} pendentes
                  </p>
                </div>
                <button onClick={() => setActiveTab("shopping")} className="text-xs text-indigo-600 font-bold hover:underline mt-4 flex items-center gap-0.5">
                  Ir às compras <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between" id="bento-finances">
                <div>
                  <DollarSign className="w-5 h-5 text-emerald-500 mb-2" />
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Acerto do Lar</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    {netBalance === 0 
                      ? "Tudo acertado!" 
                      : netBalance > 0 
                        ? `${userObj.partner_nickname || partnerObj.name} te deve ${netBalance.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}`
                        : `Você deve ${Math.abs(netBalance).toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})} ao ${userObj.partner_nickname || partnerObj.name}`
                    }
                  </p>
                </div>
                <button onClick={() => { setActiveTab("more"); setMoreSubTab("finances"); }} className="text-xs text-emerald-600 font-bold hover:underline mt-4 flex items-center gap-0.5" id="btn-home-finances">
                  Ver contas <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Check-in Emocional Card */}
            <div className="border border-pink-50 rounded-2xl bg-pink-50/20 p-4" id="home-mood-quick">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Como você se sente hoje?</h4>
              <div className="flex gap-1 sm:gap-2 justify-between">
                {[
                  { m: MoodType.OTIMO, emoji: "😍" },
                  { m: MoodType.BEM, emoji: "😊" },
                  { m: MoodType.CANSADO, emoji: "😴" },
                  { m: MoodType.ANSIOSO, emoji: "😰" },
                  { m: MoodType.BAIXA, emoji: "😔" }
                ].map(item => (
                  <button
                    key={item.m}
                    onClick={() => {
                      handleAction("/api/moods/checkin", {
                        user_id: currentUser,
                        mood: item.m,
                        note: "Registrado rápido da tela inicial",
                        share_note: true
                      });
                      triggerCustomNotify(`Registrado que você está se sentindo: ${item.m}!`);
                    }}
                    className={`flex-1 py-1.5 rounded-xl border border-slate-100 bg-white hover:bg-pink-50 transition text-sm flex flex-col items-center min-w-0 ${
                      moods.find(mo => mo.user_id === currentUser && mo.date === todayStr)?.mood === item.m ? "ring-2 ring-pink-500" : ""
                    }`}
                  >
                    <span className="text-base sm:text-lg">{item.emoji}</span>
                    <span className="text-[8px] sm:text-[9px] mt-0.5 font-medium text-slate-500 truncate w-full text-center px-0.5">{item.m}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: TAREFAS */}
        {activeTab === "tasks" && (
          <div className="p-4 sm:p-6 flex-1 flex flex-col gap-3.5 sm:gap-4" id="view-tasks">
            <div className="flex items-center justify-between" id="tasks-header">
              <div>
                <h1 className="text-xl font-bold font-display text-slate-900">Tarefas do Lar e Pontos</h1>
                <p className="text-xs text-slate-500">Acumulem juntos {couple.total_points} pontos totais!</p>
              </div>
              <button
                onClick={() => setTaskModalOpen(true)}
                className="bg-gradient-to-r from-violet-500 to-pink-500 text-white p-2.5 rounded-full hover:shadow-md transition shrink-0"
                id="btn-add-task"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick point leaderboard */}
            <div className="grid grid-cols-2 gap-3 bg-violet-50/50 p-3 rounded-2xl border border-violet-100 text-xs" id="tasks-leaderboard">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧑‍💻</span>
                <div>
                  <p className="font-bold text-slate-700">{users.Leandro?.name || "Leandro"}</p>
                  <p className="text-slate-500 text-[11px]">{users.Leandro?.points_weekly || 0} pontos esta semana</p>
                </div>
              </div>
              <div className="flex items-center gap-2 border-l border-violet-100 pl-3">
                <span className="text-lg">👩‍🦰</span>
                <div>
                  <p className="font-bold text-slate-700">{users.Kaisa?.name || "Kaisa"}</p>
                  <p className="text-slate-500 text-[11px]">{users.Kaisa?.points_weekly || 0} pontos esta semana</p>
                </div>
              </div>
            </div>

            {/* SAÚDE DO LAR COMPACT INDICATOR */}
            <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-colors ${
              houseStatus.status === "reorganize" ? "bg-red-50 border-red-200 text-red-950" :
              houseStatus.status === "accumulating" ? "bg-amber-50/50 border-amber-200 text-amber-900" :
              houseStatus.status === "balanced" ? "bg-sky-50 border-sky-100 text-sky-950" :
              "bg-emerald-50 border-emerald-100 text-emerald-950"
            }`}>
              <span className="text-sm select-none">{houseStatus.headline.split(" ")[0]}</span>
              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wide leading-tight">{houseStatus.headline.split(" ").slice(1).join(" ")}</h4>
                <p className="text-[10px] opacity-80 mt-0.5 leading-relaxed">{houseStatus.description}</p>
              </div>
            </div>

            {/* Flexible view toggler */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl text-[11px] overflow-x-auto scrollbar-none" id="tasks-layout-tabs">
              {[
                { id: "mural", label: "Mural Geral", icon: "📋" },
                { id: "person", label: "Por Pessoa", icon: "👥" },
                { id: "room", label: "Por Cômodo", icon: "🏡" },
                { id: "focus", label: "Modo Foco ⚡", icon: "⚡" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTaskViewMode(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                    taskViewMode === tab.id
                      ? tab.id === "focus" 
                        ? "bg-gradient-to-r from-violet-650 to-pink-600 text-white shadow-xs"
                        : "bg-white text-slate-800 shadow-3xs border border-slate-100"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Render conditional on layout mode */}
            {taskViewMode === "mural" && (
              <div className="flex flex-col gap-3 mt-1 max-h-[460px] overflow-y-auto pr-1" id="tasks-scroller">
                {tasks.filter(t => !t.archived).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 italic text-sm">
                    Nenhuma tarefa nas redondezas. Divirtam-se juntos!
                  </div>
                ) : (
                  tasks.filter(t => !t.archived).map(task => (
                    <div 
                      key={task.id} 
                      className={`border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition ${
                        task.completed ? "bg-slate-50/50 opacity-65" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleAction("/api/tasks/toggle", { id: task.id, user_id: currentUser })}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition mt-0.5 ${
                              task.completed 
                                ? "bg-violet-600 border-violet-600 text-white" 
                                : "border-slate-300 hover:border-violet-500"
                            }`}
                            id={`btn-toggle-task-${task.id}`}
                          >
                            {task.completed && <CheckSquare className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <h3 className={`text-sm font-semibold text-slate-800 ${task.completed ? "line-through text-slate-400" : ""}`}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                            )}
                            
                            {/* Tags row */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                📂 {task.category}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${getUrgencyColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.recurrence !== "Nenhuma" && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                                  🔄 Recorrente: {task.recurrence}
                                </span>
                              )}
                              {task.time_estimate && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                  ⏱️ {task.time_estimate} min
                                </span>
                              )}
                            </div>

                            {/* Assignment & rewards indicator */}
                            <p className="text-[11px] text-slate-500 mt-2.5">
                              Responsável: <strong className="text-violet-600">{task.responsible_id}</strong> • Recompensa: <strong className="text-emerald-600">+{task.points} pontos</strong>
                            </p>
                          </div>
                        </div>

                        {/* Context action controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setActiveChatType("task");
                              setActiveChatId(task.id);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Comentar"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTask(task)}
                            className="p-1 text-slate-400 hover:text-blue-500 animate-slide-up"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction("/api/tasks/archive", { id: task.id })}
                            className="p-1 text-slate-400 hover:text-amber-500"
                            title="Arquivar/Desarquivar"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerCustomConfirm("Tem certeza que deseja excluir esta tarefa permanentemente para vocês dois?", () => handleAction("/api/tasks/delete", { id: task.id }))}
                            className="p-1 text-slate-400 hover:text-red-500"
                            title="Excluir de Vez"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* PHOTO PROOF PROMPT (Rule 4.4 - Concluir com foto notifica o parceiro) */}
                      {task.completed && (
                        <div className="mt-3 border-t border-dashed border-slate-100 pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Concluído por {users[task.responsible_id]?.name || task.responsible_id}!</span>
                          {task.photo_proof ? (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <span>📸 Foto enviada</span>
                            </div>
                          ) : photoProofTaskId === task.id ? (
                            <div className="flex gap-1.5 items-center">
                              <input
                                type="text"
                                placeholder="URL da foto..."
                                value={photoProofUrl}
                                onChange={e => setPhotoProofUrl(e.target.value)}
                                className="border border-slate-200 rounded-lg px-2 py-1 text-[10px] w-32"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (photoProofUrl.trim()) {
                                    handleAction("/api/tasks/toggle", { id: task.id, user_id: currentUser, photo_proof: photoProofUrl.trim() });
                                    setPhotoProofTaskId(null);
                                    setPhotoProofUrl("");
                                  }
                                }}
                                className="text-emerald-600 font-bold text-[10px] hover:underline"
                              >OK</button>
                              <button onClick={() => { setPhotoProofTaskId(null); setPhotoProofUrl(""); }} className="text-slate-400 text-[10px]">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setPhotoProofTaskId(task.id)}
                              className="text-violet-600 font-bold hover:underline"
                            >
                              + Prova com Foto
                            </button>
                          )}
                        </div>
                      )}

                      {/* NESTED COMMENTS AND CONTEXT CHAT (Rule 13 - Chat rápido contextual) */}
                      {task.comments && task.comments.length > 0 && (
                        <div className="mt-3 bg-slate-50 rounded-xl p-2.5 flex flex-col gap-2 border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Comentários Contextuais
                          </p>
                          {task.comments.map(comment => (
                            <div key={comment.id} className="text-xs leading-relaxed">
                              <strong className="text-slate-700">{comment.author_id}:</strong>{" "}
                              <span className="text-slate-600">{comment.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {taskViewMode === "person" && (
              <div className="grid grid-cols-2 gap-3 mt-1" id="person-columns-container">
                {Object.keys(users).map((uId, idx) => {
                  const u = users[uId];
                  const isFirst = idx === 0;
                  const colBg = isFirst ? "bg-blue-50/20 border-blue-100/50 text-blue-900" : "bg-pink-50/20 border-pink-100/30 text-pink-900";
                  const btnCheckBg = isFirst ? "bg-blue-600 border-blue-600 text-white" : "bg-pink-600 border-pink-600 text-white";
                  const emoji = isFirst ? "🧑‍💻" : "👩‍🦰";
                  const uTasks = tasks.filter(t => !t.archived && (t.responsible_id === uId || t.responsible_id === "Ambos"));
                  const uPendingTasksCount = tasks.filter(t => !t.archived && !t.completed && (t.responsible_id === uId || t.responsible_id === "Ambos")).length;
                  return (
                    <div key={uId} className={`flex flex-col gap-2 p-2.5 rounded-2xl border ${colBg}`}>
                      <div className="flex items-center gap-1.5 border-b border-current pb-1.5 justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{emoji}</span>
                          <span className="font-bold text-[11px]">{u?.name || uId}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{uPendingTasksCount} itens</span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto">
                        {uTasks.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic py-6 text-center">Nenhuma atribuída!</p>
                        ) : (
                          uTasks.map(task => (
                            <div key={task.id} className={`p-2 rounded-xl border text-xs ${task.completed ? "bg-slate-100/50 opacity-60 border-slate-200" : "bg-white border-slate-50 hover:shadow-3xs flex flex-col gap-1.5"}`}>
                              <div className="flex items-start gap-1.5 justify-between">
                                <div className="flex items-start gap-1.5">
                                  <button
                                    onClick={() => handleAction("/api/tasks/toggle", { id: task.id, user_id: currentUser })}
                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${task.completed ? btnCheckBg : "border-slate-300 bg-white"}`}
                                  >
                                    {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </button>
                                  <div>
                                    <p className={`font-semibold text-[11px] leading-tight ${task.completed ? "line-through text-slate-400 font-normal" : "text-slate-800"}`}>{task.title}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">+{task.points} XP</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  <button
                                    onClick={() => setEditingTask(task)}
                                    className="p-1 hover:bg-slate-50 text-slate-400 hover:text-blue-500 rounded"
                                    title="Editar"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => triggerCustomConfirm("Tem certeza que deseja excluir esta tarefa permanentemente?", () => handleAction("/api/tasks/delete", { id: task.id }))}
                                    className="p-1 hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded"
                                    title="Excluir"
                                  >
                                    ❌
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {taskViewMode === "room" && (
              <div className="flex flex-col gap-3 mt-1 max-h-[460px] overflow-y-auto pr-1" id="room-list-container">
                {[
                  { name: "Cozinha 🍳", category: TaskCategory.COZINHA },
                  { name: "Banheiro 🧼", category: TaskCategory.BANHEIRO },
                  { name: "Quarto 🛏️", category: TaskCategory.QUARTO },
                  { name: "Sala 📺", category: TaskCategory.SALA },
                  { name: "Varanda/Jardim 🌿", category: TaskCategory.EXTERNO },
                  { name: "Outros 📦", category: TaskCategory.OUTRO }
                ].map(group => {
                  const groupTasks = tasks.filter(t => !t.archived && t.category === group.category);
                  if (groupTasks.length === 0) return null;
                  return (
                    <div key={group.category} className="border border-slate-100 bg-white p-3.5 rounded-2xl">
                      <h4 className="text-xs font-bold text-violet-750 mb-2 flex items-center justify-between">
                        <span>{group.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{groupTasks.filter(t => !t.completed).length} pendentes</span>
                      </h4>
                      <div className="flex flex-col gap-2">
                        {groupTasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-none last:pb-0">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction("/api/tasks/toggle", { id: task.id, user_id: currentUser })}
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${task.completed ? "bg-violet-600 border-violet-600 text-white" : "border-slate-300"}`}
                              >
                                {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </button>
                              <span className={`font-medium ${task.completed ? "line-through text-slate-400" : "text-slate-800"}`}>{task.title}</span>
                            </div>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">For {task.responsible_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {taskViewMode === "focus" && (
              <div className="flex flex-col gap-2" id="focus-view-mode">
                {(() => {
                  const activeFocusTask = tasks.find(t => !t.completed && t.priority === TaskPriority.URGENTE) ||
                                         tasks.find(t => !t.completed && t.priority === TaskPriority.NORMAL) ||
                                         tasks.find(t => !t.completed);
                  if (!activeFocusTask) {
                    return (
                      <div className="bg-[#0b0c1e] text-slate-100 border-2 border-violet-500/20 p-8 rounded-3xl text-center flex flex-col items-center justify-center shadow-lg my-4 animate-fade-in">
                        <span className="text-4xl mb-3">✨</span>
                        <h3 className="font-bold text-base text-violet-300 font-display">Sem Tarefas Ativas!</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">Tudo no lar está harmonioso e limpo. Aproveitem o tempo livre juntos!</p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-[#0b0c1e] text-slate-100 border-2 border-pink-500/80 p-5 rounded-3xl flex flex-col gap-4 shadow-xl shadow-pink-950/20 my-2 relative overflow-hidden animate-slide-up" id="modo-foco-neon-card">
                      
                      {/* Absolute subtle background glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

                      {/* Header badges */}
                      <div className="flex items-center justify-between">
                        <span className="bg-red-500/20 border border-red-500/30 text-red-300 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                          ⚓ URGÊNCIA MÁXIMA DO LAR
                        </span>
                        <span className="text-[10px] text-pink-400 font-semibold flex items-center gap-1 select-none">
                          ⚡ Modo Foco Ativo
                        </span>
                      </div>

                      {/* Body elements */}
                      <div>
                        <h2 className="text-md font-bold text-white font-display leading-tight">{activeFocusTask.title}</h2>
                        {activeFocusTask.description && (
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">{activeFocusTask.description}</p>
                        )}
                      </div>

                      {/* Information block */}
                      <div className="grid grid-cols-2 gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl text-[10px] text-slate-300">
                        <div>
                          <span className="text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Cômodo / Setor</span>
                          <strong className="text-xs text-white">📂 {activeFocusTask.category}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Tempo Estimado</span>
                          <strong className="text-xs text-white">⏱️ {activeFocusTask.time_estimate || "20"} minutos</strong>
                        </div>
                      </div>

                      {/* Big solid gradient action button */}
                      <div className="flex flex-col gap-2 mt-1">
                        <button
                          onClick={() => {
                            handleAction("/api/tasks/toggle", { id: activeFocusTask.id, user_id: currentUser });
                            triggerCustomNotify(`Parabéns! Você completou: "${activeFocusTask.title}" e resgatou +${activeFocusTask.points} pontos de XP! 🎉`);
                          }}
                          className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-transform hover:scale-[1.02] shadow-md shadow-pink-950/40 select-none cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Concluir e resgatar +{activeFocusTask.points} XP! ⌁
                        </button>
                        <p className="text-[9px] text-slate-500 text-center italic mt-0.5">
                          "Garante um cafuné caprichado de {userObj?.partner_nickname || partnerObj?.name || 'seu amor'}!"
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AGENDA / CALENDÁRIO */}
        {activeTab === "agenda" && (
          <div className="p-4 sm:p-6 flex-1 flex flex-col gap-3.5 sm:gap-4" id="view-agenda">
            <div className="flex items-center justify-between" id="agenda-header">
              <div>
                <h1 className="text-xl font-bold font-display text-slate-900">Agenda do Casal</h1>
                <p className="text-xs text-slate-500">Sincronização de datas especiais e passeios do amor</p>
              </div>
              <button
                onClick={() => setEventModalOpen(true)}
                className="bg-gradient-to-r from-violet-500 to-pink-500 text-white p-2.5 rounded-full hover:shadow-md transition shrink-0"
                id="btn-add-event"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* List of Scheduled Events */}
            <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1" id="agenda-scroller">
              {events.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic text-sm">
                  Parados no tempo? Adicionem a primeira viagem ou jantar a dois!
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="border border-slate-100 rounded-2xl p-4 bg-white hover:shadow-sm transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          📅 {event.type}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm mt-1">{event.title}</h3>
                        {event.description && (
                          <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-4 animate-slide-up">
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-blue-500 rounded-lg transition"
                          title="Editar evento"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => triggerCustomConfirm("Deseja mesmo excluir este evento do calendário permanentemente?", () => handleAction("/api/events/delete", { id: event.id }))}
                          className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg transition"
                          title="Excluir evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                        
                        {/* Event tags & details */}
                        <div className="flex flex-col gap-2 mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Contagem: <strong>{new Date(event.start_time).toLocaleString("pt-BR")}</strong></span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>Local: <strong>{event.location}</strong></span>
                            </div>
                          )}
                          {event.booking_link && (
                            <a href={event.booking_link} target="_blank" rel="noreferrer" className="text-violet-600 text-xs font-bold hover:underline flex items-center gap-0.5">
                              🔗 Link do Local/Reserva <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                    {/* SPECIAL TRAVEL CHECKLIST INTEGRATION (Rule 5.2 - Viagem embutida com checklist) */}
                    {event.type === EventType.VIAGEM && event.travel_checklist && (
                      <div className="mt-4 border-t border-slate-100 pt-3" id="travel-checklist">
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-2">🚀 Checklist de Bagagem da Viagem</h4>
                        <div className="flex flex-col gap-1.5">
                          {event.travel_checklist.map(item => (
                            <div key={item.item} className="flex items-center justify-between text-xs text-slate-600">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() => handleAction("/api/events/checklist/toggle", { event_id: event.id, item_text: item.item })}
                                  className="rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                                />
                                <span className={item.checked ? "line-through text-slate-400" : ""}>{item.item}</span>
                              </label>
                            </div>
                          ))}
                          
                          {/* Quick add checklist item */}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              placeholder="Novo item de mala..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const text = (e.target as HTMLInputElement).value;
                                  if (text) {
                                    handleAction("/api/events/checklist/add", { event_id: event.id, item_text: text });
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                              className="flex-1 bg-slate-50 text-xs border border-slate-200 px-2 py-1 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COMPRAS & INVENTÁRIO */}
        {activeTab === "shopping" && (() => {
          const filteredShopping = shopping.filter(
            i => i.monthId === selectedMonthId || (!i.monthId && selectedMonthId === currentInitialMonth)
          );

          const isListFinalized = filteredShopping.some(i => i.listStatus === "finalized");
          const firstFinalizedItem = filteredShopping.find(i => i.listStatus === "finalized");
          const paymentMethodUsed = firstFinalizedItem?.paymentMethod || "";

          const checkedTotal = filteredShopping
            .filter(i => i.is_bought)
            .reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0);

          const expectedTotal = filteredShopping
            .reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0);

          const totalItemsCount = filteredShopping.length;
          const boughtItemsCount = filteredShopping.filter(i => i.is_bought).length;

          return (
            <div className="p-4 sm:p-6 flex-1 flex flex-col gap-3.5 sm:gap-4 overflow-y-auto" id="view-shopping">
              <div className="flex items-center justify-between" id="shopping-header">
                <div>
                  <h1 className="text-xl font-bold font-display text-slate-900">Lista Mensal de Compras</h1>
                  <p className="text-xs text-slate-500">Planeje as compras do mês anterior e atual sem burocracias!</p>
                </div>
                <button
                  onClick={() => {
                    if (isListFinalized) {
                      triggerCustomNotify("Esta lista já foi finalizada! Mude o mês selecionado ou crie um novo mês.", "info");
                      return;
                    }
                    setShopModalOpen(true);
                  }}
                  className={`p-2.5 rounded-full hover:shadow-md transition shrink-0 ${
                    isListFinalized 
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                  }`}
                  id="btn-add-shopping"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* NOVO SELETOR DE PERÍODO (ACRESCENTADO PARA ACESSO AOS MESES ANTERIORES) */}
              <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs flex flex-col gap-3 animate-fade-in" id="shopping-month-selector">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Período Selecionado</h3>
                      <p className="text-[10px] text-slate-400">Navegue pelas listas de compras de meses anteriores</p>
                    </div>
                  </div>
                  
                  {/* Switcher & Creator */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      // Extract uniquely existing months plus presets
                      const getOffsetMonth = (offset: number) => {
                        const d = new Date();
                        d.setMonth(d.getMonth() + offset);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                      };
                      const uniqueMonthsList = Array.from(
                        new Set([
                          getOffsetMonth(0), getOffsetMonth(-1), getOffsetMonth(-2), getOffsetMonth(1),
                          ...shopping.map(s => s.monthId).filter((v): v is string => !!v)
                        ])
                      ).sort().reverse();

                      const formatMonthId = (ym: string) => {
                        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                        const parts = ym.split("-");
                        const y = parts[0];
                        const m = parseInt(parts[1], 10);
                        if (isNaN(m) || m < 1 || m > 12) return ym;
                        return `${months[m - 1]} / ${y}`;
                      };

                      return (
                        <select
                          value={selectedMonthId}
                          onChange={(e) => {
                            setSelectedMonthId(e.target.value);
                            setIsCreatingNewMonth(false);
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                          id="month-list-select"
                        >
                          {uniqueMonthsList.map(mId => (
                            <option key={mId} value={mId}>{formatMonthId(mId)}</option>
                          ))}
                        </select>
                      );
                    })()}

                    <button
                      onClick={() => {
                        setIsCreatingNewMonth(!isCreatingNewMonth);
                        const parts = selectedMonthId.split("-").map(Number);
                        let nextY = parts[0] || 2026;
                        let nextM = (parts[1] || 5) + 1;
                        if (nextM > 12) {
                          nextM = 1;
                          nextY += 1;
                        }
                        setNewMonthValue(`${nextY}-${String(nextM).padStart(2, "0")}`);
                      }}
                      className="bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold px-3 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1 shrink-0"
                      id="btn-trigger-new-month"
                    >
                      <span>➕ Iniciar Novo Mês</span>
                    </button>
                  </div>
                </div>

                {/* Inline input to start a new month list */}
                {isCreatingNewMonth && (
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60 flex flex-col min-[480px]:flex-row gap-2.5 items-end justify-between animate-fade-in" id="new-month-form">
                    <div className="flex-1 w-full">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Escolha o mês de compras:</label>
                      <input
                        type="month"
                        value={newMonthValue}
                        onChange={(e) => setNewMonthValue(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMonthId(newMonthValue);
                        setIsCreatingNewMonth(false);
                      }}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-4.5 py-1.5 rounded-xl text-xs transition w-full min-[480px]:w-auto cursor-pointer"
                    >
                      Criar Lista de Compras 🚀
                    </button>
                  </div>
                )}

                {/* BUDGET AND SPENDING CONTROLLER CARD */}
                <div className="border-t border-slate-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option to set Budget */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">💰 Orçamento do Mês</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs text-slate-400 font-bold">R$</span>
                      <input
                        type="number"
                        placeholder="Sem limite"
                        value={couple?.shoppingBudgets?.[selectedMonthId] || ""}
                        onChange={async (e) => {
                          const val = e.target.value;
                          const numericVal = parseFloat(val) || 0;
                          // Optimist updates
                          setState(prev => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              couple: {
                                ...prev.couple,
                                shoppingBudgets: {
                                  ...prev.couple.shoppingBudgets,
                                  [selectedMonthId]: numericVal
                                }
                              }
                            };
                          });
                          try {
                            await appFetch("/api/shopping/budget", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ monthId: selectedMonthId, budget: numericVal })
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>

                  {/* Real-time Totalizer */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2 px-3.5 flex flex-col justify-center">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase">📊 Quanto está dando</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-sm font-extrabold text-slate-800">
                        {checkedTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        marcado (de {expectedTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} total)
                      </span>
                    </div>
                  </div>

                  {/* Remaining Money Calculation */}
                  <div className={`rounded-xl p-2 px-3.5 flex flex-col justify-center border ${
                    (() => {
                      const limit = couple?.shoppingBudgets?.[selectedMonthId] || 0;
                      if (!limit) return "bg-slate-50 border-slate-100 text-slate-600";
                      const diff = limit - checkedTotal;
                      return diff < 0 
                        ? "bg-red-55 border-red-150 text-red-700 animate-pulse" 
                        : "bg-emerald-50 border-emerald-150 text-emerald-800";
                    })()
                  }`}>
                    <span className="text-[9px] font-extrabold uppercase opacity-85">💵 Saldo do Orçamento</span>
                    {(() => {
                      const limit = couple?.shoppingBudgets?.[selectedMonthId] || 0;
                      if (!limit) {
                        return <span className="text-xs font-semibold mt-0.5 italic text-slate-400">Defina um limite ao lado</span>;
                      }
                      const diff = limit - checkedTotal;
                      const restAll = limit - expectedTotal;
                      return (
                        <div className="flex flex-col">
                          <span className="text-sm font-extrabold leading-none mt-0.5">
                            {diff.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                          <span className="text-[9px] opacity-80 mt-0.5 leading-none">
                            {restAll < 0 
                              ? `⚠️ Excederá por ${Math.abs(restAll).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                              : `Previsão livre: ${restAll.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                            }
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Status Banner */}
                {isListFinalized ? (
                  <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center justify-between gap-2.5 text-xs text-emerald-800 animate-fade-in animate-fade-in" id="list-status-banner">
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none leading-none">✅</span>
                      <span>
                        <strong>Mês Finalizado!</strong> Lançado nas despesas: <strong className="text-emerald-950">{checkedTotal.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}</strong> via <strong className="uppercase bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-950 font-bold">{paymentMethodUsed}</strong>.
                      </span>
                    </div>
                    <span className="bg-emerald-500 text-white text-[9.5px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded shadow-3xs select-none text-center">Faturada</span>
                  </div>
                ) : (
                  <div className="bg-violet-50 border border-violet-100 p-3 rounded-2xl flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center justify-between gap-3 text-xs text-violet-850 animate-fade-in" id="list-status-banner">
                    <div className="flex items-center gap-2">
                      <span className="text-sm select-none">🛒</span>
                      <span>
                        <strong>Lista Aberta:</strong> {boughtItemsCount} comprados de {totalItemsCount} adicionados (Soma atual: {checkedTotal.toLocaleString("pt-BR", {style: "currency", currency: "BRL"})}).
                      </span>
                    </div>
                    
                    {filteredShopping.length > 0 && (
                      <button
                        onClick={() => {
                          setFinalizePaymentMethod("VR");
                          setFinalizeTotalSpent(checkedTotal.toFixed(2));
                          setFinalizePaidBy(currentUser);
                          setFinalizeModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold px-3.5 py-2 rounded-xl hover:shadow-md transition text-[11px] text-center shrink-0 cursor-pointer"
                        id="btn-checkout-list"
                      >
                        Finalizar e Registrar Pago 🚀
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* EXPRESS SIMPLE INSTANT QUICK ADD CODE BAR */}
              {!isListFinalized && (
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-3xl p-3 shadow-3xs animate-fade-in" id="express-add-bar">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const inputEl = document.getElementById("express-shop-input") as HTMLInputElement;
                      const inputVal = inputEl?.value || "";
                      const trimmed = inputVal.trim();
                      if (!trimmed) return;

                      // Parse single item
                      const parsed = parseQuickAddItem(trimmed);
                      const name = parsed ? parsed.name : trimmed;
                      const qty = parsed ? parsed.quantity : 1;
                      const unit = parsed ? parsed.unit : "unidades";

                      try {
                        const response = await appFetch("/api/shopping/create", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name,
                            quantity: qty,
                            unit,
                            added_by: currentUser,
                            monthId: selectedMonthId
                          })
                        });
                        const result = await response.json();
                        if (result.success) {
                          await loadState();
                          if (inputEl) inputEl.value = "";
                        } else {
                          triggerCustomNotify(result.message || "Erro ao adicionar", "error");
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      id="express-shop-input"
                      placeholder="➕ Adicionar item rápido (ex: 2kg batata, leite, pão)"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition shadow-3xs"
                    />
                    <button
                      type="submit"
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shrink-0 cursor-pointer shadow-3xs"
                    >
                      Adicionar
                    </button>
                  </form>
                </div>
              )}

              {/* INTEGRATION NOTICE BANNER - COLLAPSIBLE WITH ADVANCED TOOLS */}
              {!isListFinalized ? (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 shadow-3xs flex flex-col gap-2.5" id="shopping-advanced-options">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedShopping(!showAdvancedShopping)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900 transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>⚙️</span>
                      <span>Ferramentas Extras {showAdvancedShopping ? "Abertas" : "Ocultas"}</span>
                      <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Receitas, Cadastro em Lote)</span>
                    </span>
                    <span className="text-[10.5px] text-violet-600 font-bold">{showAdvancedShopping ? "Ocultar ▲" : "Configurar ▼"}</span>
                  </button>

                  {showAdvancedShopping ? (
                    <div className="flex flex-col gap-3 border-t border-slate-100/80 pt-3 animate-fade-in">
                      <div className="bg-slate-100 border border-slate-200 text-slate-700 p-3 rounded-2xl flex items-start gap-2.5">
                        <span className="text-sm leading-none select-none shrink-0">🤝</span>
                        <p className="text-[11px] leading-relaxed font-sans">
                          Planeje a lista do mês de forma tranquila. Quando for ao mercado e comprar, risque os itens. No encerramento da compra, finalize a lista para transferir os valores gastos diretamente para suas <strong>Finanças do Mês</strong>!
                        </p>
                      </div>

                      {/* INSERÇÃO SÍNCRONA DE RECEITA */}
                      <div className="border border-violet-100 bg-violet-50/20 rounded-2xl p-3 flex flex-col gap-2 text-xs" id="sync-recipe-integration">
                        <div className="flex items-center gap-2">
                          <span className="text-sm select-none">🍳</span>
                          <p className="font-bold text-slate-800">Cozinhar Juntos: Integrar Receita</p>
                        </div>
                        <p className="text-[10px] text-slate-500">Adicione todos os ingredientes de uma receita favorita na lista deste mês instantaneamente:</p>
                        <div className="flex gap-2">
                          <select
                            id="sync-recipe-select"
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium"
                          >
                            <option value="">Selecione uma receita...</option>
                            {recipes.map(r => (
                              <option key={r.id} value={r.id}>{r.title} ({r.ingredients.length} itens)</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const selectEl = document.getElementById("sync-recipe-select") as HTMLSelectElement;
                              const rId = selectEl?.value;
                              if (!rId) {
                                triggerCustomNotify("Selecione uma receita da lista!", "info");
                                return;
                              }
                              handleAction("/api/recipes/generate-shopping", { recipe_id: rId, user_id: currentUser, monthId: selectedMonthId });
                              triggerCustomNotify("Ingredientes integrados ao carrinho deste mês com sucesso! 🎉");
                              selectEl.value = "";
                            }}
                            className="bg-[#6366f1] hover:bg-indigo-700 text-white font-extrabold px-4 py-1.5 rounded-xl text-xs transition shrink-0 cursor-pointer"
                          >
                            Integrar
                          </button>
                        </div>
                      </div>

                      {/* ADIÇÃO EM LOTE INTELIGENTE (Smart Quick Bulk Add Panel) */}
                      <div className="border border-violet-100 bg-white p-3 rounded-2xl flex flex-col gap-2.5 shadow-3xs" id="quick-bulk-add-shopping">
                        <div className="flex items-center gap-1.5 justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs select-none">📝</span>
                            <p className="font-bold text-xs text-slate-800">Adição Rápida em Lote (Separados por vírgula)</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={quickAddText}
                            onChange={(e) => setQuickAddText(e.target.value)}
                            placeholder="Ex: 3l leite, 1kg tomate italiano, sabonete, alface, pão"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 resize-none font-medium leading-relaxed"
                            rows={2}
                          />
                          
                          {(() => {
                            const parts = quickAddText
                              .split(/[,\n]/)
                              .map(part => parseQuickAddItem(part))
                              .filter((v): v is { name: string; quantity: number; unit: string } => v !== null && v.name.trim().length > 0);

                            if (parts.length === 0) return null;

                            return (
                              <div className="bg-violet-50/20 rounded-xl p-2.5 border border-violet-100/40 flex flex-col gap-2 animate-fade-in">
                                <span className="text-[10px] text-violet-800 font-bold uppercase tracking-wider block">🔬 Itens Reconhecidos ({parts.length}):</span>
                                <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                                  {parts.map((item, idx) => (
                                    <span key={idx} className="bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded-lg text-[10.5px] font-medium flex items-center gap-1.5 shadow-3xs">
                                      <span className="text-violet-600 font-bold">{item.quantity}x</span>
                                      <span className="text-slate-700 font-bold">{item.name}</span>
                                      <span className="text-[9px] text-slate-400 font-sans">({item.unit.toLowerCase()})</span>
                                    </span>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const response = await appFetch("/api/shopping/create-bulk", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ items: parts, added_by: currentUser, monthId: selectedMonthId })
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        await loadState();
                                        setQuickAddText("");
                                      }
                                    } catch (err) {
                                      console.error("Erro ao inserir em lote:", err);
                                    }
                                  }}
                                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition shadow-3xs flex items-center justify-center gap-1.5 select-none cursor-pointer mt-1"
                                >
                                  🚀 Enviar Todos ({parts.length}) à Lista de Compras
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-4 text-center text-xs text-slate-500 italic">
                  🔒 Edições e adições estão desativadas porque este período de compras já foi faturado e fechado. Mude o período acima para editar!
                </div>
              )}

              {/* SMART SPREADSHEET TABLE MODEL */}
              <div className="flex flex-col gap-4 animate-fade-in" id="shopping-spreadsheet-section">
                {filteredShopping.length === 0 ? (
                  <div className="text-center py-10 md:py-16 text-slate-400 italic text-sm border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    Nenhum item nesta lista para este mês! Comece adicionando acima.
                  </div>
                ) : (
                  <>
                    <div className="bg-white border border-slate-100 rounded-3xl shadow-3xs overflow-hidden" id="shopping-spreadsheet-card">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📊</span>
                          <div>
                            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Planilha de Compras Inteligente</h3>
                            <p className="text-[10px] text-slate-400">Edite os valores em tempo real digitando ou clicando diretamente nos campos</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[9.5px] bg-violet-50 text-violet-750 font-bold px-2 py-0.5 rounded-full">Automática</span>
                          <span className="text-[9.5px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Soma Rápida</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" style={{ minWidth: "750px" }}>
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase select-none">
                              <th className="py-2.5 px-3 text-center w-12">Comp.</th>
                              <th className="py-2.5 px-3">Item / Produto</th>
                              <th className="py-2.5 px-3 w-[115px] text-center">Quantidade</th>
                              <th className="py-2.5 px-3 w-[120px]">Unidade</th>
                              <th className="py-2.5 px-3 w-[125px]">Valor Unit.</th>
                              <th className="py-2.5 px-3 w-[130px]">Subtotal (Qtd x V.)</th>
                              <th className="py-2.5 px-3 w-[140px]">Categoria</th>
                              <th className="py-2.5 px-3 w-10 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredShopping.map(item => {
                              const subtotal = (item.price || 0) * item.quantity;
                              return (
                                <tr 
                                  key={item.id} 
                                  className={`group transition hover:bg-slate-50/45 text-xs ${
                                    item.is_bought ? "bg-slate-50/40 opacity-70" : ""
                                  }`}
                                >
                                  {/* Comprado */}
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      disabled={isListFinalized}
                                      onClick={() => {
                                        if (isListFinalized) return;
                                        handleAction("/api/shopping/toggle", { id: item.id });
                                      }}
                                      className={`w-5 h-5 mx-auto rounded-full border flex items-center justify-center transition shrink-0 ${
                                        item.is_bought 
                                          ? "bg-emerald-500 border-emerald-500 text-white shadow-3xs" 
                                          : "border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20"
                                      } ${isListFinalized ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
                                      id={`btn-toggle-shop-${item.id}`}
                                    >
                                      {item.is_bought && <span className="font-extrabold text-[10px]">✓</span>}
                                    </button>
                                  </td>

                                  {/* Item Name */}
                                  <td className="py-2 px-3">
                                    <input
                                      type="text"
                                      disabled={isListFinalized}
                                      value={item.name}
                                      onChange={(e) => handleUpdateShopItem(item.id, { name: e.target.value })}
                                      className={`w-full bg-transparent font-semibold border-0 focus:border-b focus:border-violet-400 focus:outline-none focus:ring-0 ${
                                        item.is_bought ? "line-through text-slate-400 font-normal" : "text-slate-800"
                                      } text-xs py-1 transition-all`}
                                    />
                                    <span className="text-[9px] text-slate-450 block leading-none">
                                      Adicionado por {item.added_by}
                                    </span>
                                  </td>

                                  {/* Quantidade with controls */}
                                  <td className="py-2 px-3 text-center">
                                    <div className="inline-flex items-center gap-1">
                                      {!isListFinalized && (
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateShopItem(item.id, { quantity: Math.max(0.1, item.quantity - 1) })}
                                          className="w-4.5 h-4.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex items-center justify-center text-[10px] select-none transition"
                                        >
                                          -
                                        </button>
                                      )}
                                      <input
                                        type="number"
                                        step="any"
                                        disabled={isListFinalized}
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateShopItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                        className="w-10 bg-slate-50 border border-slate-150 rounded text-center text-xs py-0.5 font-mono text-slate-900 focus:bg-white focus:border-violet-400 focus:outline-none focus:ring-0"
                                      />
                                      {!isListFinalized && (
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateShopItem(item.id, { quantity: item.quantity + 1 })}
                                          className="w-4.5 h-4.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex items-center justify-center text-[10px] select-none transition"
                                        >
                                          +
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Unidade with select suggestions */}
                                  <td className="py-2 px-3 animate-fade-in">
                                    <select
                                      disabled={isListFinalized}
                                      value={item.unit}
                                      onChange={(e) => handleUpdateShopItem(item.id, { unit: e.target.value })}
                                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-750 focus:bg-white focus:border-violet-400 focus:outline-none cursor-pointer font-medium"
                                    >
                                      {["unidades", "kg", "g", "L", "ml", "caixas", "pacotes", "lata", "garrafa"].map(u => (
                                        <option key={u} value={u}>{u}</option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Valor unitário */}
                                  <td className="py-2 px-3">
                                    <div className="relative flex items-center">
                                      <span className="absolute left-1.5 text-[10px] text-slate-400 select-none">R$</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        disabled={isListFinalized}
                                        value={item.price === undefined ? "" : item.price}
                                        onChange={(e) => handleUpdateShopItem(item.id, { price: e.target.value === "" ? null : parseFloat(e.target.value) })}
                                        placeholder="0,00"
                                        className="w-full pl-6 pr-1.5 bg-slate-50 border border-slate-200 rounded text-left text-xs py-0.5 font-mono text-slate-900 focus:bg-white focus:border-violet-400 focus:outline-none"
                                      />
                                    </div>
                                  </td>

                                  {/* Subtotal */}
                                  <td className="py-2 px-3 font-semibold text-slate-800 font-mono">
                                    {subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>

                                  {/* Category select */}
                                  <td className="py-2 px-3">
                                    <select
                                      disabled={isListFinalized}
                                      value={item.category}
                                      onChange={(e) => handleUpdateShopItem(item.id, { category: e.target.value })}
                                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded px-1.5 py-0.5 text-[10.5px] text-slate-700 focus:bg-white focus:outline-none font-bold uppercase cursor-pointer"
                                    >
                                      {Object.values(ShoppingCategory).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Action block */}
                                  <td className="py-2 px-3 text-center">
                                    {!isListFinalized && (
                                      <button
                                        type="button"
                                        onClick={() => handleAction("/api/shopping/delete", { id: item.id })}
                                        className="p-1 text-slate-350 hover:text-red-500 opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer"
                                        title="Excluir Item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* CATEGORY BREAKDOWN BILL CARDS */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-4 flex flex-col gap-2.5 shadow-3xs animate-fade-in" id="shopping-category-breakdown-card">
                      <h4 className="text-[10.5px] font-bold text-slate-500 uppercase tracking-widest block mb-1">📊 Rateio e Custos Automáticos por Categoria</h4>
                      <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {Object.values(ShoppingCategory).map(cat => {
                          const catItems = filteredShopping.filter(i => i.category === cat);
                          const catChecked = catItems.filter(i => i.is_bought);
                          
                          const catSubtotal = catItems.reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0);
                          const catCheckedSubtotal = catChecked.reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0);

                          if (catItems.length === 0) return null;

                          return (
                            <div key={cat} className="bg-white border border-slate-150/70 rounded-2xl p-3 flex flex-col justify-between shadow-3xs" id={`cat-summary-${cat}`}>
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className={`w-2 h-2 rounded-full ${
                                    cat === ShoppingCategory.HORTIFRUTI ? "bg-emerald-500" :
                                    cat === ShoppingCategory.LATICINIOS ? "bg-amber-400" :
                                    cat === ShoppingCategory.CARNES ? "bg-red-500" :
                                    cat === ShoppingCategory.LIMPEZA ? "bg-blue-400" :
                                    cat === ShoppingCategory.HIGIENE ? "bg-pink-400" : "bg-slate-400"
                                  }`} />
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block truncate">{cat}</span>
                                </div>
                                
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-xs font-bold text-slate-800">
                                    {catCheckedSubtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-sans">
                                    / {catSubtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Simple category progress indicator */}
                              <div className="h-1 bg-slate-100 rounded-full mt-2.5 overflow-hidden w-full">
                                <div 
                                  className="h-full bg-violet-500 rounded-full transition-all duration-300" 
                                  style={{ width: `${catSubtotal ? (catCheckedSubtotal / catSubtotal) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* HISTORY LIST AND ESTIMATE VS ACTUAL COMPARISONS */}
              {couple.shoppingFinalizations && couple.shoppingFinalizations.length > 0 && (
                <div className="border border-slate-100 bg-white rounded-3xl p-5 shadow-3xs animate-fade-in" id="shopping-finalization-history">
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="text-lg">🧾</span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Histórico de Fechamentos Recentes</h3>
                      <p className="text-[10px] text-slate-400">Histórico comparativo entre estimativa da lista e da nota fiscal final de compras faturadas</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {[...couple.shoppingFinalizations].reverse().map((fin: any) => {
                      const diffAbs = Math.abs(fin.difference);
                      const savedMoney = fin.difference > 0;
                      
                      return (
                        <div key={fin.id} className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-850 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                                {(() => {
                                  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                                  const parts = fin.monthId.split("-");
                                  const m = parseInt(parts[1], 10);
                                  if (isNaN(m)) return fin.monthId;
                                  return `${months[m - 1]}/${parts[0]}`;
                                })()}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Finalizado em {new Date(fin.date).toLocaleDateString("pt-BR")} por {fin.paidBy} ({fin.paymentMethod})
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 text-slate-600">
                              <span>Estimativa da Lista: <strong className="text-slate-800">{fin.estimatedTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></span>
                              <span>Nota Fiscal Real: <strong className="text-slate-800">{fin.realTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-start sm:items-end justify-center shrink-0">
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 ${
                              savedMoney 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-150" 
                                : "bg-amber-50 text-amber-800 border border-amber-150"
                            }`}>
                              <span>{savedMoney ? "🎉 Economia:" : "⚠️ Desvio:"}</span>
                              <span>{diffAbs.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                            </div>
                            <p className="text-[10.5px] text-slate-500 mt-1 italic font-semibold">
                              {savedMoney 
                                ? `Vocês economizaram ${diffAbs.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})} em relação à estimativa! 💜`
                                : `Vocês gastaram ${diffAbs.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})} além do planejado.`
                              }
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PREDICTIVE INTELLIGENCE INSIGHT MODULE (6.4 Inteligência futura) */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-violet-50/40 to-white border border-indigo-150 rounded-3xl p-5 shadow-3xs" id="shopping-predictions">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg">🔮</span>
                  <div>
                    <h3 className="font-bold text-xs text-indigo-950 uppercase tracking-widest">Dicas Preditivas & Previsão Inteligente</h3>
                    <p className="text-[10px] text-indigo-500 leading-none mt-0.5">Métricas de preços para ajudar o casal a economizar nas próximas compras</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white/80 p-3 rounded-2xl border border-indigo-50 flex items-start gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-sm">📈</span>
                    <div>
                      <p className="font-bold text-[10.5px] text-slate-800">Alerta de Preço Médio</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        O quilo do <strong>Tomate italiano</strong> está cotado a R$ 8,10 nas redes parceiras locais. Evite pagar acima do valor médio!
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-3 rounded-2xl border border-indigo-50 flex items-start gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-sm">🛒</span>
                    <div>
                      <p className="font-bold text-[10.5px] text-slate-800">Tendência de Inflação</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        Os itens de <strong>Laticínios</strong> subiram em média 4.2% em relação ao mês anterior. Considere comprar marcas alternativas qualificadas.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-3 rounded-2xl border border-indigo-50 flex items-start gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-sm">💡</span>
                    <div>
                      <p className="font-bold text-[10.5px] text-slate-800">Previsão Demanda Mensal</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        Estimamos um custo de <strong>{expectedTotal.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</strong> para a sua compra recorrente. Programem o orçamento do casal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>



             {/* INTEGRATED HOUSEHOLD STOCK INVENTORY PANEL (Rule 15 - Inventário da Casa) */}
            <div className="mt-4 border border-violet-200/70 rounded-2xl p-4 bg-violet-50/20 shadow-3xs">
              <h3 className="text-xs font-bold text-violet-950 uppercase tracking-wide mb-3 flex items-center justify-between">
                <span>📦 Estoque Permanente da Casa</span>
                <span className="text-[10px] text-violet-500 normal-case font-normal">Sincroniza com as compras</span>
              </h3>
              
              <div className="flex flex-col gap-2 bg-white rounded-xl border border-slate-100 p-3 max-h-[180px] overflow-y-auto pr-1">
                {inventory.map(invItem => (
                  <div key={invItem.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 text-xs text-slate-705">
                    <div>
                      <span className="font-semibold text-slate-800">{invItem.name}</span>
                      <p className="text-[10px] text-slate-400">Mínimo necessário: {invItem.min_quantity} {invItem.unit}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {editingStockId === invItem.id ? (
                        <input
                          type="number"
                          value={editingStockQty}
                          onChange={(e) => setEditingStockQty(e.target.value)}
                          onBlur={() => {
                            handleAction("/api/inventory/update", { id: invItem.id, quantity: editingStockQty });
                            setEditingStockId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAction("/api/inventory/update", { id: invItem.id, quantity: editingStockQty });
                              setEditingStockId(null);
                            }
                          }}
                          className="w-12 border border-slate-200 px-1 py-0.5 rounded text-center text-[11px]"
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingStockId(invItem.id);
                            setEditingStockQty(invItem.quantity.toString());
                          }}
                          className={`px-2 py-0.5 font-bold rounded cursor-pointer ${
                            invItem.quantity <= invItem.min_quantity 
                              ? "bg-red-50 text-red-600 border border-red-100" 
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                          title="Clique para editar estoque"
                        >
                          {invItem.quantity} {invItem.unit} {invItem.quantity <= invItem.min_quantity && "⚠️"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Inventory Item trigger */}
              <div className="mt-3 border-t border-violet-100/50 pt-3 flex flex-col gap-2">
                <p className="text-[10px] font-bold text-violet-950 uppercase">Cadastrar Novo Item de Monitoramento:</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do Item (ex: Açúcar)"
                    id="new-inv-name"
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs md:col-span-2"
                  />
                  <div className="flex gap-1.5 md:col-span-1">
                    <input
                      type="number"
                      placeholder="Mínimo"
                      id="new-inv-min"
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs w-14 text-center"
                    />
                    <input
                      type="text"
                      placeholder="Unidade"
                      id="new-inv-unit"
                      className="bg-white border border-slate-200 rounded-lg px-2 relative py-1 text-xs flex-1"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const name = (document.getElementById("new-inv-name") as HTMLInputElement)?.value;
                      const min = parseFloat((document.getElementById("new-inv-min") as HTMLInputElement)?.value || "1");
                      const unit = (document.getElementById("new-inv-unit") as HTMLInputElement)?.value || "unidades";
                      if (!name) {
                        triggerCustomNotify("Forneça o nome do item!", "error");
                        return;
                      }
                      handleAction("/api/inventory/update", {
                        name,
                        min_quantity: min,
                        quantity: min + 2, // starts with some stock
                        unit
                      });
                      (document.getElementById("new-inv-name") as HTMLInputElement).value = "";
                      (document.getElementById("new-inv-min") as HTMLInputElement).value = "";
                      (document.getElementById("new-inv-unit") as HTMLInputElement).value = "";
                    }}
                    className="bg-violet-650 hover:bg-violet-700 text-white font-bold py-1 px-2.5 rounded-lg text-xs tracking-wide cursor-pointer transition shrink-0"
                  >
                    + Cadastrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ); })()}

        {/* TAB 5: MAIS (FINANCES, MEMORIES, MOODS, WISHLISTS, RECIPES, SETTINGS) */}
        {activeTab === "more" && (
          <div className="p-4 sm:p-6 flex-1 flex flex-col gap-3.5 sm:gap-4" id="view-more">
            
            {/* Horizontal Sub tab navigation selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 text-xs shrink-0" id="more-subnav">
              {[
                { s: "finances", label: "💵 Finanças", color: "border-emerald-500 text-emerald-800 bg-emerald-50/20" },
                { s: "gamification", label: "🏆 Conquistas", color: "border-amber-500 text-amber-850 bg-amber-50/20" },
                { s: "memories", label: "📸 Álbum", color: "border-pink-500 text-pink-800 bg-pink-50/20" },
                { s: "mood", label: "🎯 Insights & Humores", color: "border-indigo-500 text-indigo-800 bg-indigo-50/20" },
                { s: "wishlist", label: "🎁 Wishlist", color: "border-amber-500 text-amber-800 bg-amber-50/20" },
                { s: "recipes", label: "🍳 Cardápio", color: "border-violet-500 text-violet-800 bg-violet-50/20" },
                { s: "pets", label: "🐾 Pets", color: "border-teal-500 text-teal-800 bg-teal-50/20" },
                { s: "house", label: "🏡 Casa & Contatos", color: "border-sky-500 text-sky-800 bg-sky-50/20" },
                { s: "settings", label: "⚙️ Perfis", color: "border-slate-500 text-slate-800 bg-slate-50/20" }
              ].map(sub => (
                <button
                  key={sub.s}
                  onClick={() => setMoreSubTab(sub.s as any)}
                  className={`px-3 py-1.5 rounded-full border transition shrink-0 ${
                    moreSubTab === sub.s 
                      ? `${sub.color} font-bold shadow-sm` 
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUB-VIEW 1: FINANCES */}
            {moreSubTab === "finances" && (() => {
              // Calculate reactive variables in-scope
              const dynamicFilteredExpenses = expenses.filter(e => {
                if (selectedMonth === "all") return true;
                return e.date && e.date.substring(0, 7) === selectedMonth;
              });

              const totalAmountPaid = dynamicFilteredExpenses.reduce((sum, e) => sum + getExpenseMonthlyVal(e), 0);
              const leandroPaid = dynamicFilteredExpenses.filter(e => e.paid_by_id === firstUserId).reduce((sum, e) => sum + getExpenseMonthlyVal(e), 0);
              const kaisaPaid = dynamicFilteredExpenses.filter(e => e.paid_by_id === secondUserId).reduce((sum, e) => sum + getExpenseMonthlyVal(e), 0);

              // Payment channels
              let debitoSum = 0;
              let creditoSum = 0;
              let pixSum = 0;
              let dinheiroSum = 0;
              let carteiraSum = 0;
              let outroSum = 0;

              dynamicFilteredExpenses.forEach(e => {
                const pm = e.payment_method;
                if (pm === "Débito") debitoSum += e.value;
                else if (pm === "Crédito") {
                  // If it is credit card, it might have installments. In current month we account for its monthly_installment_value
                  if (e.installments_total && e.installments_total > 1) {
                    creditoSum += e.monthly_installment_value || (e.value / e.installments_total);
                  } else {
                    creditoSum += e.value;
                  }
                }
                else if (pm === "Pix") pixSum += e.value;
                else if (pm === "Dinheiro") dinheiroSum += e.value;
                else if (pm === "Carteira digital") carteiraSum += e.value;
                else if (pm === "Outro") outroSum += e.value;
                else {
                  // Fallback string matching for older items
                  const descLower = (e.description || "").toLowerCase();
                  if (descLower.includes("débito") || descLower.includes("debito")) debitoSum += e.value;
                  else if (descLower.includes("crédito") || descLower.includes("credito")) creditoSum += e.value;
                  else if (descLower.includes("pix")) pixSum += e.value;
                  else if (descLower.includes("dinheiro")) dinheiroSum += e.value;
                  else if (descLower.includes("carteira") || descLower.includes("vr")) carteiraSum += e.value;
                  else outroSum += e.value;
                }
              });

              // Adjust total spent considering currently billed installments if any
              let resolvedTotalSpent = 0;
              dynamicFilteredExpenses.forEach(e => {
                if (e.payment_method === "Crédito" && e.installments_total && e.installments_total > 1) {
                  resolvedTotalSpent += e.monthly_installment_value || (e.value / e.installments_total);
                } else {
                  resolvedTotalSpent += e.value;
                }
              });

              // Category Sums
              const categoriesMap: Record<ExpenseCategory, number> = {
                [ExpenseCategory.ALIMENTACAO]: 0,
                [ExpenseCategory.MORADIA]: 0,
                [ExpenseCategory.LAZER]: 0,
                [ExpenseCategory.SAUDE]: 0,
                [ExpenseCategory.TRANSPORTE]: 0,
                [ExpenseCategory.PETS]: 0,
                [ExpenseCategory.OUTROS]: 0
              };
              dynamicFilteredExpenses.forEach(e => {
                const c = e.category;
                let val = e.value;
                if (e.payment_method === "Crédito" && e.installments_total && e.installments_total > 1) {
                  val = e.monthly_installment_value || (e.value / e.installments_total);
                }
                if (categoriesMap[c] !== undefined) {
                  categoriesMap[c] += val;
                } else {
                  categoriesMap[ExpenseCategory.OUTROS] += val;
                }
              });

              // Weekly bucket sums (days 1-7, 8-14, 15-21, 22-31)
              const weekSums = [0, 0, 0, 0];
              dynamicFilteredExpenses.forEach(e => {
                if (!e.date) return;
                const parts = e.date.split("-");
                const day = parseInt(parts[2], 10);
                let val = e.value;
                if (e.payment_method === "Crédito" && e.installments_total && e.installments_total > 1) {
                  val = e.monthly_installment_value || (e.value / e.installments_total);
                }
                if (!isNaN(day)) {
                  if (day <= 7) weekSums[0] += val;
                  else if (day <= 14) weekSums[1] += val;
                  else if (day <= 21) weekSums[2] += val;
                  else weekSums[3] += val;
                }
              });
              const maxWeekSum = Math.max(...weekSums, 1);

              // Subscriptions & Recurring
              const recurringExpenses = expenses.filter(e => e.is_recurring);
              const totalRecurringCost = recurringExpenses.reduce((sum, e) => sum + e.value, 0);
              const paidRecurringCost = recurringExpenses.filter(e => e.is_paid_this_month).reduce((sum, e) => sum + e.value, 0);

              // active credit card items for the currently selected month (Aba Fatura)
              const creditCardItems = dynamicFilteredExpenses.filter(e => e.payment_method === "Crédito");
              
              // active credit card installments (used for projections)
              const creditCardInstallmentItems = expenses.filter(e => e.payment_method === "Crédito" && e.installments_total && e.installments_total > 1);

              // Future commitments projection (month + i)
              const monthsNamesFull = [
                "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
              ];
              let startY = 2026;
              let startM = 5; // Maio
              if (selectedMonth && selectedMonth !== "all") {
                const parts = selectedMonth.split("-");
                startY = parseInt(parts[0], 10) || 2026;
                startM = parseInt(parts[1], 10) || 5;
              }
              const futureEstimates = [];
              for (let i = 1; i <= 4; i++) {
                let targetM = startM + i;
                let targetY = startY;
                while (targetM > 12) {
                  targetM -= 12;
                  targetY += 1;
                }
                let committedSum = 0;
                const activeItems: any[] = [];
                // Look at all credit expenses with installments in the system
                expenses.forEach(e => {
                  if (e.payment_method === "Crédito" && e.installments_total && e.installments_total > 1) {
                    const curr = e.installments_current || 1;
                    const tot = e.installments_total;
                    const val = e.monthly_installment_value || (e.value / tot);
                    // If target month falls inside the installment duration span
                    if (curr + i <= tot) {
                      committedSum += val;
                      activeItems.push({
                        description: e.description,
                        installmentsText: `Parcela ${curr + i} de ${tot}`,
                        value: val,
                        card: e.card_name || "Geral"
                      });
                    }
                  }
                });
                futureEstimates.push({
                  monthLabel: `${monthsNamesFull[targetM - 1]} de ${String(targetY).slice(-2)}`,
                  total: committedSum,
                  items: activeItems
                });
              }

              // Dynamic light insights
              const deliveryExpenses = dynamicFilteredExpenses.filter(e => {
                const dLower = (e.description || "").toLowerCase();
                return dLower.includes("delivery") || dLower.includes("ifood") || dLower.includes("pizza") || dLower.includes("burger") || dLower.includes("hamburguer");
              });
              const deliveryTotal = deliveryExpenses.reduce((sum, e) => sum + e.value, 0);

              let maxExpense: typeof expenses[0] | null = null;
              dynamicFilteredExpenses.forEach(e => {
                if (!maxExpense || e.value > maxExpense.value) {
                  maxExpense = e;
                }
              });

              const insightsList: string[] = [];
              // Insight 1
              if (recipes.length > 0) {
                insightsList.push("Esse mês vocês cozinharam mais em casa 🍝! Continuem usando o Cardápio compartilhado.");
              } else {
                insightsList.push("Aproveitem para cozinhar juntos e planejar receitas com o Cardápio do casal! 🍕");
              }
              // Insight 2
              if (deliveryTotal > 150) {
                insightsList.push(`Os gastos com delivery estão em ${deliveryTotal.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})} este mês. Que tal planejar um jantar caseiro? 👩‍🍳`);
              } else if (deliveryTotal > 0) {
                insightsList.push("Parcerias que cozinham juntas economizam! Os gastos com delivery diminuíram este período. 👍");
              } else {
                insightsList.push("Uau! Nenhum gasto com delivery registrado este período. Vocês são chefs de primeira! 🥦");
              }
              // Insight 3
              if (maxExpense) {
                let emoji = "✈️";
                const cat = (maxExpense as any).category;
                if (cat === ExpenseCategory.ALIMENTACAO) emoji = "🍝";
                else if (cat === ExpenseCategory.MORADIA) emoji = "🏡";
                else if (cat === ExpenseCategory.LAZER) emoji = "🍿";
                else if (cat === ExpenseCategory.SAUDE) emoji = "🩺";
                else if (cat === ExpenseCategory.TRANSPORTE) emoji = "🚗";
                else if (cat === ExpenseCategory.PETS) emoji = "🐶";
                
                const descL = (maxExpense as any).description.toLowerCase();
                if (descL.includes("viagem") || descL.includes("hotel") || descL.includes("voo") || descL.includes("passagem") || descL.includes("ferias")) {
                  emoji = "✈️";
                }
                insightsList.push(`Maior gasto do período foi "${(maxExpense as any).description}" (${(maxExpense as any).value.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}) ${emoji}`);
              } else {
                insightsList.push("Tudo organizado e em perfeito equilíbrio de companheirismo entre vocês! 💜");
              }

              // Month select formatting and dynamic option generation
              const financeOptions = Array.from(
                new Set([
                  "all",
                  currentInitialMonth,
                  (() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 1);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                  })(),
                  (() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - 1);
                    return `${d.getFullYear()}-${String(d.getMonth() - 1).padStart(2, "0")}`;
                  })(),
                  ...expenses.map(e => e.date ? e.date.substring(0, 7) : "").filter(Boolean)
                ])
              ).filter(Boolean).sort();

              const getMonthText = (ym: string) => {
                if (ym === "all") return "Geral";
                const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                const parts = ym.split("-");
                if (parts.length < 2) return ym;
                const m = parseInt(parts[1], 10);
                if (isNaN(m) || m < 1 || m > 12) return ym;
                return `${months[m - 1]}/${parts[0].slice(2)}`;
              };

              return (
                <div className="flex flex-col gap-4 animate-fade-in" id="subview-finances">
                  
                  {/* HEADER SECTION WITH FILTERS */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3" id="finances-header-combined">
                    <div>
                      <h3 className="font-bold text-slate-950 text-base font-display">Resumo Financeiro do Lar</h3>
                      <p className="text-xs text-slate-500">Como foi o mês de vocês? Gastos compartilhados da rotina sem cobranças. 💜</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl max-w-[280px] overflow-x-auto scrollbar-none">
                        {financeOptions.map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSelectedMonth(opt)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ${
                              selectedMonth === opt 
                                ? "bg-violet-600 text-white shadow-xs" 
                                : "text-slate-650 hover:bg-white"
                            }`}
                          >
                            {getMonthText(opt)}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setExpenseModalOpen(true)}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:shadow transition whitespace-nowrap cursor-pointer"
                        id="btn-add-expense"
                      >
                        + Registrar Gasto
                      </button>
                    </div>
                  </div>

                  {/* SECONDARY INTERNAL FINANCE NAVIGATION */}
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1" id="finances-internal-tabs">
                    {[
                      { id: "dashboard", label: "📊 Resumo & Insights" },
                      { id: "list", label: "📝 Gastos do Mês" },
                      { id: "cards", label: "💳 Cartões & Assinaturas" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFinanceActiveTab(tab.id as any)}
                        className={`px-3.5 py-2 border-b-2 text-xs font-bold transition-all ${
                          financeActiveTab === tab.id 
                            ? "border-violet-600 text-violet-700" 
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* SUBTAB 1: VISUAL DASHBOARD */}
                  {financeActiveTab === "dashboard" && (
                    <div className="flex flex-col gap-5 animate-fade-in" id="finance-tab-dashboard">
                      
                      {/* BANNER RESUMO DO LAR */}
                      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-750 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden" id="banner-resumo-lar">
                        <div className="absolute right-3 bottom-0 opacity-10 font-sans pointer-events-none select-none text-9xl">💜</div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
                          <div>
                            <span className="text-[9.5px] uppercase font-extrabold tracking-widest text-violet-200 bg-violet-850/65 px-2.5 py-1 rounded-full border border-violet-500/20">
                              {selectedMonth === "all" ? "Histórico Geral do NósDois" : `Mês de Referência: ${selectedMonth.split("-").reverse().join("/")}`}
                            </span>
                            <h4 className="text-xs text-violet-100 font-sans mt-3">Quanto nosso lar consumiu este mês:</h4>
                            <h2 className="text-3xl font-extrabold font-display leading-tight mt-1 text-white">
                              {resolvedTotalSpent.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}
                            </h2>
                            <p className="text-[11px] text-violet-200/90 font-sans mt-1">Consciência financeira e clareza compartilhada para a tranquilidade de vocês.</p>
                          </div>

                          {/* NATURAL SPLIT GRAPH WITH ZERO JUDGMENT */}
                          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl md:max-w-xs w-full flex flex-col gap-2.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-200 block text-center md:text-left">Distribuição natural de despesas</span>
                            
                            <div className="flex justify-between text-[11px] font-bold text-white">
                              <span>🧑‍💻 {users.Leandro?.name || "Leandro"}: {leandroPaid.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}</span>
                              <span>👩‍🦰 {users.Kaisa?.name || "Kaisa"}: {kaisaPaid.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}</span>
                            </div>

                            {/* Dual colored visual progress bar */}
                            <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden flex">
                              <div 
                                style={{ width: `${totalAmountPaid > 0 ? (leandroPaid / totalAmountPaid) * 100 : 50}%` }} 
                                className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 font-bold transition-all duration-500"
                                title={users.Leandro?.name || "Leandro"}
                              />
                              <div 
                                style={{ width: `${totalAmountPaid > 0 ? (kaisaPaid / totalAmountPaid) * 100 : 50}%` }} 
                                className="h-full bg-gradient-to-r from-pink-400 to-rose-400 font-bold transition-all duration-500"
                                title={users.Kaisa?.name || "Kaisa"}
                              />
                            </div>

                            <p className="text-[9.5px] text-violet-200 leading-snug italic text-center md:text-left font-sans">
                              O equilíbrio acontece naturalmente na rotina do casal. Tudo organizado entre vocês 💜
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* TWO-COLUMN METRICS AND PROGRESS STATS GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="dashboard-charts-grid">
                        
                        {/* WIDGET: DISTRIBUIÇÃO POR FORMA DE PAGAMENTO */}
                        <div className="border border-slate-200 bg-white p-4 rounded-3xl flex flex-col gap-3 shadow-3xs" id="widget-payment-methods">
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <span className="text-sm">🪙</span>
                            <h4 className="text-xs font-bold text-slate-850 font-display">Distribuição por Forma de Pagamento</h4>
                          </div>
                          
                          <div className="flex flex-col gap-2.5 mt-1.5">
                            {[
                              { label: "💳 Crédito", value: creditoSum, color: "bg-indigo-500" },
                              { label: "📱 Pix", value: pixSum, color: "bg-teal-500" },
                              { label: "💳 Débito", value: debitoSum, color: "bg-blue-500" },
                              { label: "💵 Dinheiro", value: dinheiroSum, color: "bg-emerald-500" },
                              { label: "📱 Carteira digital", value: carteiraSum, color: "bg-purple-500" },
                              { label: "⚙️ Outro", value: outroSum, color: "bg-slate-400" }
                            ].map((item, idx) => {
                              const pct = Math.round(totalAmountPaid > 0 ? (item.value / totalAmountPaid) * 100 : 0);
                              return (
                                <div key={idx} className="flex flex-col gap-1">
                                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                                    <span>{item.label}</span>
                                    <span className="font-bold font-mono text-slate-800">
                                      {item.value.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})} ({pct}%)
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      style={{ width: `${pct}%` }} 
                                      className={`h-full ${item.color} transition-all duration-300`} 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* WIDGET: CATEGORIAS COM MAIS GASTOS */}
                        <div className="border border-slate-200 bg-white p-4 rounded-3xl flex flex-col gap-3 shadow-3xs" id="widget-categories-chart">
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <span className="text-sm">🥧</span>
                            <h4 className="text-xs font-bold text-slate-850 font-display">Categorias com Mais Gastos</h4>
                          </div>

                          <div className="flex flex-col gap-2.5 mt-1.5">
                            {[
                              { label: "🍔 Alimentação", value: categoriesMap[ExpenseCategory.ALIMENTACAO], color: "bg-yellow-500" },
                              { label: "🏡 Moradia / Aluguel", value: categoriesMap[ExpenseCategory.MORADIA], color: "bg-sky-500" },
                              { label: "🍿 Lazer / Cinema", value: categoriesMap[ExpenseCategory.LAZER], color: "bg-rose-500" },
                              { label: "🩺 Saúde", value: categoriesMap[ExpenseCategory.SAUDE], color: "bg-emerald-500" },
                              { label: "🚗 Transporte", value: categoriesMap[ExpenseCategory.TRANSPORTE], color: "bg-orange-500" },
                              { label: "🐶 Luke (Pets)", value: categoriesMap[ExpenseCategory.PETS], color: "bg-indigo-500" },
                              { label: "📦 Outros", value: categoriesMap[ExpenseCategory.OUTROS], color: "bg-slate-400" }
                            ].map((item, idx) => {
                              const pct = Math.round(totalAmountPaid > 0 ? (item.value / totalAmountPaid) * 105 : 0); // small scaling for visually full effect
                              const safePct = Math.min(pct, 100);
                              return (
                                <div key={idx} className="flex flex-col gap-1">
                                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                                    <span>{item.label}</span>
                                    <span className="font-bold font-mono text-slate-800">
                                      {item.value.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      style={{ width: `${safePct}%` }} 
                                      className={`h-full ${item.color} transition-all duration-300`} 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* WEEKLY EVOLUTION OF THE MONTH */}
                      <div className="border border-slate-200 bg-white p-4 rounded-3xl flex flex-col gap-4 shadow-3xs" id="widget-weekly-evolution">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <span className="text-sm">📈</span>
                            <h4 className="text-xs font-bold text-slate-850 font-display">Evolução Semanal do Mês</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans">Soma das despesas por semana</span>
                        </div>

                        {/* Flex vertical bar chart columns */}
                        <div className="flex items-end justify-around h-28 pt-2" id="weekly-columns-container">
                          {weekSums.map((val, idx) => {
                            const barHeight = Math.min(Math.round((val / maxWeekSum) * 75), 75);
                            return (
                              <div key={idx} className="flex flex-col items-center gap-2 w-1/4">
                                <span className="text-[10px] font-mono text-slate-700 font-bold">
                                  {val > 0 ? val.toLocaleString("pt-BR", {minimumFractionDigits: 0, maximumFractionDigits: 0}) : "R$ 0"}
                                </span>
                                <div 
                                  style={{ height: `${Math.max(barHeight, 4)}px` }} 
                                  className={`w-10 rounded-t-lg bg-gradient-to-t ${
                                    idx === 0 ? "from-indigo-400 to-indigo-500" :
                                    idx === 1 ? "from-violet-400 to-violet-500" :
                                    idx === 2 ? "from-purple-400 to-purple-500" : "from-pink-400 to-pink-500"
                                  } min-h-[4px] transition-all duration-500 hover:opacity-85 shadow-3xs`} 
                                />
                                <span className="text-[10.5px] text-slate-500 font-semibold uppercase tracking-wider">
                                  Semana {idx + 1}
                                </span>
                                <span className="text-[8.5px] text-slate-400 font-sans">
                                  {idx === 0 ? "01 a 07" : idx === 1 ? "08 a 14" : idx === 2 ? "15 a 21" : "22 a 31"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* LIGHT FINANCIAL INSIGHTS */}
                      <div className="bg-amber-50/40 border border-amber-150 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in" id="finance-insights-box">
                        <div className="flex items-center gap-1.5 text-amber-800">
                          <span className="text-sm">🌟</span>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider">Insights Financeiros Leves</h4>
                        </div>
                        <p className="text-[11px] text-slate-650 leading-relaxed">
                          Acompanhamento amigável sobre o comportamento financeiro conjunto do casal para dar tranquilidade e perspectiva rápida:
                        </p>
                        
                        <div className="flex flex-col gap-2 mt-1">
                          {insightsList.map((ins, idx) => (
                            <div key={idx} className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50 flex items-start gap-2 text-xs shadow-3xs animate-slide-up">
                              <span className="text-xs shrink-0 mt-0.5">✨</span>
                              <p className="font-semibold text-slate-755 leading-relaxed">{ins}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUBTAB 2: LIST OF ALL EXPENSES INCLUDING FIXED */}
                  {financeActiveTab === "list" && (
                    <div className="flex flex-col gap-3 animate-fade-in" id="finance-tab-listing">
                      
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
                          {selectedMonth === "all" ? "Todos os Gastos da Rotina" : `Gastos da Rotina do Período (${getMonthText(selectedMonth) || selectedMonth})`}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                          {dynamicFilteredExpenses.length} despesas registradas
                        </span>
                      </div>

                      {dynamicFilteredExpenses.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400 italic bg-white border border-slate-100 rounded-3xl">
                          Nenhum gasto registrado neste período de compras. Clique acima para registrar o primeiro! 💜
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {dynamicFilteredExpenses.map(expense => (
                            <div key={expense.id} className="border border-slate-150 bg-white p-3.5 rounded-2xl flex items-center justify-between text-xs hover:shadow-3xs transition-all relative overflow-hidden">
                              <div>
                                <p className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                  <span>{expense.description}</span>
                                  {expense.is_recurring && (
                                    <span className="text-[9px] font-sans bg-teal-50 text-teal-850 px-1.5 py-0.2 rounded-md font-extrabold border border-teal-100 animate-pulse-subtle">
                                      🔁 Fixo / Recorrente
                                    </span>
                                  )}
                                  {expense.payment_method && (
                                    <span className="text-[9px] font-sans bg-violet-50 text-violet-755 px-1.5 py-0.2 rounded-md font-extrabold border border-violet-100/40">
                                      {expense.payment_method === "Crédito" 
                                        ? `💳 Fatura / Crédito ${expense.card_name ? `(${expense.card_name})` : ""}` 
                                        : expense.payment_method === "Pix" ? "📱 Pix" 
                                        : expense.payment_method === "Débito" ? "💳 Débito" 
                                        : expense.payment_method === "Dinheiro" ? "💵 Dinheiro" 
                                        : `⚙️ ${expense.payment_method}`
                                      }
                                    </span>
                                  )}
                                  {expense.installments_total && expense.installments_total > 1 && (
                                    <span className="text-[9px] font-sans bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded-md font-extrabold border border-amber-100">
                                      🛒 Parcela {expense.installments_current}/{expense.installments_total}
                                    </span>
                                  )}
                                </p>
                                
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 flex-wrap font-sans">
                                  <span>Pago por: <strong className="text-slate-700">{users[expense.paid_by_id]?.name || expense.paid_by_id}</strong></span>
                                  <span>•</span>
                                  <span>{expense.category}</span>
                                  <span>•</span>
                                  <span className="font-mono bg-slate-50 px-1.5 py-0.2 rounded">{expense.date}</span>
                                </div>
                                
                                <span className="text-[9px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md mt-1.5 inline-block font-bold">
                                  {expense.split_type === "50/50" ? "Divisão conjunta (Meio a meio)" 
                                   : expense.split_type === "paid_all" ? "Pago integral por conta própria" 
                                   : expense.split_type === "partner_all" ? "Pago integral pelo companheiro" 
                                   : `Divisão customizada (${expense.custom_percent}% ${users.Leandro?.name || "Leandro"})`}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-col items-end shrink-0">
                                {expense.payment_method === "Crédito" && expense.installments_total && expense.installments_total > 1 ? (
                                  <>
                                    <span className="font-bold text-slate-850 font-mono text-sm whitespace-nowrap">
                                      {(expense.monthly_installment_value || (expense.value / expense.installments_total)).toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 font-sans">
                                      de {expense.value.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})} total
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-bold text-slate-800 font-mono text-sm whitespace-nowrap">
                                    {expense.value.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAction("/api/expenses/delete", { id: expense.id })}
                                  className="text-slate-350 hover:text-red-500 p-1 hover:bg-slate-50 rounded-lg transition"
                                  title="Excluir gasto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBTAB 3: RECURRING & CREDIT CARD INSTALMENTS FUTURE ANALYSIS */}
                  {financeActiveTab === "cards" && (() => {
                    // Calculate Fatura do Mês components
                    const totalFaturaThisMonth = creditCardItems.reduce((sum, item) => {
                      if (item.installments_total && item.installments_total > 1) {
                        return sum + (item.monthly_installment_value || (item.value / item.installments_total));
                      }
                      return sum + item.value;
                    }, 0);

                    return (
                      <div className="flex flex-col gap-6 animate-fade-in" id="finance-tab-cards">
                        
                        {/* CREDIT CARD PARCELAMENTO & FUTURE COMMITMENTS VIEW */}
                        <div className="border border-slate-200 bg-white p-5 rounded-3xl flex flex-col gap-4 shadow-3xs" id="section-credit-cards-installments">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <h4 className="text-xs font-bold font-display text-slate-800 flex items-center gap-1.5">
                                <span>💳</span>
                                <span>Fatura de Crédito do Lar</span>
                              </h4>
                              <p className="text-[10px] text-slate-400">Todos os gastos ativos desta fatura (à vista + parcelados no mês atual):</p>
                            </div>
                            <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-1 text-right">
                              <span className="text-[9px] uppercase font-bold text-violet-500 block">Total da Fatura</span>
                              <strong className="text-sm font-extrabold text-violet-600 font-mono">
                                {totalFaturaThisMonth.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}
                              </strong>
                            </div>
                          </div>

                          {creditCardItems.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-50 border border-slate-100/50 rounded-2xl">
                              Nenhuma despesa de crédito de fatura registrada para este período.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              {creditCardItems.map(item => {
                                const isInstallment = item.installments_total && item.installments_total > 1;
                                const mVal = isInstallment 
                                  ? (item.monthly_installment_value || (item.value / (item.installments_total || 1)))
                                  : item.value;
                                return (
                                  <div key={item.id} className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-all">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-800">{item.description}</span>
                                        {item.is_recurring && (
                                          <span className="text-[8px] bg-teal-50 text-teal-800 px-1 py-0.1 rounded font-bold">Fixo</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[9.5px] text-slate-450 mt-1 flex-wrap font-sans">
                                        <span className="bg-indigo-50 text-indigo-755 px-1.5 py-0.2 rounded font-bold">Cartão: {item.card_name || "Geral"}</span>
                                        <span>•</span>
                                        {isInstallment ? (
                                          <span className="bg-amber-50 text-amber-805 px-1.5 py-0.2 rounded font-bold">Parcela {item.installments_current} de {item.installments_total}</span>
                                        ) : (
                                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">À vista</span>
                                        )}
                                        <span>•</span>
                                        <span>Registrado por {item.paid_by_id}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-end">
                                        <span className="font-bold text-slate-800 font-mono">{mVal.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}</span>
                                        {isInstallment && (
                                          <span className="text-[9.5px] text-slate-400 font-mono">Total {item.value.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}</span>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleAction("/api/expenses/delete", { id: item.id })}
                                        className="text-slate-300 hover:text-red-500 p-1 hover:bg-slate-50 rounded transition shrink-0"
                                        title="Excluir despesa da fatura"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        {/* FUTURE SCHEDULE VIEW COMMITMENTS */}
                        <div className="mt-2 border-t border-slate-100 pt-4 flex flex-col gap-3">
                          <div className="flex items-center gap-1 text-slate-700">
                            <span className="text-xs">🔮</span>
                            <span className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider">Visão Futura de Gastos Parcelados Comprometidos</span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                            Projeção dos próximos meses de despesas já consolidadas com compras parceladas em andamento:
                          </p>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1 text-xs">
                            {futureEstimates.map((est, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-150 rounded-2xl p-3 flex flex-col gap-1.5 relative overflow-hidden hover:bg-slate-100/50 transition">
                                <div className="flex items-center justify-between gap-1 border-b border-slate-200/50 pb-1.5">
                                  <span className="font-bold text-slate-800">{est.monthLabel}</span>
                                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold font-serif whitespace-nowrap">Futuro</span>
                                </div>
                                <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                                  {est.total.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}
                                </div>
                                <span className="text-[9.5px] text-slate-400 font-serif mt-0.5 block">
                                  {est.items.length} parcelas ativas
                                </span>
                                {est.items.length > 0 && (
                                  <div className="mt-2 text-[9px] text-slate-500 max-h-[50px] overflow-y-auto pr-0.5 flex flex-col gap-1">
                                    {est.items.slice(0, 2).map((subI, subIdx) => (
                                      <div key={subIdx} className="flex justify-between border-t border-slate-200/30 pt-1">
                                        <span className="truncate max-w-[70px]" title={subI.description}>{subI.description}</span>
                                        <span className="font-mono text-slate-705 font-bold">{subI.value.toLocaleString("pt-BR", {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                                      </div>
                                    ))}
                                    {est.items.length > 2 && <span className="text-[8px] text-indigo-500 font-bold block text-right">+{est.items.length - 2} parcelas</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })()}

                </div>
              );
            })()}

            {/* SUB-VIEW 1.5: GAMIFICATION & COOPERATIVE WORLD */}
            {moreSubTab === "gamification" && (
              <div className="flex flex-col gap-6" id="subview-gamification">
                
                {/* Visual Level progress meter with narrative */}
                <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden" id="couple-xp-card">
                  <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                    <Trophy className="w-48 h-48 text-white stroke-[1.5]" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-md">
                      Sintonia Residencial
                    </span>
                    <span className="text-white/80 text-xs font-mono">•</span>
                    <span className="text-pink-100 text-xs font-semibold">NósDois RPG do Lar</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between mt-5 gap-4">
                    <div>
                      <h3 className="text-2xl font-black font-display tracking-tight flex items-center gap-2">
                        <span>🏡 Lar de NósDois</span>
                        <span className="text-sm bg-pink-400/50 border border-pink-300/40 px-2.5 py-0.5 rounded-lg text-white">
                          Nível {Math.floor(couple.total_points / 100) + 1}
                        </span>
                      </h3>
                      <p className="text-xs text-violet-100 mt-1 max-w-md font-medium">
                        Conquista atual: <strong className="text-white underline underline-offset-4 font-bold">
                          {(() => {
                            const lvl = Math.floor(couple.total_points / 100) + 1;
                            if (lvl === 1) return "Apartamento Vazio (Começo de Tudo) 📦";
                            if (lvl === 2) return "Primeiros Móveis (Conforto Inicial) 🛋️";
                            if (lvl === 3) return "Cozinha Decorada (Sabor & Aromas) 🍳";
                            if (lvl === 4) return "Luzes e Quadros Lindos (Nossa Arte) 🖼️";
                            if (lvl >= 5) return "Santuário Aconchegante (Lar dos Sonhos) ✨";
                            return "Nosso Ninho Especial 🏡";
                          })()}
                        </strong>
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className="text-xs text-violet-100">Total acumulado pelo casal:</p>
                      <span className="text-2xl font-black font-mono tracking-tight text-white">{couple.total_points} EXP</span>
                    </div>
                  </div>

                  {/* XP Progress Bar */}
                  <div className="mt-5" id="xp-progress-bar-area">
                    <div className="flex justify-between items-center text-xs text-violet-100 mb-1.5 font-semibold">
                      <span>Progresso até o Nível {Math.floor(couple.total_points / 100) + 2}</span>
                      <span className="font-mono">{couple.total_points % 100} / 100 XP</span>
                    </div>
                    
                    <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                      <div 
                        className="bg-white h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${couple.total_points % 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-[10px] text-white/70 italic mt-2 text-center md:text-left">
                      💡 Resolvam tarefas pendentes e registrem gastos para subir de nível e conseguir mais EXP!
                    </div>
                  </div>
                </div>

                {/* Scoreboard: Points of Leandro & Kaisa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="individual-scoreboard">
                  
                  {/* Leandro Card */}
                  <div className="bg-white border border-slate-100/90 p-4.5 rounded-3xl flex items-center justify-between shadow-xs hover:border-slate-200 transition">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center text-xl bg-blue-50/50">
                        🧑‍💻
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membro {users.Leandro?.name || "Leandro"}</h4>
                        <p className="text-sm font-semibold text-slate-800">{users.Leandro?.nickname || users.Kaisa?.partner_nickname || "Mozão"}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-xs text-slate-400">XP Semanal</p>
                      <h4 className="text-xl font-black text-blue-600">
                        {users.Leandro?.points_weekly || 0} XP
                      </h4>
                    </div>
                  </div>

                  {/* Kaisa Card */}
                  <div className="bg-white border border-slate-100/90 p-4.5 rounded-3xl flex items-center justify-between shadow-xs hover:border-slate-200 transition">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full border-2 border-pink-500 flex items-center justify-center text-xl bg-pink-50/50">
                        👩‍🦰
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membro {users.Kaisa?.name || "Kaisa"}</h4>
                        <p className="text-sm font-semibold text-slate-800">{users.Kaisa?.nickname || users.Leandro?.partner_nickname || "Meu Amor"}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-xs text-slate-400">XP Semanal</p>
                      <h4 className="text-xl font-black text-pink-600">
                        {users.Kaisa?.points_weekly || 0} XP
                      </h4>
                    </div>
                  </div>

                </div>

                {/* Weekly Active Quests Progression (Rule 7.2) */}
                <div className="border border-slate-100 bg-slate-50/20 p-5 rounded-3xl flex flex-col gap-4" id="weekly-quests">
                  <div className="flex items-center justify-between border-b border-slate-100/60 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Missões Ativas do Casal</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Missões cooperativas para aumentar a sintonia do lar.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddQuest(!showAddQuest)}
                      className="bg-violet-100 hover:bg-violet-200 text-violet-750 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      {showAddQuest ? "✕ Fechar" : "⚙️ Cadastrar Missão"}
                    </button>
                  </div>

                  {/* Add customized dynamic couple mission */}
                  {showAddQuest && (
                    <div className="bg-white border border-violet-100 p-4 rounded-2xl flex flex-col gap-3 text-xs animate-slide-up" id="form-cadastrar-missao">
                      <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">🎯 Novo Desafio Conjugal / Missão do Lar</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Título da Missão:</label>
                          <input
                            type="text"
                            placeholder="Ex: Jantar à Luz de Velas"
                            value={newQuestTitle}
                            onChange={(e) => setNewQuestTitle(e.target.value)}
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Tipo de Missão (Categoria):</label>
                          <select
                            value={newQuestType}
                            onChange={(e) => setNewQuestType(e.target.value)}
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full text-xs mt-1"
                          >
                            <option value="Afeto">💖 Afeto & Romance</option>
                            <option value="Faxina">🧹 Limpeza & Faxina</option>
                            <option value="Culinária">🍳 Cozinha & Chefs</option>
                            <option value="Saúde">🏃 Saúde & Esporte</option>
                            <option value="Outros">📦 Outros Desafios</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Alvo ou Regra do Desafio (Descrição):</label>
                        <input
                          type="text"
                          placeholder="Ex: Preparar fondue doce e dar risadas sem celular."
                          value={newQuestDesc}
                          onChange={(e) => setNewQuestDesc(e.target.value)}
                          className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full text-xs mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Pontos de Prêmio (EXP):</label>
                          <input
                            type="number"
                            placeholder="Ex: 50"
                            value={newQuestPoints}
                            onChange={(e) => setNewQuestPoints(e.target.value)}
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full text-xs mt-1"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!newQuestTitle || !newQuestDesc) {
                                triggerCustomNotify("Por favor, preencha o título e descrição do desafio!", "error");
                                return;
                              }
                              handleAction("/api/quests/create", {
                                title: newQuestTitle,
                                description: newQuestDesc,
                                type: newQuestType,
                                points: parseInt(newQuestPoints || "25", 10)
                              });
                              triggerCustomNotify("Nova Missão Conjugal cadastrada com sucesso!", "success");
                              setNewQuestTitle("");
                              setNewQuestDesc("");
                              setNewQuestPoints("20");
                              setShowAddQuest(false);
                            }}
                            className="w-full bg-violet-600 hover:bg-violet-750 text-white font-bold py-2 rounded-xl transition cursor-pointer text-xs"
                          >
                            + Confirmar Desafio
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="quests-grid">
                    {quests.map(quest => {
                      let progress = 0;
                      if (quest.id === "quest_1") {
                        progress = Math.min(100, Math.round((tasks.filter(t => t.completed).length / 3) * 105));
                        if (progress > 100) progress = 100;
                      } else if (quest.id === "quest_2") {
                        progress = leandroTodayMood && kaisaTodayMood ? 100 : leandroTodayMood || kaisaTodayMood ? 50 : 0;
                      } else if (quest.id === "quest_3") {
                        progress = recipes.length > 0 ? 100 : 0;
                      } else {
                        progress = quest.is_completed ? 100 : 0;
                      }

                      return (
                        <div key={quest.id} className={`bg-white border p-4 rounded-2xl flex flex-col justify-between hover:shadow-2xs transition ${quest.is_completed ? "border-emerald-200/60 bg-emerald-50/10 opacity-80 animate-fade-in" : "border-slate-100"}`}>
                          <div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                quest.type === "Faxina" ? "bg-sky-50 text-sky-700" :
                                quest.type === "Afeto" ? "bg-pink-50 text-pink-700" :
                                quest.type === "Culinária" ? "bg-violet-50 text-violet-700" :
                                "bg-indigo-50 text-indigo-700"
                              }`}>{quest.type}</span>
                              
                              {!["quest_1", "quest_2", "quest_3"].includes(quest.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleAction("/api/quests/delete", { id: quest.id })}
                                  className="text-slate-350 hover:text-red-500 p-0.5 transition"
                                  title="Remover Missão"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <h5 className="font-bold text-xs text-slate-850 mt-2">{quest.title}</h5>
                            <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">{quest.description}</p>
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                              <span>Progresso</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  quest.type === "Faxina" ? "bg-sky-500" :
                                  quest.type === "Afeto" ? "bg-pink-500" :
                                  quest.type === "Culinária" ? "bg-violet-500" :
                                  "bg-indigo-500"
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            
                            <div className="mt-2.5 flex items-center justify-between">
                              <span className="text-[9px] text-slate-400 font-semibold font-mono">
                                Prêmio: +{quest.points} XP
                              </span>
                              
                              {!quest.is_completed ? (
                                !["quest_1", "quest_2", "quest_3"].includes(quest.id) ? (
                                  <button
                                    onClick={() => {
                                      handleAction("/api/quests/toggle-complete", { id: quest.id, user_id: currentUser });
                                      triggerCustomNotify("Missão Concluída! Moedas creditadas no cofrinho!", "success");
                                    }}
                                    className="bg-[#10b981] hover:bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[9px]"
                                  >
                                    Concluir ✓
                                  </button>
                                ) : progress >= 100 ? (
                                  <button
                                    onClick={() => {
                                      handleAction("/api/quests/toggle-complete", { id: quest.id, user_id: currentUser });
                                      triggerCustomNotify("EXP do Lar resgatado com sucesso!", "success");
                                    }}
                                    className="bg-[#10b981] hover:bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[9px]"
                                  >
                                    Resgatar ✓
                                  </button>
                                ) : null
                              ) : (
                                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 select-none">
                                  ✓ Resgatado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Achievements stamps / Medalhas */}
                <div className="border border-slate-100 bg-white p-5 rounded-3xl flex flex-col gap-4" id="stamps-box">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medalhas de Sintonia do Casal</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Sua caminhada registrada através de selos digitais especiais baseados em suas realizações.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center mt-1" id="stamps-grid">
                    {[
                      {
                        id: "initial",
                        title: "Primeira Conexão",
                        desc: "Unidos no NósDois",
                        icon: "🏆",
                        condition: couple.total_points > 0,
                        color: "from-blue-105-to-indigo-200 bg-indigo-50/50"
                      },
                      {
                        id: "photos",
                        title: "Baú do Romance",
                        desc: "Primeira foto enviada",
                        icon: "📸",
                        condition: memories.length > 0,
                        color: "from-pink-105-to-rose-200 bg-pink-50/50"
                      },
                      {
                        id: "recipes",
                        title: "Chefs Estrelados",
                        desc: "Sua primeira receita",
                        icon: "🍳",
                        condition: recipes.length > 0,
                        color: "from-violet-100-to-indigo-200 bg-violet-50/50"
                      },
                      {
                        id: "finances",
                        title: "Unidade e Orçamento",
                        desc: "Primeiro acerto de contas",
                        icon: "💸",
                        condition: expenses.length > 0,
                        color: "from-emerald-100-to-teal-200 bg-emerald-50/50"
                      },
                      {
                        id: "shopping",
                        title: "Geladeira Cheia",
                        desc: "Compras concluídas",
                        icon: "🛒",
                        condition: shopping.filter(s => s.is_bought).length > 0,
                        color: "from-sky-100-to-blue-200 bg-sky-50/50"
                      },
                      {
                        id: "lvl2",
                        title: "Lar Doce Lar",
                        desc: "Alcançou Nível 2",
                        icon: "🛋️",
                        condition: (Math.floor(couple.total_points / 100) + 1) >= 2,
                        color: "from-amber-100-to-yellow-200 bg-amber-50/50"
                      }
                    ].map(stamp => (
                      <div 
                        key={stamp.id} 
                        className={`p-3.5 border rounded-2xl flex flex-col items-center justify-between transition-all ${
                          stamp.condition 
                            ? "border-violet-100/80 bg-violet-50/15 shadow-xs" 
                            : "border-slate-100 grayscale bg-slate-50/30 opacity-40 hover:opacity-55"
                        }`}
                        title={stamp.desc}
                      >
                        <div className="relative">
                          <span className="text-3xl">{stamp.icon}</span>
                          {stamp.condition && (
                            <span className="absolute bottom-[-2px] right-[-2px] bg-emerald-500 border-2 border-white text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-extrabold shadow-sm">✓</span>
                          )}
                        </div>
                        <div className="mt-2.5">
                          <h6 className="font-bold text-[11px] leading-tight text-slate-800">{stamp.title}</h6>
                          <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{stamp.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Loja de Recompensas das Tarefas (Interactive spend coupon system) */}
                <div className="border border-slate-100 bg-white p-5 rounded-3xl flex flex-col gap-4" id="points-shop-box">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-pink-500" />
                        <span>Loja de Recompensas de NósDois</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">Gastem seus pontos do lar por vales e mimos especiais no dia-a-dia!</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddReward(!showAddReward)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        {showAddReward ? "✕ Fechar" : "🎁 Cadastrar Recompensa"}
                      </button>
                      <div className="bg-amber-100 text-amber-900 px-3 py-1.5 rounded-2xl text-xs font-semibold shrink-0 font-mono flex items-center gap-1 shadow-3xs">
                        <span>💰 Balanço do Casal:</span>
                        <strong>{couple.total_points} EXP</strong>
                      </div>
                    </div>
                  </div>

                  {/* Add customized reward coupon form */}
                  {showAddReward && (
                    <div className="bg-slate-50 border border-amber-200/60 p-4 rounded-2xl flex flex-col gap-3 text-xs animate-slide-up" id="form-cadastrar-recompensa">
                      <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wide flex items-center gap-1">✨ Cadastrar Novo Mimo Conjugal</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Nome do Mimo / Cupom:</label>
                          <input
                            type="text"
                            placeholder="Ex: Massagem Premium"
                            value={newRewardTitle}
                            onChange={(e) => setNewRewardTitle(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl w-full text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Custo de Resgate (EXP):</label>
                          <input
                            type="number"
                            placeholder="Ex: 50"
                            value={newRewardCost}
                            onChange={(e) => setNewRewardCost(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl w-full text-xs mt-1 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-3">
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">O que o parceiro deve fazer (Descrição):</label>
                          <input
                            type="text"
                            placeholder="Ex: Mozão prepara ou compra o doce ou bolo que pedir."
                            value={newRewardDesc}
                            onChange={(e) => setNewRewardDesc(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl w-full text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Emoji Ilustrativo:</label>
                          <input
                            type="text"
                            placeholder="Ex: 🍕"
                            value={newRewardEmoji}
                            onChange={(e) => setNewRewardEmoji(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl w-full text-xs mt-1 text-center"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!newRewardTitle || !newRewardCost) {
                              triggerCustomNotify("Preencha o título e o custo da recompensa!", "error");
                              return;
                            }
                            handleAction("/api/rewards/create", {
                              title: newRewardTitle,
                              cost: newRewardCost,
                              desc: newRewardDesc,
                              emoji: newRewardEmoji
                            });
                            triggerCustomNotify(`Novo Mimo "${newRewardTitle}" cadastrado!`, "success");
                            setNewRewardTitle("");
                            setNewRewardCost("");
                            setNewRewardDesc("");
                            setNewRewardEmoji("🎁");
                            setShowAddReward(false);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer text-xs"
                        >
                          + Confirmar e Ativar Mimo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of custom award coupons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="rewards-grid">
                    {(rewards || []).map((reward, idx) => {
                      const colors = [
                        "border-emerald-100 bg-emerald-50/10 hover:bg-emerald-50/20 text-emerald-950",
                        "border-amber-100 bg-amber-50/10 hover:bg-amber-50/20 text-amber-950",
                        "border-indigo-100 bg-indigo-50/10 hover:bg-indigo-50/20 text-indigo-950",
                        "border-pink-100 bg-pink-50/10 hover:bg-pink-50/20 text-pink-950",
                        "border-purple-100 bg-purple-50/10 hover:bg-purple-50/20 text-purple-950",
                        "border-rose-100 bg-rose-50/10 hover:bg-rose-50/20 text-rose-950"
                      ];
                      const styleClass = colors[idx % colors.length];

                      return (
                        <div 
                          key={reward.id} 
                          className={`border p-4 rounded-2xl flex flex-col justify-between gap-3 text-xs ${styleClass} transition hover:shadow-2xs relative`}
                        >
                          <div className="flex gap-3 justify-between items-start">
                            <div className="pr-4">
                              <div className="flex items-center gap-1.5 font-bold mb-1">
                                <span className="text-sm">{reward.emoji || "🎁"}</span>
                                <span className="line-clamp-1">{reward.title}</span>
                              </div>
                              <p className="text-[10px] text-slate-550 leading-relaxed font-sans">{reward.desc}</p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="font-bold text-[10px] bg-white/80 px-2 py-0.5 rounded-full font-mono shadow-3xs">
                                {reward.cost} XP
                              </span>
                              
                              {/* Option to delete newly added custom rewards */}
                              {!["feet_massage", "breakfast_bed", "movie_choice", "no_dishes", "dream_dess", "full_massage"].includes(reward.id) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerCustomConfirm("Deseja mesmo remover esta recompensa?", () => handleAction("/api/rewards/delete", { id: reward.id }));
                                  }}
                                  className="text-slate-300 hover:text-red-500 p-0.5 transition"
                                  title="Remover Mimo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (couple.total_points < reward.cost) {
                                triggerCustomNotify(`Pontos insuficientes! Precisam de mais ${reward.cost - couple.total_points} XP.`, "error");
                                return;
                              }

                              triggerCustomConfirm(`Resgatar "${reward.title}" por ${reward.cost} EXP?`, () => handleAction("/api/couple/redeem-reward", {
                                reward_title: reward.title,
                                cost: reward.cost,
                                user_id: currentUser
                              }));
                            }}
                            className="w-full bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold py-1.5 rounded-xl transition shadow-3xs cursor-pointer"
                          >
                            Resgatar Cupom de Moedas
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* History of Redeemed Vales/Coupons */}
                <div className="border border-slate-100 bg-slate-50/50 p-4.5 rounded-3xl flex flex-col gap-3" id="redeem-log-container">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Caderno de Resgates do NósDois</span>
                  </h4>

                  {(() => {
                    const parsedRedeemed = (couple.unlocked_achievements || [])
                      .filter(a => a.startsWith("redeemed:"))
                      .map(a => {
                        const parts = a.split(":");
                        return {
                          title: parts[1] || "Cupom Geral",
                          user_id: parts[2] || "Membro",
                          date: parts[3] ? new Date(parts[3]).toLocaleDateString("pt-BR") : "Recentemente"
                        };
                      })
                      .reverse(); // Standard reverse to show newest first!

                    if (parsedRedeemed.length === 0) {
                      return (
                        <div className="py-6 text-center text-[10px] text-slate-400 bg-white border border-slate-100 rounded-2xl italic">
                          Nenhum cupom do amor resgatado ainda. Juntem pontos para habilitar! Outra opção é marcar tarefas como Concluídas para ganhar EXP.
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                        {parsedRedeemed.map((it, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white border border-slate-100/80 p-2.5 rounded-xl text-[11px] flex items-center justify-between hover:border-slate-200 transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-500 font-bold">✔</span>
                              <span className="text-slate-800">
                                <strong>{it.user_id}</strong> resgatou: <strong>"{it.title}"</strong>
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">{it.date}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

            {/* SUB-VIEW 2: MEMORIES & ÁLBUM */}
            {moreSubTab === "memories" && (
              <div className="flex flex-col gap-4" id="subview-memories">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base font-display">Baú de Memórias</h3>
                    <p className="text-xs text-slate-500">Momentos guardados a sete chaves pelo casal.</p>
                  </div>
                  <button
                    onClick={() => setMemoryModalOpen(true)}
                    className="bg-gradient-to-r from-violet-500 to-pink-500 text-white p-2 py-1 rounded-lg text-xs font-bold hover:shadow transition"
                    id="btn-add-memory"
                  >
                    + Enviar Foto
                  </button>
                </div>

                {/* Special Random Memory of the day (Rule 8.1 - Memória do dia ao abrir) */}
                {memories.length > 0 && (() => {
                  const dayIndex = Math.abs(Math.floor(Math.sin(new Date().getDate()) * memories.length)) % memories.length;
                  const dailyMemory = memories[dayIndex];
                  if (!dailyMemory) return null;
                  return (
                    <div className="border border-pink-100 rounded-3xl overflow-hidden bg-rose-50/20" id="memory-day-special">
                      <img 
                        src={dailyMemory.url}
                        alt="Nossa memória especial" 
                        className="w-full h-44 object-cover"
                      />
                      <div className="p-4 text-xs">
                        <span className="bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest text-[9px]">
                          💝 Lembrança de Aniversário de Relacionamento
                        </span>
                        <p className="font-semibold text-slate-850 mt-2 font-display">
                          "{dailyMemory.description}"
                        </p>
                        <p className="text-slate-400 mt-1 flex items-center gap-1 text-[10px]">
                          <MapPin className="w-3.5 h-3.5" /> 
                          {dailyMemory.location || "Em casa"} • {dailyMemory.date}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Album Row list */}
                <div className="grid grid-cols-2 gap-3" id="album-grid">
                  {memories.map(mem => (
                    <div key={mem.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs flex flex-col justify-between relative group">
                      <div className="relative">
                        <img src={mem.url} alt={mem.description} className="w-full h-28 object-cover" />
                        <div className="absolute top-1.5 right-1.5 flex gap-1">
                          <button
                            onClick={() => setEditingMemory(mem)}
                            className="bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-[10px] text-slate-700 hover:text-blue-600 hover:bg-white shadow-xs transition"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => triggerCustomConfirm("Tem certeza que deseja remover esta lembrança do álbum do casal?", () => handleAction("/api/memories/delete", { id: mem.id }))}
                            className="bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-[10px] text-slate-700 hover:text-red-500 hover:bg-white shadow-xs transition"
                            title="Excluir"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                      <div className="p-2 text-xs">
                        <p className="text-slate-500 text-[10px] font-mono">{mem.date}</p>
                        <p className="font-medium text-slate-800 line-clamp-2 mt-0.5">"{mem.description}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: INSIGHTS & EMOTIONAL CHECKIN TRENDS */}
            {moreSubTab === "mood" && (
              <div className="flex flex-col gap-4" id="subview-moods">
                <div>
                  <h3 className="font-bold text-slate-800 text-base font-display">Humor e Insights Emocionais</h3>
                  <p className="text-xs text-slate-500">Mantenham o termômetro do lar saudável.</p>
                </div>

                {/* SVG Mood Chart Panel */}
                <div className="border border-slate-100 bg-white p-4 rounded-2xl flex flex-col gap-3" id="emotional-insights-panel">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Smile className="w-4 h-4 text-pink-500" /> Histórico Semanal de Sintonia
                  </h4>
                  {(() => {
                    const moodScore = (m: MoodType) => m === MoodType.OTIMO ? 5 : m === MoodType.BEM ? 4 : m === MoodType.CANSADO ? 2 : m === MoodType.ANSIOSO ? 2 : 1;
                    const moodEmoji = (m: MoodType) => m === MoodType.OTIMO ? "😍" : m === MoodType.BEM ? "😊" : m === MoodType.CANSADO ? "😴" : m === MoodType.ANSIOSO ? "😰" : "😔";
                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      return d.toISOString().split("T")[0];
                    });
                    const chartW = 300;
                    const chartH = 80;
                    const barW = chartW / 7;
                    const userColor1 = users[firstUserId]?.color || "#3B82F6";
                    const userColor2 = users[secondUserId]?.color || "#EC4899";

                    return (
                      <div className="overflow-x-auto">
                        <svg width={chartW} height={chartH + 40} viewBox={`0 0 ${chartW} ${chartH + 40}`} className="w-full max-w-xs mx-auto">
                          {last7Days.map((day, i) => {
                            const u1mood = moods.filter(m => m.user_id === firstUserId && m.date === day).slice(-1)[0];
                            const u2mood = moods.filter(m => m.user_id === secondUserId && m.date === day).slice(-1)[0];
                            const x = i * barW;
                            const s1 = u1mood ? moodScore(u1mood.mood) : 0;
                            const s2 = u2mood ? moodScore(u2mood.mood) : 0;
                            const h1 = (s1 / 5) * chartH;
                            const h2 = (s2 / 5) * chartH;
                            const bw = barW * 0.35;
                            const dayLabel = new Date(day + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
                            return (
                              <g key={day}>
                                {s1 > 0 && <rect x={x + 2} y={chartH - h1} width={bw} height={h1} rx={3} fill={userColor1} opacity={0.8}>
                                  <title>{users[firstUserId]?.name}: {u1mood?.mood} {moodEmoji(u1mood!.mood)}</title>
                                </rect>}
                                {s2 > 0 && <rect x={x + bw + 4} y={chartH - h2} width={bw} height={h2} rx={3} fill={userColor2} opacity={0.8}>
                                  <title>{users[secondUserId]?.name}: {u2mood?.mood} {moodEmoji(u2mood!.mood)}</title>
                                </rect>}
                                <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="sans-serif">{dayLabel}</text>
                              </g>
                            );
                          })}
                          <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#e2e8f0" strokeWidth={1} />
                        </svg>
                        <div className="flex items-center justify-center gap-4 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: userColor1 }} />
                            {users[firstUserId]?.name || firstUserId}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: userColor2 }} />
                            {users[secondUserId]?.name || secondUserId}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3 max-h-[140px] overflow-y-auto">
                          {moods.slice(-5).reverse().map(mood => (
                            <div key={mood.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                              <div className="flex items-center gap-1.5">
                                <span>{moodEmoji(mood.mood)}</span>
                                <span className="font-semibold text-slate-700">{users[mood.user_id]?.name || mood.user_id}</span>
                                <span className="text-slate-400 text-[9px] font-mono">{mood.date}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">{mood.mood}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Submitting formal check-in form explicitly */}
                <div className="border border-pink-100 bg-rose-50/20 p-4 rounded-2xl flex flex-col gap-3" id="mood-manual-checkin">
                  <h4 className="text-xs font-bold text-pink-950 uppercase tracking-wide">
                    🎯 Registrar Check-In Detalhado de Hoje
                  </h4>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase font-bold block mb-1">Como você está?</label>
                    <select 
                      value={myMood}
                      onChange={(e) => setMyMood(e.target.value as MoodType)}
                      className="w-full bg-white text-xs border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-pink-400"
                    >
                      <option value={MoodType.OTIMO}>😍 Ótimo (Excelente energia, pronto para tudo)</option>
                      <option value={MoodType.BEM}>😊 Bem (Tranquilo e focado no dia a dia)</option>
                      <option value={MoodType.CANSADO}>😴 Cansado (Sobrecarga ou sono acumulado)</option>
                      <option value={MoodType.ANSIOSO}>😰 Ansioso (Mente acelerada com compromissos)</option>
                      <option value={MoodType.BAIXA}>😔 Na baixa (Sensível ou precisando de carinho)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 uppercase font-bold block mb-1">Nota Sensível / Desabafo (Max 100 char)</label>
                    <input
                      type="text"
                      maxLength={100}
                      placeholder="Ex: Faculdade cansativa hoje..."
                      value={myMoodNote}
                      onChange={(e) => setMyMoodNote(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-pink-400"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="share-note-check"
                      checked={myMoodShare}
                      onChange={(e) => setMyMoodShare(e.target.checked)}
                      className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor="share-note-check" className="text-xs text-slate-600">
                      Compartilhar esta desabafo com meu parceiro imediatamente
                    </label>
                  </div>

                  <button
                    onClick={() => {
                      handleAction("/api/moods/checkin", {
                        user_id: currentUser,
                        mood: myMood,
                        note: myMoodNote,
                        share_note: myMoodShare
                      });
                      triggerCustomNotify("Check-in emocional registrado!", "success");
                      setMyMoodNote("");
                    }}
                    className="bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-2 rounded-xl text-xs hover:opacity-95 transition"
                  >
                    Salvar Check-in Emocional
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: WISHLIST / COFRINHO */}
            {moreSubTab === "wishlist" && (
              <div className="flex flex-col gap-4" id="subview-wishlist">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base font-display">Lista de Desejos & Cofrinhos</h3>
                    <p className="text-xs text-slate-500">Planos de compras futuras em total união.</p>
                  </div>
                  <button
                    onClick={() => setWishlistModalOpen(true)}
                    className="bg-gradient-to-r from-violet-500 to-pink-500 text-white p-2 py-1 rounded-lg text-xs font-bold hover:shadow transition"
                    id="btn-add-wish"
                  >
                    + Novo Sonho
                  </button>
                </div>

                {/* Couple Saving goals targets */}
                <div className="flex flex-col gap-3" id="wishlist-scroller">
                  {wishlist.map(item => (
                    <div key={item.id} className="border border-slate-100 bg-white p-4 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            🏷️ {item.category}
                          </span>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-1 select-none">
                              {item.name}
                              {item.is_private_to_partner && currentUser !== item.added_by && (
                                <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-1.5 py-0.5 rounded animate-pulse-subtle">📦 Surpresa Oculta!</span>
                              )}
                            </h4>
                            <div className="flex gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => setEditingWishlist(item)}
                                className="text-[10px] hover:bg-slate-50 text-slate-400 hover:text-blue-500 p-1.5 rounded transition"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => triggerCustomConfirm("Deseja mesmo retirar este sonho da lista do casal?", () => handleAction("/api/wishlist/delete", { id: item.id }))}
                                className="text-[10px] hover:bg-slate-50 text-slate-400 hover:text-red-500 p-1.5 rounded transition"
                                title="Excluir"
                              >
                                ❌
                              </button>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          {item.estimated_price ? item.estimated_price.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'}) : "Sem preço"}
                        </span>
                      </div>

                      {/* Cofrinho de economia progress bar */}
                      {item.saving_goal !== undefined && (
                        <div className="mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Meta do Cofrinho NósDois:</span>
                            <span className="font-bold text-slate-705">
                              {item.saving_saved?.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})} / {item.saving_goal.toLocaleString("pt-BR", {style: 'currency', currency: 'BRL'})}
                            </span>
                          </div>
                          
                          {/* Progress bar container */}
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-violet-500 to-pink-500 h-2.5 rounded-full" 
                              style={{ width: `${Math.min(100, ((item.saving_saved ?? 0) / item.saving_goal) * 100)}%` }}
                            ></div>
                          </div>

                          {/* Contribute input action */}
                          <div className="flex gap-2 mt-3 justify-end items-center">
                            {savingsInputId === item.id ? (
                              <>
                                <input
                                  type="number"
                                  placeholder="R$ valor"
                                  value={savingsAmount}
                                  onChange={e => setSavingsAmount(e.target.value)}
                                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-24"
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    if (savingsAmount && !isNaN(parseFloat(savingsAmount))) {
                                      handleAction("/api/wishlist/save", { id: item.id, amount: savingsAmount });
                                      triggerCustomNotify("Valor adicionado ao cofrinho!", "success");
                                    }
                                    setSavingsInputId(null);
                                    setSavingsAmount("");
                                  }}
                                  className="bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-violet-700 transition"
                                >OK</button>
                                <button onClick={() => { setSavingsInputId(null); setSavingsAmount(""); }} className="text-slate-400 text-[10px]">✕</button>
                              </>
                            ) : (
                              <button
                                onClick={() => setSavingsInputId(item.id)}
                                className="bg-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg hover:bg-violet-700 transition"
                              >
                                Poupar juntinho
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-VIEW 5: RECIPES & WEEKLY MENU SLOTS */}
            {moreSubTab === "recipes" && (
              <div className="flex flex-col gap-4" id="subview-recipes">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base font-display">Banco de Receitas do Lar</h3>
                    <p className="text-xs text-slate-500">Decidam o cardápio sem discussões chatas.</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setRecipeImportModalOpen(true)}
                      className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
                    >
                      🔗 Importar URL
                    </button>
                    <button
                      onClick={() => setRecipeModalOpen(true)}
                      className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:shadow transition"
                    >
                      + Nova Receita
                    </button>
                  </div>
                </div>

                {/* Weekly Meal Slots schedule (Rule 11.2 - Grade de 7 dias) */}
                <div className="border border-violet-100 p-4 rounded-2xl bg-violet-50/10">
                  <h4 className="text-xs font-bold text-violet-950 uppercase tracking-widest mb-3">📅 Planejamento Alimentar Semanal</h4>
                  <div className="flex flex-col gap-3">
                    {["Segunda", "Quarta", "Sexta"].map(day => (
                      <div key={day} className="bg-white p-3 rounded-xl border border-slate-50 text-xs">
                        <strong className="text-violet-900 block mb-2">{day}-feira</strong>
                        <div className="grid grid-cols-2 gap-2">
                          {["Almoço", "Jantar"].map(meal => {
                            const slot = mealPlan.find(m => m.day === day && m.meal_type === meal);
                            const associatedRecipe = recipes.find(r => r.id === slot?.recipe_id);
                            return (
                              <div key={meal} className="bg-slate-50 p-2 rounded-lg flex flex-col justify-between min-h-[50px]">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{meal}</span>
                                <p className="text-slate-800 font-medium my-1">
                                  {associatedRecipe ? associatedRecipe.title : slot?.custom_text || "Menu em aberto..."}
                                </p>
                                {editingMealPlanSlot?.day === day && editingMealPlanSlot?.meal === meal ? (
                                <div className="flex gap-1 items-center mt-1">
                                  <input
                                    type="text"
                                    placeholder="Receita ou texto..."
                                    value={editingMealText}
                                    onChange={e => setEditingMealText(e.target.value)}
                                    className="border border-slate-200 rounded-lg px-1.5 py-0.5 text-[9px] flex-1 min-w-0"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      const actionText = editingMealText.trim();
                                      if (actionText) {
                                        const foundRecIdx = recipes.find(rc => rc.title.toLowerCase().includes(actionText.toLowerCase()));
                                        handleAction("/api/mealplan/update", {
                                          day,
                                          meal_type: meal,
                                          recipe_id: foundRecIdx ? foundRecIdx.id : undefined,
                                          custom_text: foundRecIdx ? undefined : actionText
                                        });
                                      }
                                      setEditingMealPlanSlot(null);
                                      setEditingMealText("");
                                    }}
                                    className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded font-bold"
                                  >OK</button>
                                  <button onClick={() => { setEditingMealPlanSlot(null); setEditingMealText(""); }} className="text-[9px] text-slate-400">✕</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingMealPlanSlot({ day, meal });
                                    setEditingMealText(associatedRecipe?.title || slot?.custom_text || "");
                                  }}
                                  className="text-[9px] text-violet-500 font-bold text-left hover:underline"
                                >
                                  {associatedRecipe || slot?.custom_text ? "Editar" : "+ Agendar"}
                                </button>
                              )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Favorite recipes catalog cards */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nossas Delícias Favoritas</h4>
                  {recipes.map(recipe => (
                    <div key={recipe.id} className="border border-slate-100 bg-white p-4 rounded-2xl flex flex-col gap-3 relative">
                      <div className="flex gap-3 relative">
                        <img src={recipe.photo_url || "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&q=80&w=200"} alt="" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1 text-xs pr-14 select-none">
                          <h4 className="font-bold text-slate-800 text-sm">{recipe.title}</h4>
                          <p className="text-slate-400 font-medium text-[10px] mt-0.5">⏱️ {recipe.duration}m • 🍽️ {recipe.portions} porções</p>
                          <div className="flex gap-1 mt-1.5 text-[9px] font-bold text-slate-500">
                            {(recipe.tags || []).map(tag => (
                              <span key={tag} className="bg-slate-150 px-1.5 py-0.5 rounded">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 flex gap-1.5">
                          <button
                            onClick={() => setEditingRecipe(recipe)}
                            className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg text-xs"
                            title="Editar Receita"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => triggerCustomConfirm("Tem certeza que deseja de fato excluir esta receita?", () => handleAction("/api/recipes/delete", { id: recipe.id }))}
                            className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg text-xs"
                            title="Excluir Receita"
                          >
                            ❌
                          </button>
                        </div>
                      </div>

                      {/* Couple Rating & auto generation of shopping groceries from recipe ingreds (Rule 11.2 - Botão Gerar Lista) */}
                      <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>Avaliação:</span>
                          <span className="font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                            {recipe.couple_rating || "Não avaliado ainda"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            handleAction("/api/recipes/generate-shopping", { recipe_id: recipe.id, user_id: currentUser });
                            triggerCustomNotify("Ingredientes adicionados à sua lista de compras!");
                          }}
                          className="text-white bg-violet-600 hover:bg-violet-700 px-3 py-1 rounded-lg font-bold"
                        >
                          🛒 Adicionar Ingredientes à Compras
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-VIEW 6: SETTINGS / PERFIL */}
            {moreSubTab === "settings" && (
              <div className="flex flex-col gap-4" id="subview-settings">
                <div>
                  <h3 className="font-bold text-slate-800 text-base font-display">Nossos Perfis Conjugais</h3>
                  <p className="text-xs text-slate-500">Gerenciem nicknames internos e sincronização</p>
                </div>

                <div className="border border-slate-100 bg-white p-4 rounded-2xl flex flex-col gap-4 text-xs" id="profiles-box">
                  <div className="flex items-center gap-3">
                    <img src={userObj.avatar_url} alt="" className="w-12 h-12 rounded-full ring-2 ring-violet-500 object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{userObj.name}</h4>
                      <p className="text-slate-500 mt-0.5">Fuso-Horário: {userObj.timezone} • Pontos Acumulados esta semana: {userObj.points_weekly}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
                    {(() => {
                      const currentAvatarUrl = profileAvatarLocal !== null ? profileAvatarLocal : (userObj?.avatar_url || "");
                      const currentName = profileNameLocal !== null ? profileNameLocal : (userObj?.name || "");
                      const currentPartnerNickname = profileNicknameLocal !== null ? profileNicknameLocal : (userObj?.partner_nickname || "");

                      return (
                        <>
                          <div>
                            <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                              Minha Foto de Perfil:
                            </label>
                            
                            {/* Drag & Drop or Manual Selection Zone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 text-slate-705">
                              <div 
                                className="border-2 border-dashed border-slate-200 hover:border-violet-400 bg-slate-50/40 p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition relative group min-h-[110px]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const files = e.dataTransfer.files;
                                  if (files && files[0]) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const base64Str = event.target?.result as string;
                                      setProfileAvatarLocal(base64Str);
                                    };
                                    reader.readAsDataURL(files[0]);
                                  }
                                }}
                              >
                                <input 
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files[0]) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const base64Str = event.target?.result as string;
                                        setProfileAvatarLocal(base64Str);
                                      };
                                      reader.readAsDataURL(files[0]);
                                    }
                                  }}
                                />
                                <span className="text-xl group-hover:scale-115 transition duration-200 select-none">📸</span>
                                <p className="text-[11.5px] font-bold text-slate-700 mt-1">Clique para selecionar</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">Ou arraste e solte o arquivo aqui</p>
                              </div>

                              <div className="flex flex-col justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">Ou cole uma URL direta da Internet:</span>
                                  <input
                                    type="text"
                                    value={currentAvatarUrl}
                                    placeholder="https://exemplo.com/foto.jpg"
                                    onChange={(e) => setProfileAvatarLocal(e.target.value)}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono"
                                  />
                                </div>
                                
                                <div className="mt-1">
                                  <p className="text-[9px] text-slate-400 font-semibold mb-1">Sugestões rápidas:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      { name: "Tec 🧑‍💻", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" },
                                      { name: "Sorriso 👩‍🦰", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200" },
                                      { name: "Gatinho 🐈", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200" },
                                      { name: "Anime ✨", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" }
                                    ].map((item, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        onClick={() => setProfileAvatarLocal(item.url)}
                                        className={`text-[9.5px] border px-2 py-0.5 bg-white text-slate-600 rounded transition ${currentAvatarUrl === item.url ? "border-violet-500 bg-violet-50 text-violet-700 font-bold" : "border-slate-200 hover:bg-slate-50"}`}
                                      >
                                        {item.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">Meu Nome próprio (como apareço no app):</label>
                            <input
                              type="text"
                              value={currentName}
                              onChange={(e) => setProfileNameLocal(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-800"
                              placeholder="Seu nome"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">Apelido carinhoso que dou para meu parceiro:</label>
                            <input
                              type="text"
                              value={currentPartnerNickname}
                              onChange={(e) => setProfileNicknameLocal(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-800"
                              placeholder="Ex: Mozão, Princesa, Gatinho..."
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">Minha Cor Personalizada para Tarefas:</label>
                            <div className="flex gap-2 mt-1">
                              {["#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"].map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    handleAction("/api/profile/update", {
                                      user_id: currentUser,
                                      color: c
                                    });
                                  }}
                                  className="w-8 h-8 rounded-full border transition hover:scale-105 relative flex items-center justify-center cursor-pointer"
                                  style={{ backgroundColor: c }}
                                >
                                  {userObj.color === c && (
                                    <span className="w-2.5 h-2.5 bg-white rounded-full shadow-inner"></span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end border-t border-slate-100 pt-3 mt-1">
                            {(profileAvatarLocal !== null || profileNicknameLocal !== null || profileNameLocal !== null) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProfileAvatarLocal(null);
                                  setProfileNicknameLocal(null);
                                  setProfileNameLocal(null);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer"
                              >
                                Descartar Alterações
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                handleAction("/api/profile/update", {
                                  user_id: currentUser,
                                  name: currentName,
                                  avatar_url: currentAvatarUrl,
                                  partner_nickname: currentPartnerNickname
                                });
                                triggerCustomNotify("Perfil atualizado e sincronizado!", "success");
                                setProfileAvatarLocal(null);
                                setProfileNicknameLocal(null);
                                setProfileNameLocal(null);
                              }}
                              className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-xs select-none shadow-3xs flex items-center gap-1 cursor-pointer"
                            >
                              Salvar Alterações do Meu Perfil 💾
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Night Mode Theme Switch */}
                <div className="border border-violet-100 bg-violet-50/10 p-4 rounded-2xl flex flex-col gap-2 mb-3" id="theme-setting">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                        🌙 Modo Noturno / Escuro
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                        Fazer o aplicativo ficar escuro para proteger os olhos do casal durante a noite.
                      </p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${darkMode ? 'bg-violet-600' : 'bg-slate-300'}`}
                      type="button"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${darkMode ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center text-[10px]`}
                      >
                        {darkMode ? '🌙' : '☀️'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sign Out Button utility */}
                <div className="border border-slate-200 bg-slate-50 p-4 rounded-2xl flex flex-col gap-1.5 mb-3" id="sign-out-setting">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                     Sair do Lar NósDois
                  </h4>
                  <p className="text-[11px] text-slate-500">
                     Desconecte a sessão do dispositivo atual. Você precisará de seu e-mail e senha para entrar novamente.
                  </p>
                  <button
                    onClick={() => {
                      triggerCustomConfirm("Deseja desconectar de seu lar em NósDois?", () => {
                        localStorage.removeItem("nosdois_userId");
                        localStorage.removeItem("nosdois_coupleId");
                        localStorage.removeItem("nosdois_email");
                        window.location.reload();
                      });
                    }}
                    className="mt-1.5 self-start bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition select-none"
                  >
                    Sair do Aplicativo 🔒
                  </button>
                </div>

                {/* Danger Zone: EXCLUIR CONTA */}
                <div className="border border-red-200 bg-red-50/20 p-4 rounded-2xl flex flex-col gap-2 mb-3">
                  <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                    🚨 Zona de Perigo: Excluir Nosso Lar
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Isso excluirá permanentemente o login de ambos os parceiros, fotos, lembranças, tarefas e todas as informações sincronizadas desta conta. Essa ação NÃO pode ser desfeita.
                  </p>
                  <button
                    onClick={async () => {
                      const cId = localStorage.getItem("nosdois_coupleId");
                      if (cId === "couple_1") {
                        triggerCustomNotify("Por segurança, não é permitido excluir o lar de demonstração.", "error");
                        return;
                      }

                      triggerCustomConfirm("Tem certeza? Todos os dados do casal serão perdidos permanentemente e esta ação não pode ser desfeita.", async () => {
                        try {
                          const uId = localStorage.getItem("nosdois_userId");
                          const response = await fetch("/api/auth/delete-account", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "x-couple-id": cId || "",
                              "x-user-id": uId || ""
                            },
                            body: JSON.stringify({ coupleId: cId })
                          });

                          if (response.ok) {
                            localStorage.removeItem("nosdois_userId");
                            localStorage.removeItem("nosdois_coupleId");
                            localStorage.removeItem("nosdois_email");
                            window.location.reload();
                          } else {
                            const data = await response.json();
                            triggerCustomNotify(data.error || "Erro ao excluir contas.", "error");
                          }
                        } catch (err) {
                          console.error("Erro deletando conta:", err);
                          triggerCustomNotify("Erro ao se conectar com o servidor.", "error");
                        }
                      });
                    }}
                    className="mt-1.5 self-start bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    Excluir Nosso Lar e Ambos os Perfis 🗑️
                  </button>
                </div>

                {/* Reset Database Button utility */}
                <div className="border border-red-100 bg-red-50/20 p-4 rounded-2xl flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" /> Zona de Arquitetura e Testes
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Se você perdeu algum dado de teste nas simulações ou quer reinicializar os pontos gamificados dos parceiros, clique abaixo:
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-1.5 self-start bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-xl text-[11px] flex items-center gap-1 transition"
                    id="btn-hard-reset-db"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Simulação (Seed Original)
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 7: PETS */}
            {moreSubTab === "pets" && (
              <PetsTab
                pets={pets}
                inventory={inventory}
                currentUser={currentUser}
                partnerUser={partnerObj}
                coupleId={coupleId || undefined}
                triggerCustomNotify={triggerCustomNotify}
                triggerCustomConfirm={triggerCustomConfirm}
                onRefresh={loadState}
              />
            )}

            {/* SUB-VIEW 8: HOUSE */}
            {moreSubTab === "house" && (
              <HouseTab
                triggerCustomNotify={triggerCustomNotify}
                triggerCustomConfirm={triggerCustomConfirm}
              />
            )}

          </div>
        )}

            </React.Fragment>
          )}
      </main>
    </div>

      {/* ==============================================
          MODAL SLIDE-IN POPUP SHEETS (Rule 21.3 - Bottom sheets para formulários)
          ============================================== */}
          
      {/* 0. Finalize Shopping List Modal */}
      {finalizeModalOpen && (() => {
        const formatMonthId = (ym: string) => {
          const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
          const parts = ym.split("-");
          const y = parts[0];
          const m = parseInt(parts[1], 10);
          if (isNaN(m) || m < 1 || m > 12) return ym;
          return `${months[m - 1]} / ${y}`;
        };

        const filteredShopping = shopping.filter(
          i => i.monthId === selectedMonthId || (!i.monthId && selectedMonthId === "2026-05")
        );

        const checkedTotal = filteredShopping
          .filter(i => i.is_bought)
          .reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0);

        const totalItemsCount = filteredShopping.length;
        const boughtItemsCount = filteredShopping.filter(i => i.is_bought).length;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-finalize-shopping">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 font-display">
                  <span>✅</span> Finalizar Lista de {formatMonthId(selectedMonthId)}
                </h3>
                <button onClick={() => setFinalizeModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                  ✕
                </button>
              </div>

              <div className="bg-violet-50/50 rounded-2xl p-4 border border-violet-100 text-xs text-slate-700 flex flex-col gap-1.5 leading-normal">
                <p className="font-bold">📊 Resumo do Faturamento:</p>
                <div className="grid grid-cols-2 gap-2 mt-1 font-semibold text-slate-800">
                  <span>Itens Marcados:</span>
                  <span>{boughtItemsCount} de {totalItemsCount}</span>
                  <span>Valor Calculado:</span>
                  <span className="text-violet-600">
                    {checkedTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Payment Method */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Meio de Pagamento</label>
                  <div className="grid grid-cols-3 gap-1.5 animate-fade-in">
                    {["VR", "Débito", "Crédito", "PIX", "Dinheiro"].map(method => (
                      <button
                        key={method}
                        onClick={() => setFinalizePaymentMethod(method)}
                        type="button"
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          finalizePaymentMethod === method 
                            ? "bg-violet-600 text-white border-violet-600" 
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Price */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Valor Final Pago (R$)</label>
                  <input
                    type="number"
                    value={finalizeTotalSpent}
                    onChange={(e) => setFinalizeTotalSpent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Ex: 350.00"
                  />
                  <p className="text-[9.5px] text-slate-400 mt-1">Preenchido com estimativa, alterne livremente se quiser.</p>
                </div>

                {/* Quem Pagou */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Quem Pagou?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Leandro", "Kaisa"].map(person => (
                      <button
                        key={person}
                        onClick={() => setFinalizePaidBy(person)}
                        type="button"
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          finalizePaidBy === person 
                            ? "bg-indigo-600 text-white border-indigo-600" 
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {users[person]?.name || person}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Carry Over Pending Items */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="carry-over"
                    checked={finalizeCarryOver}
                    onChange={(e) => setFinalizeCarryOver(e.target.checked)}
                    className="mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="carry-over" className="text-xs text-slate-600 leading-normal select-none cursor-pointer">
                    <strong>Migrar pendentes:</strong> Transferir todos os itens não comprados para a lista de compras do mês seguinte automaticamente.
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const priceValue = parseFloat(finalizeTotalSpent) || checkedTotal;
                    const response = await appFetch("/api/shopping/finalize", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        monthId: selectedMonthId,
                        paymentMethod: finalizePaymentMethod,
                        totalSpent: priceValue,
                        paid_by_id: finalizePaidBy,
                        carryOver: finalizeCarryOver
                      })
                    });
                    const result = await response.json();
                    if (result.success) {
                      setFinalizeModalOpen(false);
                      await loadState();
                      triggerCustomNotify("Lista finalizada! Despesa inserida nas finanças.", "success");
                    } else {
                      triggerCustomNotify(result.error || "Ocorreu um erro ao finalizar.", "error");
                    }
                  } catch (err) {
                    console.error("Erro ao finalizar:", err);
                    triggerCustomNotify("Erro de conexão.", "error");
                  }
                }}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs transition shadow-md"
              >
                Confirmar & Lançar nas Finanças 🚀
              </button>
            </div>
          </div>
        );
      })()}

      {/* 1. Add Task Bottom Sheet */}
      {taskModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">🎉 Criar Nova Tarefa Gamificada</h3>
              <button onClick={() => setTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Título da tarefa (Max 80 chars) *</label>
              <input
                type="text"
                maxLength={80}
                placeholder="Ex: Lavar a louça do almoço"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Descrição / Observações adicionais</label>
              <textarea
                placeholder="Ex: Secar louça e guardar panelas grandes..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Quem faz?</label>
                <select
                  value={newTaskResp}
                  onChange={(e) => setNewTaskResp(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="Ambos">Ambos</option>
                  <option value={firstUserId}>{users[firstUserId]?.name || firstUserId}</option>
                  <option value={secondUserId}>{users[secondUserId]?.name || secondUserId}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Categoria do Cômodo</label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={TaskCategory.COZINHA}>🍳 Cozinha</option>
                  <option value={TaskCategory.BANHEIRO}>🚿 Banheiro</option>
                  <option value={TaskCategory.SALA}>🛋️ Sala de Estar</option>
                  <option value={TaskCategory.QUARTO}>🛏️ Quarto</option>
                  <option value={TaskCategory.PET}>🐶 Luke (Pet)</option>
                  <option value={TaskCategory.OUTRO}>💡 Outro...</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Prazo Máximo</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Gravidade / Urgência</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={TaskPriority.BAIXA}>🟢 Baixa (10 pontos)</option>
                  <option value={TaskPriority.NORMAL}>🔵 Normal (10 pontos + bônus de prazo)</option>
                  <option value={TaskPriority.URGENTE}>🔴 Urgente (25 pontos por urgência)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Recorrência Automática</label>
                <select
                  value={newTaskRecurrence}
                  onChange={(e) => setNewTaskRecurrence(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="Nenhuma">Nenhuma</option>
                  <option value="Diária">Repete Todo Dia</option>
                  <option value="Semanal">Repete Toda Semana</option>
                  <option value="Quinzenal">Repete a cada 15 dias</option>
                  <option value="Mensal">Repete Todo Mês</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Tempo Estimado (minutos)</label>
                <input
                  type="number"
                  placeholder="Ex: 20"
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!newTaskTitle) {
                  triggerCustomNotify("Insira pelo menos um título para a tarefa!", "error");
                  return;
                }
                handleAction("/api/tasks/create", {
                  title: newTaskTitle,
                  description: newTaskDesc,
                  responsible_id: newTaskResp,
                  category: newTaskCategory,
                  priority: newTaskPriority,
                  due_date: newTaskDueDate,
                  recurrence: newTaskRecurrence,
                  time_estimate: newTaskEstimate
                });
                setTaskModalOpen(false);
                setNewTaskTitle("");
                setNewTaskDesc("");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
              id="btn-confirm-add-task"
            >
              Criar no Calendário NósDois
            </button>
          </div>
        </div>
      )}

      {/* 2. Add Event Bottom Sheet */}
      {eventModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up max-h-[85vh] overflow-y-auto w-full">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">📅 Criar Evento do Calendário</h3>
              <button onClick={() => setEventModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Título do Evento *</label>
              <input
                type="text"
                placeholder="Ex: Nosso Jantar Romântico"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Descrição Curta</label>
              <input
                type="text"
                placeholder="Ex: Aniversário de início de namoro..."
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Tipo de Evento</label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={EventType.COMPROMISSO}>Compromisso Geral ⏱️</option>
                  <option value={EventType.DATA_ESPECIAL}>Data Especial / Aniversários 💖</option>
                  <option value={EventType.VIAGEM}>Viagem (+ Checklist) ✈️</option>
                  <option value={EventType.SAIDA_JUNTOS}>Saída Juntos/Passeio 🗺️</option>
                  <option value={EventType.LEMBRETE}>Apenas Lembrete 🔔</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Quem participa?</label>
                <select
                  value={newEventResp}
                  onChange={(e) => setNewEventResp(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="Ambos">Os Dois</option>
                  <option value={firstUserId}>{users[firstUserId]?.name || firstUserId}</option>
                  <option value={secondUserId}>{users[secondUserId]?.name || secondUserId}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Data/Hora Inicial</label>
                <input
                  type="datetime-local"
                  value={newEventStartTime}
                  onChange={(e) => setNewEventStartTime(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50 font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Localização (Física ou Link)</label>
                <input
                  type="text"
                  placeholder="Ex: Campos do Jordão"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Link de Reserva/Ingresso</label>
              <input
                type="text"
                placeholder="Ex: https://booking.com/etc"
                value={newEventBooking}
                onChange={(e) => setNewEventBooking(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
              />
            </div>

            <button
              onClick={() => {
                if (!newEventTitle || !newEventStartTime) {
                  triggerCustomNotify("Título do evento e data de início são obrigatórios!", "error");
                  return;
                }
                handleAction("/api/events/create", {
                  title: newEventTitle,
                  description: newEventDesc,
                  type: newEventType,
                  start_time: newEventStartTime,
                  location: newEventLocation,
                  booking_link: newEventBooking,
                  responsible_id: newEventResp
                });
                setEventModalOpen(false);
                setNewEventTitle("");
                setNewEventDesc("");
                setNewEventStartTime("");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
              id="btn-confirm-add-event"
            >
              Agendar no Calendário
            </button>
          </div>
        </div>
      )}

      {/* 3. Add Shopping Item Sheet */}
      {shopModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">🛒 Adicionar Item à Compras</h3>
              <button onClick={() => setShopModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Nome do Item *</label>
              <input
                type="text"
                placeholder="Ex: Leite Integral"
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
              />
              {(() => {
                if (!newShopName || newShopName.trim().length < 2) return null;
                const normalizedInput = newShopName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                const wordsToCompare = ["leite", "pao", "arroz", "queijo", "cafe", "manteiga", "oleo", "macarrao", "carne", "frango", "sabao", "sabonete", "papel", "detergente", "creme"];
                
                const duplicateItem = shopping.find(item => {
                  const itemNorm = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  if (itemNorm === normalizedInput) return false;
                  
                  if (itemNorm.includes(normalizedInput) || normalizedInput.includes(itemNorm)) {
                    return true;
                  }
                  
                  for (const core of wordsToCompare) {
                    if (itemNorm.includes(core) && normalizedInput.includes(core)) {
                      return true;
                    }
                  }
                  return false;
                });

                if (duplicateItem) {
                  return (
                    <div className="bg-amber-50 border border-amber-200/60 text-amber-900 p-2.5 rounded-xl text-[10px] flex items-start gap-1.5 mt-2 animate-fade-in" id="smart-duplicates-warning">
                      <span>⚠️</span>
                      <p className="leading-relaxed">
                        <strong className="font-bold">Duplicidade Inteligente detectada:</strong> Já existe o item <strong className="underline">"{duplicateItem.name}" ({duplicateItem.quantity} {duplicateItem.unit})</strong> no carrinho. Tem certeza de que quer inserir um produto similar e ter custos redundantes?
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Quantidade</label>
                <input
                  type="number"
                  step="any"
                  value={newShopQty}
                  onChange={(e) => setNewShopQty(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50 text-center"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Unidade</label>
                <select
                  value={newShopUnit}
                  onChange={(e) => setNewShopUnit(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="unidades">Unidades</option>
                  <option value="kg">kg (Quilo)</option>
                  <option value="L">Litros (L)</option>
                  <option value="caixas">Caixas</option>
                  <option value="pacotes">Pacotes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Preço Estimado Unitário (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 5.50"
                  value={newShopPrice}
                  onChange={(e) => setNewShopPrice(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Categoria Automática</label>
                <select
                  value={newShopCategory}
                  onChange={(e) => setNewShopCategory(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="">Detecção Inteligente (Recomendado) 🧠</option>
                  <option value={ShoppingCategory.HORTIFRUTI}>🥦 Hortifrúti</option>
                  <option value={ShoppingCategory.LATICINIOS}>🥛 Laticínios</option>
                  <option value={ShoppingCategory.CARNES}>🥩 Carnes</option>
                  <option value={ShoppingCategory.LIMPEZA}>🧼 Limpeza</option>
                  <option value={ShoppingCategory.HIGIENE}>🧻 Higiene</option>
                  <option value={ShoppingCategory.OUTROS}>📦 Outros</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                if (!newShopName) {
                  triggerCustomNotify("Informe pelo menos um nome de ingrediente!", "error");
                  return;
                }
                handleAction("/api/shopping/create", {
                  name: newShopName,
                  quantity: newShopQty,
                  unit: newShopUnit,
                  price: newShopPrice,
                  category: newShopCategory || undefined,
                  added_by: currentUser,
                  monthId: selectedMonthId
                });
                setShopModalOpen(false);
                setNewShopName("");
                setNewShopQty("1");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
              id="btn-confirm-add-shopping"
            >
              Adicionar ao Carrinho Sincronizado
            </button>
          </div>
        </div>
      )}

      {/* 4. Add Expense Sheet */}
      {expenseModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">💵 Registrar Gasto do Lar</h3>
              <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Valor do Gasto *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                  <input
                    type="text"
                    placeholder="Ex: 350.00"
                    value={newExpenseValue}
                    onChange={(e) => setNewExpenseValue(e.target.value)}
                    className="w-full border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Descrição Curta *</label>
                <input
                  type="text"
                  placeholder="Ex: Supermercado Semanal"
                  value={newExpenseDesc}
                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Quem pagou?</label>
                <select
                  value={newExpensePaidBy}
                  onChange={(e) => setNewExpensePaidBy(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={firstUserId}>{users[firstUserId]?.name || firstUserId}</option>
                  <option value={secondUserId}>{users[secondUserId]?.name || secondUserId}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Método de Divisão</label>
                <select
                  value={newExpenseSplit}
                  onChange={(e) => setNewExpenseSplit(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="50/50">Meio a Meio (50%) 🧑‍🤝‍🧑</option>
                  <option value="paid_all">Eu pago tudo integral 🧑‍💻</option>
                  <option value="partner_all">Parceiro paga tudo integral 👩‍🦰</option>
                  <option value="custom">Percentual Customizado %</option>
                </select>
              </div>
            </div>

            {newExpenseSplit === "custom" && (
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Quantos por cento o {users.Leandro?.name || "Leandro"} arca (0-100)%</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newExpenseCustomPct}
                  onChange={(e) => setNewExpenseCustomPct(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 text-center font-bold"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Categoria de Custo</label>
                <select
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={ExpenseCategory.ALIMENTACAO}>🍔 Alimentação</option>
                  <option value={ExpenseCategory.MORADIA}>🏡 Moradia / Aluguel</option>
                  <option value={ExpenseCategory.LAZER}>🍿 Lazer / Cinema</option>
                  <option value={ExpenseCategory.SAUDE}>🩺 Saúde / Remédios</option>
                  <option value={ExpenseCategory.TRANSPORTE}>🚗 Transporte / Gasolina</option>
                  <option value={ExpenseCategory.PETS}>🐶 Luke (Pets)</option>
                  <option value={ExpenseCategory.OUTROS}>📦 Outros...</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Data Gasto</label>
                <input
                  type="date"
                  value={newExpenseDate}
                  onChange={(e) => setNewExpenseDate(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>
            </div>

            {/* NEW: PAYMENT METHOD FIELDS */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Forma de Pagamento</label>
                <select
                  value={newExpensePaymentMethod}
                  onChange={(e) => setNewExpensePaymentMethod(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-1.5 bg-white font-bold text-slate-800"
                >
                  <option value="Débito">💳 Débito</option>
                  <option value="Crédito">💳 Crédito</option>
                  <option value="Pix">📱 Pix</option>
                  <option value="Dinheiro">💵 Dinheiro</option>
                  <option value="Carteira digital">📱 Carteira digital</option>
                  <option value="Outro">⚙️ Outro</option>
                </select>
              </div>

              {newExpensePaymentMethod === "Crédito" ? (
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Identificação do Cartão (Opcional)</label>
                  <input
                    type="text"
                    placeholder={`Ex: NuBank ${users.Leandro?.name || "Leandro"}, Itaú ${users.Kaisa?.name || "Kaisa"}`}
                    value={newExpenseCardName}
                    onChange={(e) => setNewExpenseCardName(e.target.value)}
                    className="w-full border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 bg-white text-slate-800"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center text-[10px] text-slate-400 italic">
                  Abordagem conjunta do lar 💜
                </div>
              )}
            </div>

            {newExpensePaymentMethod === "Crédito" && (
              <div className="bg-violet-50/35 border border-violet-100 rounded-2xl p-3 flex flex-col gap-2.5 animate-fade-in">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="modal-expense-installment"
                    checked={newExpenseIsInstallment}
                    onChange={(e) => setNewExpenseIsInstallment(e.target.checked)}
                    className="w-4 h-4 text-violet-650 focus:ring-violet-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="modal-expense-installment" className="text-xs text-slate-700 font-bold cursor-pointer select-none">
                    🛒 Compra Parcelada?
                  </label>
                </div>

                {newExpenseIsInstallment && (
                  <div className="grid grid-cols-3 gap-2 mt-1 animate-fade-in text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Total Parcelas</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={newExpenseInstallmentsTotal}
                        onChange={(e) => setNewExpenseInstallmentsTotal(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2 py-1 bg-white text-slate-800 text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Parcela Atual</label>
                      <input
                        type="number"
                        min="1"
                        max={newExpenseInstallmentsTotal}
                        value={newExpenseInstallmentsCurrent}
                        onChange={(e) => setNewExpenseInstallmentsCurrent(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2 py-1 bg-white text-slate-800 text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Valor Mensal (R$)</label>
                      <input
                        type="text"
                        placeholder={
                          newExpenseValue && newExpenseInstallmentsTotal
                            ? (parseFloat(newExpenseValue) / parseFloat(newExpenseInstallmentsTotal) || 0).toFixed(2)
                            : "Opcional"
                        }
                        value={newExpenseMonthlyInstallmentValue}
                        onChange={(e) => setNewExpenseMonthlyInstallmentValue(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2 py-1 bg-white text-slate-850 text-center font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2.5 py-2.5 bg-violet-50/50 rounded-2xl px-3.5 border border-violet-100 my-0.5">
              <input
                type="checkbox"
                id="modal-expense-recurring"
                checked={newExpenseRecurring}
                onChange={(e) => setNewExpenseRecurring(e.target.checked)}
                className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="modal-expense-recurring" className="text-xs text-slate-700 font-semibold cursor-pointer select-none">
                🔁 Marcar como Gasto Fixo (Recorrente Mensal)
              </label>
            </div>

            <button
              onClick={() => {
                if (!newExpenseValue || !newExpenseDesc) {
                  triggerCustomNotify("Preencha o valor e descrição das despesas!", "error");
                  return;
                }
                
                const valNum = parseFloat(newExpenseValue) || 0;
                const totParcelas = newExpensePaymentMethod === "Crédito" && newExpenseIsInstallment ? (parseInt(newExpenseInstallmentsTotal, 10) || 1) : undefined;
                const parcAtual = newExpensePaymentMethod === "Crédito" && newExpenseIsInstallment ? (parseInt(newExpenseInstallmentsCurrent, 10) || 1) : undefined;
                
                // Monthly installment value determination
                let valMensal: number | undefined = undefined;
                if (newExpensePaymentMethod === "Crédito" && newExpenseIsInstallment) {
                  valMensal = newExpenseMonthlyInstallmentValue ? parseFloat(newExpenseMonthlyInstallmentValue) : (valNum / (totParcelas || 1));
                }

                handleAction("/api/expenses/create", {
                  value: newExpenseValue,
                  description: newExpenseDesc,
                  paid_by_id: newExpensePaidBy,
                  split_type: newExpenseSplit,
                  custom_percent: newExpenseCustomPct,
                  category: newExpenseCategory,
                  date: newExpenseDate,
                  is_recurring: newExpenseRecurring,
                  payment_method: newExpensePaymentMethod,
                  card_name: newExpensePaymentMethod === "Crédito" ? newExpenseCardName : undefined,
                  installments_total: totParcelas,
                  installments_current: parcAtual,
                  monthly_installment_value: valMensal
                });

                setExpenseModalOpen(false);
                setNewExpenseValue("");
                setNewExpenseDesc("");
                setNewExpenseRecurring(false);
                setNewExpensePaymentMethod("Pix");
                setNewExpenseCardName("");
                setNewExpenseIsInstallment(false);
                setNewExpenseInstallmentsTotal("10");
                setNewExpenseInstallmentsCurrent("1");
                setNewExpenseMonthlyInstallmentValue("");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-550 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition cursor-pointer"
              id="btn-confirm-add-expense"
            >
              Registrar Gasto Compartilhado 💜
            </button>
          </div>
        </div>
      )}

      {/* 5. Add Memory Space Sheet */}
      {memoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">📸 Eternizar Novo Momento</h3>
              <button onClick={() => setMemoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1.5">Escolha ou Carregue a Foto do Casal *</label>
              <div className="flex flex-col gap-2">
                {newMemoryUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200">
                    <img src={newMemoryUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewMemoryUrl("")}
                      className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-950 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>✕</span> Alterar Foto
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-violet-400 bg-slate-50 p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition relative min-h-[90px]">
                    <input 
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files[0]) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64Str = event.target?.result as string;
                            setNewMemoryUrl(base64Str);
                          };
                          reader.readAsDataURL(files[0]);
                        }
                      }}
                    />
                    <span className="text-xl">📸</span>
                    <span className="text-[11px] font-bold text-slate-700 mt-1">Carregar foto do dispositivo</span>
                    <span className="text-[9px] text-slate-400">Arraste a foto ou clique para abrir a câmera/galeria</span>
                  </div>
                )}
                
                {/* Fallback inline link prompt */}
                <div className="text-[10px] text-right">
                  <button
                    type="button"
                    onClick={() => setNewMemoryUrl("")}
                    className="text-violet-600 hover:text-violet-700 font-bold underline"
                  >
                    Ou cole um link de imagem (URL)
                  </button>

                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Apenas frase / Sentimento sobre o registro *</label>
              <input
                type="text"
                maxLength={200}
                placeholder="Ex: Pegando as chaves do apartamento!..."
                value={newMemoryDesc}
                onChange={(e) => setNewMemoryDesc(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Onde Estávamos?</label>
                <input
                  type="text"
                  placeholder="Ex: Ubatuba, SP"
                  value={newMemoryLoc}
                  onChange={(e) => setNewMemoryLoc(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Nome do Álbum Manual</label>
                <input
                  type="text"
                  placeholder="Ex: Viagens do Ano"
                  value={newMemoryAlbum}
                  onChange={(e) => setNewMemoryAlbum(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!newMemoryUrl || !newMemoryDesc) {
                  triggerCustomNotify("Por favor adicione a foto e uma frase de memória!", "error");
                  return;
                }
                handleAction("/api/memories/create", {
                  url: newMemoryUrl,
                  description: newMemoryDesc,
                  date: newMemoryDate,
                  location: newMemoryLoc,
                  album_name: newMemoryAlbum
                });
                setMemoryModalOpen(false);
                setNewMemoryUrl("");
                setNewMemoryDesc("");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
              id="btn-confirm-add-memory"
            >
              Publicar no Álbum de Memórias
            </button>
          </div>
        </div>
      )}

      {/* 6. Add Wishlist Goal Sheet */}
      {wishlistModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">🎁 Adicionar Novo Desejo NósDois</h3>
              <button onClick={() => setWishlistModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Nome do Objeto / Sonho *</label>
              <input
                type="text"
                placeholder="Ex: Jogo de Copos Cristal"
                value={newWishName}
                onChange={(e) => setNewWishName(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Preço Estimativo *</label>
                <input
                  type="text"
                  placeholder="Ex: 180"
                  value={newWishPrice}
                  onChange={(e) => setNewWishPrice(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1 text-xs">Meta Ideal de Cofrinho NósDois (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 180"
                  value={newWishGoal}
                  onChange={(e) => setNewWishGoal(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Categoria</label>
                <select
                  value={newWishCategory}
                  onChange={(e) => setNewWishCategory(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={WishlistCategory.LAR}>Para o Lar 🏡</option>
                  <option value={WishlistCategory.EXPERIENCIA}>Experiências 🗺️</option>
                  <option value={WishlistCategory.PESSOAL}>Desejos Individuais 🧑‍💻</option>
                  <option value={WishlistCategory.PETS}>🐶 Luke (Pets)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Gravidade / Prioridade</label>
                <select
                  value={newWishPriority}
                  onChange={(e) => setNewWishPriority(e.target.value as any)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="Baixa">🟢 Prioridade Baixa</option>
                  <option value="Média">🟡 Média</option>
                  <option value="Alta">🔴 Prioridade Alta urgente</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="surprise-mode-check"
                checked={newWishPrivate}
                onChange={(e) => setNewWishPrivate(e.target.checked)}
                className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
              />
              <label htmlFor="surprise-mode-check" className="text-xs text-slate-600">
                <strong>Modo surpresa 🤫:</strong> Ocultar do meu parceiro (Útil para presentes de aniversário!)
              </label>
            </div>

            <button
              onClick={() => {
                if (!newWishName) {
                  triggerCustomNotify("Por favor defina o nome do item!", "error");
                  return;
                }
                handleAction("/api/wishlist/create", {
                  name: newWishName,
                  estimated_price: newWishPrice,
                  priority: newWishPriority,
                  category: newWishCategory,
                  is_private_to_partner: newWishPrivate,
                  saving_goal: newWishGoal,
                  added_by: currentUser
                });
                setWishlistModalOpen(false);
                setNewWishName("");
                setNewWishPrice("");
                setNewWishGoal("");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
              id="btn-confirm-add-wish"
            >
              Confirmar Desejo Coletivo
            </button>
          </div>
        </div>
      )}

      {/* 7. Add Recipe Sheet */}
      {recipeModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">🥘 Adicionar Receita do Casal</h3>
              <button onClick={() => setRecipeModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Nome do prato ou doce *</label>
              <input
                type="text"
                placeholder="Ex: Panqueca de Aveia"
                value={newRecipeTitle}
                onChange={(e) => setNewRecipeTitle(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Ingredientes (Um por linha, use hífens) *</label>
              <textarea
                placeholder="Ex: - Aveia em flocos: 1 xícara&#10;- Banana madura: 1 unidade&#10;- Canela em pó"
                value={newRecipeIngreds}
                onChange={(e) => setNewRecipeIngreds(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                rows={3}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Modo de preparo rápido</label>
              <textarea
                placeholder="1. Bata tudo no liquidificador&#10;2. Leve à frigideira aquecida"
                value={newRecipeInst}
                onChange={(e) => setNewRecipeInst(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Duração (minutos)</label>
                <input
                  type="number"
                  value={newRecipeDuration}
                  onChange={(e) => setNewRecipeDuration(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Porções</label>
                <input
                  type="number"
                  value={newRecipePortions}
                  onChange={(e) => setNewRecipePortions(e.target.value)}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!newRecipeTitle || !newRecipeIngreds) {
                  triggerCustomNotify("Informe o título e os ingredientes da receita!", "error");
                  return;
                }
                const parsedIngs = newRecipeIngreds.split("\n").filter(x => x.trim().length > 0);
                handleAction("/api/recipes/create", {
                  title: newRecipeTitle,
                  ingredients: parsedIngs,
                  instructions: newRecipeInst,
                  duration: newRecipeDuration,
                  portions: newRecipePortions
                });
                setRecipeModalOpen(false);
                setNewRecipeTitle("");
                setNewRecipeIngreds("");
                setNewRecipeInst("");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
              id="btn-confirm-add-recipe"
            >
              Publicar Receita Confraria
            </button>
          </div>
        </div>
      )}

      {/* 8. Import Recipe Link Modal */}
      {recipeImportModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">🔗 Importar Receita de Site Externo</h3>
              <button onClick={() => setRecipeImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Cole o link de sites parceiros como <strong>Panelinha, Receitas Globo ou TudoGostoso</strong>. Nosso software extrairá ingredientes automaticamente para compras conjuntas.
            </p>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Cole o URL Completo *</label>
              <input
                type="text"
                placeholder="Ex: https://www.panelinha.com.br/receita/Risoto-Abobora"
                value={importRecipeUrl}
                onChange={(e) => setImportRecipeUrl(e.target.value)}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 font-mono"
              />
            </div>

            <button
              onClick={() => {
                if (!importRecipeUrl) {
                  triggerCustomNotify("Cole o link da receita para importar!", "error");
                  return;
                }
                handleAction("/api/recipes/import-url", { url: importRecipeUrl });
                setRecipeImportModalOpen(false);
                setImportRecipeUrl("");
                triggerCustomNotify("Receita importada com sucesso! Ingredientes adicionados ao NósDois.", "success");
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-xs transition"
              id="btn-confirm-import-recipe"
            >
              Fazer Scraping e Extrair Ingredientes Confeiteiro
            </button>
          </div>
        </div>
      )}

      {/* ==============================================
          INDIVIDUAL AND COMPREHENSIVE EDITING SHEETS / MODALS
          ============================================== */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">✏️ Editar Tarefa Gamificada</h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Título da tarefa *</label>
              <input
                type="text"
                maxLength={80}
                placeholder="Ex: Lavar a louça do almoço"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Descrição / Observações adicionais</label>
              <textarea
                placeholder="Ex: Secar louça e guardar panelas grandes..."
                value={editingTask.description || ""}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Quem faz?</label>
                <select
                  value={editingTask.responsible_id || "Ambos"}
                  onChange={(e) => setEditingTask({ ...editingTask, responsible_id: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="Ambos">Ambos</option>
                  <option value={firstUserId}>{users[firstUserId]?.name || firstUserId}</option>
                  <option value={secondUserId}>{users[secondUserId]?.name || secondUserId}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Categoria do Cômodo</label>
                <select
                  value={editingTask.category || TaskCategory.OUTRO}
                  onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={TaskCategory.COZINHA}>🍳 Cozinha</option>
                  <option value={TaskCategory.BANHEIRO}>🚿 Banheiro</option>
                  <option value={TaskCategory.SALA}>🛋️ Sala de Estar</option>
                  <option value={TaskCategory.QUARTO}>🛏️ Quarto</option>
                  <option value={TaskCategory.PET}>🐶 Luke (Pet)</option>
                  <option value={TaskCategory.OUTRO}>💡 Outro...</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Prazo Máximo</label>
                <input
                  type="date"
                  value={editingTask.due_date || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Gravidade / Urgência</label>
                <select
                  value={editingTask.priority || TaskPriority.NORMAL}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={TaskPriority.BAIXA}>🟢 Baixa (10 pontos)</option>
                  <option value={TaskPriority.NORMAL}>🔵 Normal (10 pontos)</option>
                  <option value={TaskPriority.URGENTE}>🔴 Urgente (25 pontos)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Recorrência Automática</label>
                <select
                  value={editingTask.recurrence || "Nenhuma"}
                  onChange={(e) => setEditingTask({ ...editingTask, recurrence: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="Nenhuma">Nenhuma</option>
                  <option value="Diária">Repete Todo Dia</option>
                  <option value="Semanal">Repete Toda Semana</option>
                  <option value="Quinzenal">Repete a cada 15 dias</option>
                  <option value="Mensal">Repete Todo Mês</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Tempo Estimado (minutos)</label>
                <input
                  type="number"
                  placeholder="Ex: 20"
                  value={editingTask.time_estimate || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, time_estimate: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!editingTask.title) {
                  triggerCustomNotify("Insira pelo menos um título para a tarefa!");
                  return;
                }
                handleAction("/api/tasks/update", {
                  id: editingTask.id,
                  title: editingTask.title,
                  description: editingTask.description,
                  responsible_id: editingTask.responsible_id,
                  category: editingTask.category,
                  priority: editingTask.priority,
                  due_date: editingTask.due_date,
                  recurrence: editingTask.recurrence,
                  time_estimate: editingTask.time_estimate
                });
                setEditingTask(null);
                triggerCustomNotify("Tarefa atualizada com sucesso!");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition animate-slide-up"
            >
              Salvar Alterações da Tarefa
            </button>
          </div>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">✏️ Editar Evento da Agenda</h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Título do Evento *</label>
              <input
                type="text"
                value={editingEvent.title}
                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Descrição</label>
              <textarea
                value={editingEvent.description || ""}
                onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Tipo de Compromisso</label>
                <select
                  value={editingEvent.type || EventType.OUTRO}
                  onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={EventType.DATA_ESPECIAL}>💖 Data Especial / Aniversário</option>
                  <option value={EventType.VIAGEM}>✈️ Viagem / Passeio</option>
                  <option value={EventType.RESTAURANTE}>🍔 Jantar / Encontro</option>
                  <option value={EventType.OUTRO}>🧩 Outro Compromisso</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Quem Organiza?</label>
                <select
                  value={editingEvent.responsible_id || "Ambos"}
                  onChange={(e) => setEditingEvent({ ...editingEvent, responsible_id: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="Ambos">Ambos</option>
                  <option value={firstUserId}>{users[firstUserId]?.name || firstUserId}</option>
                  <option value={secondUserId}>{users[secondUserId]?.name || secondUserId}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Início / Horário *</label>
                <input
                  type="datetime-local"
                  value={editingEvent.start_time ? editingEvent.start_time.substring(0, 16) : ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, start_time: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Local / Endereço</label>
                <input
                  type="text"
                  placeholder="Ex: Gramado - RS"
                  value={editingEvent.location || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!editingEvent.title || !editingEvent.start_time) {
                  triggerCustomNotify("Preencha o título e horário do evento!");
                  return;
                }
                handleAction("/api/events/update", {
                  id: editingEvent.id,
                  title: editingEvent.title,
                  description: editingEvent.description,
                  type: editingEvent.type,
                  start_time: editingEvent.start_time,
                  location: editingEvent.location,
                  responsible_id: editingEvent.responsible_id
                });
                setEditingEvent(null);
                triggerCustomNotify("Evento atualizado na agenda!");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
            >
              Salvar Evento
            </button>
          </div>
        </div>
      )}

      {editingMemory && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">✏️ Editar Lembrança / Foto</h3>
              <button onClick={() => setEditingMemory(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Qual é a legenda mágica desta foto? *</label>
              <textarea
                value={editingMemory.description}
                onChange={(e) => setEditingMemory({ ...editingMemory, description: e.target.value })}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Data que ocorreu</label>
                <input
                  type="date"
                  value={editingMemory.date || ""}
                  onChange={(e) => setEditingMemory({ ...editingMemory, date: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1 font-sans">Local que marcou vocês</label>
                <input
                  type="text"
                  value={editingMemory.location || ""}
                  onChange={(e) => setEditingMemory({ ...editingMemory, location: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!editingMemory.description) {
                  triggerCustomNotify("Preencha a legenda da lembrança!");
                  return;
                }
                handleAction("/api/memories/update", {
                  id: editingMemory.id,
                  description: editingMemory.description,
                  date: editingMemory.date,
                  location: editingMemory.location
                });
                setEditingMemory(null);
                triggerCustomNotify("Lembrança atualizada com carinho!");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
            >
              Confirmar Edições no Álbum
            </button>
          </div>
        </div>
      )}

      {editingWishlist && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">✏️ Editar Sonho ou Cofrinho</h3>
              <button onClick={() => setEditingWishlist(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Nome do Sonho / Item *</label>
              <input
                type="text"
                value={editingWishlist.name}
                onChange={(e) => setEditingWishlist({ ...editingWishlist, name: e.target.value })}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1 font-sans">Preço Estimativo (R$)</label>
                <input
                  type="number"
                  value={editingWishlist.estimated_price || ""}
                  onChange={(e) => setEditingWishlist({ ...editingWishlist, estimated_price: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Categoria</label>
                <select
                  value={editingWishlist.category || WishlistCategory.OUTRO}
                  onChange={(e) => setEditingWishlist({ ...editingWishlist, category: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value={WishlistCategory.VIAGEM}>✈️ Viagem do Sonho</option>
                  <option value={WishlistCategory.CASA}>🏡 Móveis ou Decoração do Lar</option>
                  <option value={WishlistCategory.ELETRONICOS}>💻 Eletrônicos & Setup</option>
                  <option value={WishlistCategory.OUTRO}>🎁 Outros caprichos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Meta de Poupança (Opcional)</label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  value={editingWishlist.saving_goal || ""}
                  onChange={(e) => setEditingWishlist({ ...editingWishlist, saving_goal: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Prioridade</label>
                <select
                  value={editingWishlist.priority || "Média"}
                  onChange={(e) => setEditingWishlist({ ...editingWishlist, priority: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-2 py-2 bg-slate-50"
                >
                  <option value="Baixa">🟢 Baixa prioridade</option>
                  <option value="Média">🟡 Média prioridade</option>
                  <option value="Alta">🔴 Alta Prioridade</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                if (!editingWishlist.name) {
                  triggerCustomNotify("Preencha o nome do sonho!");
                  return;
                }
                handleAction("/api/wishlist/update", {
                  id: editingWishlist.id,
                  name: editingWishlist.name,
                  category: editingWishlist.category,
                  estimated_price: editingWishlist.estimated_price,
                  saving_goal: editingWishlist.saving_goal,
                  priority: editingWishlist.priority
                });
                setEditingWishlist(null);
                triggerCustomNotify("Lista de desejos atualizada com sucesso!");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {editingRecipe && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-display">✏️ Editar Receita Sabores</h3>
              <button onClick={() => setEditingRecipe(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Título da Receita *</label>
              <input
                type="text"
                value={editingRecipe.title}
                onChange={(e) => setEditingRecipe({ ...editingRecipe, title: e.target.value })}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Ingredientes (Um por linha) *</label>
              <textarea
                value={Array.isArray(editingRecipe.ingredients) ? editingRecipe.ingredients.join("\n") : editingRecipe.ingredients}
                onChange={(e) => setEditingRecipe({ ...editingRecipe, ingredients: e.target.value.split("\n") })}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50 focus:bg-white font-sans text-slate-700"
                rows={4}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold block mb-1">Modo de Preparo</label>
              <textarea
                value={editingRecipe.instructions || ""}
                onChange={(e) => setEditingRecipe({ ...editingRecipe, instructions: e.target.value })}
                className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Duração (minutos)</label>
                <input
                  type="number"
                  value={editingRecipe.duration || ""}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, duration: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-505 font-bold block mb-1">Porções</label>
                <input
                  type="number"
                  value={editingRecipe.portions || ""}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, portions: e.target.value })}
                  className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!editingRecipe.title || !editingRecipe.ingredients) {
                  triggerCustomNotify("Preencha o título e ingredientes da receita!");
                  return;
                }
                const parsedIngs = Array.isArray(editingRecipe.ingredients) 
                  ? editingRecipe.ingredients.filter((x: string) => x.trim().length > 0)
                  : [editingRecipe.ingredients];

                handleAction("/api/recipes/update", {
                  id: editingRecipe.id,
                  title: editingRecipe.title,
                  ingredients: parsedIngs,
                  instructions: editingRecipe.instructions,
                  duration: editingRecipe.duration,
                  portions: editingRecipe.portions
                });
                setEditingRecipe(null);
                triggerCustomNotify("Receita atualizada nas panelas do lar!");
              }}
              className="mt-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-3.5 rounded-xl text-xs hover:shadow-md transition"
            >
              Publicar Alterações
            </button>
          </div>
        </div>
      )}

      {/* ==============================================
          FIXED ACCESSIBLE BOTTOM NAVIGATION BAR (Rule 20.2 - Bottom navigation bar com 5 abas principais)
          ============================================== */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2.5 px-4 z-40 shadow-lg text-slate-500 max-w-lg w-full mx-auto flex items-center justify-between md:hidden" id="app-navigation">
        {[
          { tab: "home", label: "Home", icon: <HomeIcon className="w-5 h-5" /> },
          { tab: "tasks", label: "Tarefas", icon: <CheckSquare className="w-5 h-5" /> },
          { tab: "agenda", label: "Agenda", icon: <CalendarIcon className="w-5 h-5" /> },
          { tab: "shopping", label: "Compras", icon: <ShoppingBag className="w-5 h-5" /> },
          { 
            tab: "more", 
            label: activeTab === "more" ? (
              moreSubTab === "finances" ? "Finanças" :
              moreSubTab === "gamification" ? "Conquistas" :
              moreSubTab === "memories" ? "Álbum" :
              moreSubTab === "mood" ? "Insights" :
              moreSubTab === "wishlist" ? "Wishlist" :
              moreSubTab === "recipes" ? "Cardápio" :
              moreSubTab === "pets" ? "Pets" :
              moreSubTab === "house" ? "Casa" : "Perfis"
            ) : "Mais ⋯",
            icon: activeTab === "more" ? (
              moreSubTab === "finances" ? <DollarSign className="w-5 h-5 text-emerald-500" /> :
              moreSubTab === "gamification" ? <Trophy className="w-5 h-5 text-amber-500" /> :
              moreSubTab === "memories" ? <ImageIcon className="w-5 h-5 text-pink-500" /> :
              moreSubTab === "mood" ? <Smile className="w-5 h-5 text-sky-500" /> :
              moreSubTab === "wishlist" ? <Gift className="w-5 h-5 text-orange-400" /> :
              moreSubTab === "recipes" ? <BookOpen className="w-5 h-5 text-teal-500" /> :
              moreSubTab === "pets" ? <Heart className="w-5 h-5 text-teal-600" /> :
              moreSubTab === "house" ? <HomeIcon className="w-5 h-5 text-slate-600" /> : <Settings className="w-5 h-5" />
            ) : <MoreHorizontal className="w-5 h-5" />
          }
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab as any)}
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition relative ${
              activeTab === item.tab 
                ? "text-violet-600 font-bold" 
                : "text-slate-400 hover:text-slate-600"
            }`}
            id={`tab-btn-${item.tab}`}
          >
            {item.icon}
            <span className="text-[10px] tracking-wide">{item.label}</span>
            {activeTab === item.tab && (
              <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-8 h-1 bg-violet-600 rounded-full"></span>
            )}
            
            {/* Context counters directly on icons */}
            {item.tab === "tasks" && tasks.filter(t => !t.completed).length > 0 && (
              <span className="absolute top-0 right-1/4 bg-red-500 text-white font-bold text-[8px] px-1 py-0.2 rounded-full min-w-[14px] text-center">
                {tasks.filter(t => !t.completed).length}
              </span>
            )}
            {item.tab === "shopping" && shopping.filter(s => !s.is_bought).length > 0 && (
              <span className="absolute top-0 right-1/4 bg-violet-600 text-white font-bold text-[8px] px-1 py-0.2 rounded-full min-w-[14px] text-center">
                {shopping.filter(s => !s.is_bought).length}
              </span>
            )}
          </button>
        ))}
      </footer>

      {/* BEAUTIFUL CUSTOM TOAST FLOATING BANNER */}
      {customNotify && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-55 max-w-sm w-11/12 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border animate-bounce ${
          customNotify.type === "success" 
            ? "bg-emerald-50 text-emerald-950 border-emerald-200" 
            : customNotify.type === "error" 
              ? "bg-rose-50 text-rose-950 border-rose-200" 
              : "bg-blue-50 text-blue-950 border-blue-200"
        }`}>
          <div className="text-xl">
            {customNotify.type === "success" ? "✅" : customNotify.type === "error" ? "❌" : "💡"}
          </div>
          <div className="flex-1 text-xs font-semibold leading-snug">{customNotify.message}</div>
          <button onClick={() => setCustomNotify(null)} className="text-slate-400 hover:text-slate-650 font-bold text-xs shrink-0 self-start">dismiss</button>
        </div>
      )}

      {/* BEAUTIFUL CUSTOM CONFIRM MODAL DIALOG */}
      {customConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 shadow-2xl max-w-xs w-full text-center border border-slate-100 flex flex-col gap-4">
            <div className="text-3xl select-none">🚨</div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Confirmação</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{customConfirm.message}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={customConfirm.onConfirm}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl py-2 text-xs font-bold shadow-6 h-9 transition active:scale-[0.98]"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={customConfirm.onCancel}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2 text-xs font-bold h-9 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
