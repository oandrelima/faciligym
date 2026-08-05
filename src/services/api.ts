import { neon } from '@neondatabase/serverless';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DATABASE_URL = process.env.EXPO_PUBLIC_DATABASE_URL || process.env.DATABASE_URL || '';

const sql = neon(DATABASE_URL);

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  weekly_goal: number;
  current_weight: number;
  target_weight: number;
  onboarding_completed: boolean;
  diet_calories: number;
  diet_protein_g: number;
  diet_carbs_g: number;
  diet_fats_g: number;
  diet_configured: boolean;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  workout_type: string;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight_kg: number;
  rest_seconds?: number;
  completed?: boolean;
}

export interface WorkoutRoutine {
  id: string;
  user_id?: string;
  title: string;
  category: string;
  description: string;
  exercises: Exercise[];
}

export interface MealItem {
  id: string;
  user_id?: string;
  name: string;
  meal_time: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  items: string[];
}

export interface WeightRecord {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  weight_kg: number;
  notes?: string;
}

const MONTH_NAMES_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export function formatDateBR(dateStr: string, includeYear: boolean = false): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, '0');
  const monthName = MONTH_NAMES_SHORT[monthIdx] || parts[1];
  return includeYear ? `${day} ${monthName} ${year}` : `${day} ${monthName}`;
}

export class FaciliGymStorage {
  // ── AUTH & USER ─────────────────────────────────────────────
  static async login(email: string, pass: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const rows = await sql`
      SELECT id, name, email, weekly_goal, current_weight, target_weight, onboarding_completed,
             diet_calories, diet_protein_g, diet_carbs_g, diet_fats_g, diet_configured, created_at, password_hash
      FROM users WHERE LOWER(email) = ${cleanEmail}
    `;

    if (rows.length === 0 || rows[0].password_hash !== pass) {
      throw new Error('Credenciais inválidas. Verifique o e-mail e a senha.');
    }

    const u = rows[0];
    const profile: UserProfile = {
      id: u.id,
      name: u.name,
      email: u.email,
      weekly_goal: u.weekly_goal ?? 4,
      current_weight: parseFloat(u.current_weight) || 80.0,
      target_weight: parseFloat(u.target_weight) || 75.0,
      onboarding_completed: Boolean(u.onboarding_completed),
      diet_calories: u.diet_calories ?? 2000,
      diet_protein_g: parseFloat(u.diet_protein_g) || 150.0,
      diet_carbs_g: parseFloat(u.diet_carbs_g) || 200.0,
      diet_fats_g: parseFloat(u.diet_fats_g) || 50.0,
      diet_configured: Boolean(u.diet_configured),
      created_at: u.created_at ? String(u.created_at) : undefined,
    };

    await AsyncStorage.setItem('@faciligym_session', JSON.stringify(profile));
    return profile;
  }

  static async getSession(): Promise<UserProfile | null> {
    try {
      const sess = await AsyncStorage.getItem('@faciligym_session');
      if (!sess) return null;
      const cached: UserProfile = JSON.parse(sess);

      // Fetch fresh data from Neon DB
      const rows = await sql`
        SELECT id, name, email, weekly_goal, current_weight, target_weight, onboarding_completed,
               diet_calories, diet_protein_g, diet_carbs_g, diet_fats_g, diet_configured, created_at
        FROM users WHERE id = ${cached.id}
      `;
      if (rows.length > 0) {
        const u = rows[0];
        const updated: UserProfile = {
          id: u.id,
          name: u.name,
          email: u.email,
          weekly_goal: u.weekly_goal ?? 4,
          current_weight: parseFloat(u.current_weight) || 80.0,
          target_weight: parseFloat(u.target_weight) || 75.0,
          onboarding_completed: Boolean(u.onboarding_completed),
          diet_calories: u.diet_calories ?? 2000,
          diet_protein_g: parseFloat(u.diet_protein_g) || 150.0,
          diet_carbs_g: parseFloat(u.diet_carbs_g) || 200.0,
          diet_fats_g: parseFloat(u.diet_fats_g) || 50.0,
          diet_configured: Boolean(u.diet_configured),
          created_at: u.created_at ? String(u.created_at) : undefined,
        };
        await AsyncStorage.setItem('@faciligym_session', JSON.stringify(updated));
        return updated;
      }
      return cached;
    } catch {
      return null;
    }
  }

  static async saveOnboarding(userId: string, weeklyGoal: number, currentWeight: number, targetWeight: number): Promise<UserProfile> {
    const today = new Date().toISOString().split('T')[0];

    await sql`
      UPDATE users
      SET weekly_goal = ${weeklyGoal},
          current_weight = ${currentWeight},
          target_weight = ${targetWeight},
          onboarding_completed = TRUE
      WHERE id = ${userId}
    `;

    // Record initial weight entry
    await sql`
      INSERT INTO weight_history (user_id, date, weight_kg, notes)
      VALUES (${userId}, ${today}, ${currentWeight}, 'Peso inicial registrado no onboarding')
    `;

    const updated = await this.getSession();
    return updated!;
  }

  static async saveDietGoals(userId: string, calories: number, protein: number, carbs: number, fats: number): Promise<UserProfile> {
    await sql`
      UPDATE users
      SET diet_calories = ${calories},
          diet_protein_g = ${protein},
          diet_carbs_g = ${carbs},
          diet_fats_g = ${fats},
          diet_configured = TRUE
      WHERE id = ${userId}
    `;

    const updated = await this.getSession();
    return updated!;
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem('@faciligym_session');
  }

  // ── ATTENDANCE & STREAK ──────────────────────────────────────
  static async getAttendance(userId?: string): Promise<AttendanceRecord[]> {
    try {
      const uid = userId || (await this.getSession())?.id;
      if (!uid) return [];

      const rows = await sql`
        SELECT id, user_id, date::text as date, workout_type, notes
        FROM attendance
        WHERE user_id = ${uid}
        ORDER BY date DESC
      `;
      return rows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        date: r.date,
        workout_type: r.workout_type,
        notes: r.notes ?? '',
      }));
    } catch {
      return [];
    }
  }

  static async calculateStreak(userId?: string): Promise<number> {
    const records = await this.getAttendance(userId);
    if (records.length === 0) return 0;

    const trainedDates = new Set(records.map(r => r.date));
    let streak = 0;
    const curr = new Date();

    // Check today first
    let todayStr = curr.toISOString().split('T')[0];

    // If didn't train today, check if trained yesterday to keep streak active
    if (!trainedDates.has(todayStr)) {
      curr.setDate(curr.getDate() - 1);
      todayStr = curr.toISOString().split('T')[0];
    }

    while (trainedDates.has(todayStr)) {
      streak++;
      curr.setDate(curr.getDate() - 1);
      todayStr = curr.toISOString().split('T')[0];
    }

    return streak;
  }

  static async addAttendance(record: { date: string; workout_type: string; notes?: string }, userId?: string): Promise<AttendanceRecord[]> {
    const uid = userId || (await this.getSession())?.id;
    if (!uid) throw new Error('Usuário não autenticado.');

    const todayStr = new Date().toISOString().split('T')[0];

    // Rule 1: No future check-ins
    if (record.date > todayStr) {
      throw new Error('Não é possível realizar check-in em um dia que não chegou ainda.');
    }

    // Rule 2: No duplicate check-in on the same date
    const existing = await sql`
      SELECT id FROM attendance WHERE user_id = ${uid} AND date = ${record.date}
    `;
    if (existing.length > 0) {
      throw new Error('Você já realizou um check-in nesta data!');
    }

    await sql`
      INSERT INTO attendance (user_id, date, workout_type, notes)
      VALUES (${uid}, ${record.date}, ${record.workout_type}, ${record.notes ?? ''})
    `;

    return this.getAttendance(uid);
  }

  // ── WORKOUT ROUTINES ─────────────────────────────────────────
  static async getRoutines(userId?: string): Promise<WorkoutRoutine[]> {
    try {
      const uid = userId || (await this.getSession())?.id;
      if (!uid) return [];

      const rows = await sql`
        SELECT id, user_id, title, category, description, exercises_json
        FROM routines
        WHERE user_id = ${uid}
        ORDER BY created_at ASC
      `;
      return rows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        category: r.category,
        description: r.description ?? '',
        exercises: Array.isArray(r.exercises_json) ? r.exercises_json : [],
      }));
    } catch {
      return [];
    }
  }

  static async saveRoutine(routine: Omit<WorkoutRoutine, 'user_id'>, userId?: string): Promise<WorkoutRoutine[]> {
    const uid = userId || (await this.getSession())?.id;
    if (!uid) throw new Error('Usuário não autenticado.');

    const jsonEx = JSON.stringify(routine.exercises || []);

    if (routine.id && routine.id.length > 20) {
      await sql`
        UPDATE routines
        SET title = ${routine.title},
            category = ${routine.category},
            description = ${routine.description},
            exercises_json = ${jsonEx}::jsonb
        WHERE id = ${routine.id} AND user_id = ${uid}
      `;
    } else {
      await sql`
        INSERT INTO routines (user_id, title, category, description, exercises_json)
        VALUES (${uid}, ${routine.title}, ${routine.category}, ${routine.description}, ${jsonEx}::jsonb)
      `;
    }

    return this.getRoutines(uid);
  }

  static async deleteRoutine(routineId: string, userId?: string): Promise<WorkoutRoutine[]> {
    const uid = userId || (await this.getSession())?.id;
    if (!uid) return [];

    await sql`DELETE FROM routines WHERE id = ${routineId} AND user_id = ${uid}`;
    return this.getRoutines(uid);
  }

  // ── DIET MEALS ───────────────────────────────────────────────
  static async getMeals(userId?: string): Promise<MealItem[]> {
    try {
      const uid = userId || (await this.getSession())?.id;
      if (!uid) return [];

      const rows = await sql`
        SELECT id, user_id, name, meal_time, calories, protein_g, carbs_g, fats_g, items_json
        FROM meals
        WHERE user_id = ${uid}
        ORDER BY meal_time ASC
      `;
      return rows.map(m => ({
        id: m.id,
        user_id: m.user_id,
        name: m.name,
        meal_time: m.meal_time,
        calories: m.calories,
        protein_g: parseFloat(m.protein_g) || 0,
        carbs_g: parseFloat(m.carbs_g) || 0,
        fats_g: parseFloat(m.fats_g) || 0,
        items: Array.isArray(m.items_json) ? m.items_json : [],
      }));
    } catch {
      return [];
    }
  }

  static async saveMeal(meal: Omit<MealItem, 'user_id'>, userId?: string): Promise<MealItem[]> {
    const uid = userId || (await this.getSession())?.id;
    if (!uid) throw new Error('Usuário não autenticado.');

    const jsonItems = JSON.stringify(meal.items || []);

    if (meal.id && meal.id.length > 20) {
      await sql`
        UPDATE meals
        SET name = ${meal.name},
            meal_time = ${meal.meal_time},
            calories = ${meal.calories},
            protein_g = ${meal.protein_g},
            carbs_g = ${meal.carbs_g},
            fats_g = ${meal.fats_g},
            items_json = ${jsonItems}::jsonb
        WHERE id = ${meal.id} AND user_id = ${uid}
      `;
    } else {
      await sql`
        INSERT INTO meals (user_id, name, meal_time, calories, protein_g, carbs_g, fats_g, items_json)
        VALUES (${uid}, ${meal.name}, ${meal.meal_time}, ${meal.calories}, ${meal.protein_g}, ${meal.carbs_g}, ${meal.fats_g}, ${jsonItems}::jsonb)
      `;
    }

    return this.getMeals(uid);
  }

  static async deleteMeal(mealId: string, userId?: string): Promise<MealItem[]> {
    const uid = userId || (await this.getSession())?.id;
    if (!uid) return [];

    await sql`DELETE FROM meals WHERE id = ${mealId} AND user_id = ${uid}`;
    return this.getMeals(uid);
  }

  // ── WEIGHT HISTORY (EVOLUÇÃO) ────────────────────────────────
  static async getWeightHistory(userId?: string): Promise<WeightRecord[]> {
    try {
      const uid = userId || (await this.getSession())?.id;
      if (!uid) return [];

      const rows = await sql`
        SELECT id, user_id, date::text as date, weight_kg, notes
        FROM weight_history
        WHERE user_id = ${uid}
        ORDER BY date DESC
      `;
      return rows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        date: r.date,
        weight_kg: parseFloat(r.weight_kg) || 0,
        notes: r.notes ?? '',
      }));
    } catch {
      return [];
    }
  }

  static async addWeightRecord(date: string, weightKg: number, notes?: string, userId?: string): Promise<WeightRecord[]> {
    const uid = userId || (await this.getSession())?.id;
    if (!uid) throw new Error('Usuário não autenticado.');

    await sql`
      INSERT INTO weight_history (user_id, date, weight_kg, notes)
      VALUES (${uid}, ${date}, ${weightKg}, ${notes ?? ''})
      ON CONFLICT DO NOTHING
    `;

    await sql`
      UPDATE users SET current_weight = ${weightKg} WHERE id = ${uid}
    `;

    return this.getWeightHistory(uid);
  }

  static async deleteWeightRecord(recordId: string, userId?: string): Promise<WeightRecord[]> {
    const uid = userId || (await this.getSession())?.id;
    if (!uid) return [];

    await sql`DELETE FROM weight_history WHERE id = ${recordId} AND user_id = ${uid}`;
    return this.getWeightHistory(uid);
  }
}
