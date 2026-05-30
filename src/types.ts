/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TaskCategory {
  COZINHA = "Cozinha",
  BANHEIRO = "Banheiro",
  SALA = "Sala",
  QUARTO = "Quarto",
  COMPRAS = "Compras",
  PET = "Pet",
  EXTERNO = "Externo",
  OUTRO = "Outro"
}

export enum TaskPriority {
  BAIXA = "Baixa",
  NORMAL = "Normal",
  URGENTE = "Urgente"
}

export enum EventType {
  COMPROMISSO = "Compromisso",
  DATA_ESPECIAL = "Data especial",
  VIAGEM = "Viagem",
  SAIDA_JUNTOS = "Saída juntos",
  TAREFA = "Tarefa com prazo",
  INDIVIDUAL = "Evento individual",
  LEMBRETE = "Lembrete"
}

export enum ShoppingCategory {
  HORTIFRUTI = "Hortifrúti",
  LATICINIOS = "Laticínios",
  CARNES = "Carnes",
  LIMPEZA = "Limpeza",
  HIGIENE = "Higiene",
  OUTROS = "Outros"
}

export enum ExpenseCategory {
  ALIMENTACAO = "Alimentação",
  MORADIA = "Moradia",
  LAZER = "Lazer",
  SAUDE = "Saúde",
  TRANSPORTE = "Transporte",
  PETS = "Pets",
  OUTROS = "Outros"
}

export type StoreType = "Supermercado" | "Farmácia" | "Pet Shop" | "Feira" | "Açougue" | "Padaria" | "Outros";

export enum MoodType {
  CANSADO = "Cansado",
  BEM = "Bem",
  OTIMO = "Ótimo",
  ANSIOSO = "Ansioso",
  BAIXA = "Na baixa"
}

export enum WishlistCategory {
  LAR = "Para o Lar",
  EXPERIENCIA = "Experiências",
  PESSOAL = "Pessoal",
  PETS = "Pets"
}

export interface User {
  id: string;
  name: string;
  nickname?: string; // Meu apelido carinhoso próprio
  partner_nickname: string; // nickname Leandro gives Kaisa and vice-versa
  color: string; // custom hex color or tailwind shade for styling
  timezone: string;
  avatar_url?: string;
  points_weekly: number;
  preferences?: {
    defaultPaymentMethod?: string;
    loveLanguage?: string;
    notificationsEnabled?: boolean;
    customStatus?: string;
  };
}

export interface ShoppingFinalization {
  id: string;
  monthId: string;
  estimatedTotal: number;
  realTotal: number;
  difference: number;
  paymentMethod: string;
  paidBy: string;
  date: string;
}

export interface Couple {
  id: string;
  invite_code: string;
  connected: boolean;
  home_level: number;
  total_points: number;
  unlocked_achievements: string[]; // e.g. "7-days-no-dishes"
  shoppingBudgets?: Record<string, number>;
  shoppingFinalizations?: ShoppingFinalization[];
  expenseBudgets?: Record<ExpenseCategory, number>; // monthly budget limit per category
  weeklyTasksBalance?: { leandro: number; kaisa: number }; // tasks completed this week
  coinBalance?: number; // separate from XP for reward store
  xpBalance?: number; // permanent XP for ranking
}

export interface TaskComment {
  id: string;
  author_id: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  responsible_id: string; // "Leandro" | "Kaisa" | "Ambos"
  due_date?: string;
  recurrence: "Nenhuma" | "Diária" | "Semanal" | "Quinzenal" | "Mensal";
  rotation_enabled?: boolean; // if true, alternates on completion
  category: TaskCategory;
  priority: TaskPriority;
  time_estimate?: number; // minutes
  photo_proof?: string; // base64 payload or representation
  points: number;
  completed: boolean;
  completed_at?: string;
  archived: boolean;
  comments: TaskComment[];
  transferred_from?: string; // user who originally owned the task
  transfer_note?: string; // note when transferring
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  start_time: string;
  end_time?: string;
  location?: string;
  travel_checklist?: { item: string; checked: boolean }[];
  booking_link?: string;
  responsible_id: string; // "Leandro" | "Kaisa" | "Ambos"
  comments: { id: string; author_id: string; text: string; timestamp: string }[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  quantity: number;
  unit: string;
  price?: number;
  is_bought: boolean;
  bought_at?: string;
  added_by: string;
  suggested?: boolean;
  reason_suggested?: string;
  monthId?: string; // e.g. "2026-05" (Maio/2026)
  listStatus?: "active" | "finalized";
  paymentMethod?: string; // VR, Débito, Crédito, PIX, Dinheiro
  store?: StoreType; // where to buy
}

export type FixedFunctionFrequency = "Diária" | "Semanal" | "Quinzenal" | "Mensal";

export interface FixedFunction {
  id: string;
  title: string;
  responsible_id: string; // permanent owner
  frequency: FixedFunctionFrequency;
  category: TaskCategory;
  rotation_enabled: boolean; // if true, alternates between partners
  current_rotation_owner: string; // who does it this cycle
  completion_history: { date: string; completed_by: string }[];
  active: boolean;
}

export interface ActivityReaction {
  id: string;
  activity_id: string;
  user_id: string;
  emoji: "❤️" | "🚀" | "🏆";
  timestamp: string;
}

export interface Expense {
  id: string;
  value: number;
  currency: "R$" | "USD" | "EUR";
  description: string;
  paid_by_id: string; // "Leandro" | "Kaisa"
  split_type: "50/50" | "paid_all" | "partner_all" | "custom";
  custom_percent?: number; // % that Leandro pays if custom
  category: ExpenseCategory;
  date: string;
  receipt_url?: string;
  is_recurring: boolean;
  is_paid_this_month?: boolean;
  payment_method?: "Débito" | "Crédito" | "Pix" | "Dinheiro" | "Carteira digital" | "Outro";
  card_name?: string;
  installments_total?: number;
  installments_current?: number;
  monthly_installment_value?: number;
}

export interface Memory {
  id: string;
  url: string;
  description: string;
  date: string;
  location?: string;
  album_name?: string; // e.g. "Nossa primeira viagem", "Nosso apartamento"
  is_capsule?: boolean;
  capsule_unlock_date?: string;
  created_at: string;
}

export interface MoodCheckIn {
  id: string;
  user_id: string; // "Leandro" | "Kaisa"
  mood: MoodType;
  note?: string; // private by default
  share_note: boolean;
  date: string; // YYYY-MM-DD
}

export interface WishlistItem {
  id: string;
  name: string;
  photo_url?: string;
  link?: string;
  estimated_price?: number;
  priority: "Baixa" | "Média" | "Alta";
  is_private_to_partner?: boolean; // surprise item
  category: WishlistCategory;
  saving_goal?: number;
  saving_saved?: number;
  added_by: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  duration: number; // minutes
  portions: number;
  couple_rating?: "Gostamos" | "Não repetir" | "Favorita";
  tags: string[]; // e.g. "vegana", "rápida", "econômica"
  photo_url?: string;
}

export interface MealPlan {
  id: string; // day_mealtype (e.g. "Segunda-Café")
  day: "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado" | "Domingo";
  meal_type: "Café" | "Almoço" | "Jantar";
  recipe_id?: string; // foreign key
  custom_text?: string; // custom description if not linking a recipe
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_quantity: number; // threshold to automatically suggest to shopping list
}

export interface HouseStatus {
  status: "order" | "balanced" | "accumulating" | "reorganize";
  headline: string;
  description: string;
}

export interface WeeklySummary {
  tasks_completed: number;
  moments_recorded: number;
  total_spent: number;
  average_mood_leandro: MoodType;
  average_mood_kaisa: MoodType;
  unlocked_achievements: string[];
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  desc: string;
  emoji: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  type: "Faxina" | "Afeto" | "Culinária" | "Custom";
  target_count?: number; // e.g. 3, for "complete 3 cleanups"
  current_count?: number; // current progress
  completed: boolean;
}

export interface QuickNote {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
}

export interface PetVaccine {
  id: string;
  name: string;
  date_applied: string;
  next_dose_date?: string;
  is_completed: boolean;
}

export interface PetMedication {
  id: string;
  name: string;
  type: "Antiparasitário" | "Remédio" | "Banho/Tosa" | "Consulta" | "Outro";
  date: string;
  notes?: string;
}

export interface PetWeightRecord {
  id: string;
  weight: number; // kg
  date: string;
}

export interface PetDocument {
  id: string;
  title: string;
  link: string;
  date_created: string;
}

export type PetSpecies = "Cachorro" | "Gato" | "Passaro" | "Roedor" | "Outros";

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  age?: number;
  avatar_url?: string;
  coupleId?: string;
  vaccines: PetVaccine[];
  medications: PetMedication[];
  weights: PetWeightRecord[];
  documents: PetDocument[];
  food_daily_qty?: number; // daily weight in g
  food_inventory_item_id?: string; // connects to inventory item
}

export interface MonthlyAccount {
  id: string;
  name: string;
  value: number;
  due_day: number; // 1-31
  paid_by_id: string;
  category: string;
  paid_this_month: boolean;
  paid_month?: string;
  payment_history: { month: string; paid: boolean }[];
  coupleId?: string;
}
