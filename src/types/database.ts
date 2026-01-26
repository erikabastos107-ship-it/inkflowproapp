export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type ExpenseCategory = 'rent' | 'materials' | 'marketing' | 'apps' | 'utilities' | 'other';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer';
export type MaterialCategory = 'needles' | 'ink' | 'tips' | 'gloves' | 'paper' | 'film' | 'cleaning' | 'other';
export type UnitType = 'un' | 'ml' | 'g' | 'box' | 'pack';
export type NotificationType = 'low_stock' | 'appointment_reminder' | 'system';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  studio_name: string | null;
  phone: string | null;
  photo_url: string | null;
  timezone: string;
  currency: string;
  onboarding_done: boolean;
  stock_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  id: string;
  user_id: string;
  weekday: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  skin_tone: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string | null;
  start_at: string;
  duration_min: number;
  service: string;
  status: AppointmentStatus;
  price_expected: number;
  price_final: number;
  deposit: number;
  notes: string | null;
  reminder: boolean;
  created_at: string;
  updated_at: string;
  client?: Client | null;
}

export interface Material {
  id: string;
  user_id: string;
  name: string;
  category: MaterialCategory;
  unit: UnitType;
  qty_current: number;
  min_qty: number;
  unit_cost: number;
  supplier: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialConsumption {
  id: string;
  user_id: string;
  appointment_id: string;
  material_id: string;
  qty_used: number;
  created_at: string;
  material?: Material;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  description: string | null;
  recurring: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}
