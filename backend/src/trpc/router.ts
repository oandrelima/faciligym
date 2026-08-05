import { router, publicProcedure } from './trpc';
import { z } from 'zod';

export const appRouter = router({
  // ── Health procedure ───────────────────────────────────────
  health: publicProcedure.query(() => {
    return {
      status: 'online',
      architecture: 'T3 Stack (tRPC + React Query + Zod + NeonDB + WebSocket)',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }),

  // ── Auth & Profile procedures ─────────────────────────────
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const cleanEmail = input.email.trim().toLowerCase();
      const rows = await ctx.sql`
        SELECT id, name, email, weekly_goal, current_weight, target_weight, onboarding_completed,
               diet_calories, diet_protein_g, diet_carbs_g, diet_fats_g, diet_configured, created_at, password_hash
        FROM users WHERE LOWER(email) = ${cleanEmail}
      `;

      if (rows.length === 0 || rows[0].password_hash !== input.password) {
        throw new Error('Credenciais inválidas. Verifique o e-mail e a senha.');
      }

      const u = rows[0];
      return {
        id: u.id as string,
        name: u.name as string,
        email: u.email as string,
        weekly_goal: (u.weekly_goal ?? 4) as number,
        current_weight: parseFloat(u.current_weight) || 80.0,
        target_weight: parseFloat(u.target_weight) || 75.0,
        onboarding_completed: Boolean(u.onboarding_completed),
        diet_calories: (u.diet_calories ?? 2000) as number,
        diet_protein_g: parseFloat(u.diet_protein_g) || 150.0,
        diet_carbs_g: parseFloat(u.diet_carbs_g) || 200.0,
        diet_fats_g: parseFloat(u.diet_fats_g) || 50.0,
        diet_configured: Boolean(u.diet_configured),
        created_at: u.created_at ? String(u.created_at) : undefined,
      };
    }),

  saveOnboarding: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        weeklyGoal: z.number().min(1).max(7),
        currentWeight: z.number().positive(),
        targetWeight: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const today = new Date().toISOString().split('T')[0];

      await ctx.sql`
        UPDATE users
        SET weekly_goal = ${input.weeklyGoal},
            current_weight = ${input.currentWeight},
            target_weight = ${input.targetWeight},
            onboarding_completed = TRUE
        WHERE id = ${input.userId}
      `;

      await ctx.sql`
        INSERT INTO weight_history (user_id, date, weight_kg, notes)
        VALUES (${input.userId}, ${today}, ${input.currentWeight}, 'Peso inicial registrado no onboarding')
        ON CONFLICT DO NOTHING
      `;

      return { success: true };
    }),

  // ── Attendance procedures ──────────────────────────────────
  getAttendance: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const rows = await ctx.sql`
        SELECT id, user_id, date::text as date, workout_type, notes
        FROM attendance
        WHERE user_id = ${input.userId}
        ORDER BY date DESC
      `;
      return rows.map((r) => ({
        id: r.id as string,
        user_id: r.user_id as string,
        date: r.date as string,
        workout_type: r.workout_type as string,
        notes: (r.notes ?? '') as string,
      }));
    }),

  addAttendance: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        date: z.string(),
        workoutType: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const todayStr = new Date().toISOString().split('T')[0];

      if (input.date > todayStr) {
        throw new Error('Não é possível realizar check-in em uma data futura.');
      }

      const existing = await ctx.sql`
        SELECT id FROM attendance WHERE user_id = ${input.userId} AND date = ${input.date}
      `;

      if (existing.length > 0) {
        throw new Error('Você já realizou um check-in nesta data!');
      }

      await ctx.sql`
        INSERT INTO attendance (user_id, date, workout_type, notes)
        VALUES (${input.userId}, ${input.date}, ${input.workoutType}, ${input.notes ?? ''})
      `;

      return { success: true };
    }),

  // ── Workout procedures ─────────────────────────────────────
  getRoutines: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const rows = await ctx.sql`
        SELECT id, user_id, title, category, description, exercises_json
        FROM routines
        WHERE user_id = ${input.userId}
        ORDER BY created_at ASC
      `;
      return rows.map((r) => ({
        id: r.id as string,
        user_id: r.user_id as string,
        title: r.title as string,
        category: r.category as string,
        description: (r.description ?? '') as string,
        exercises: Array.isArray(r.exercises_json) ? r.exercises_json : [],
      }));
    }),

  saveRoutine: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        id: z.string().optional(),
        title: z.string().min(1),
        category: z.string(),
        description: z.string().optional(),
        exercises: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            sets: z.number(),
            reps: z.string(),
            weight_kg: z.number(),
            rest_seconds: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const jsonEx = JSON.stringify(input.exercises || []);

      if (input.id && input.id.length > 20) {
        await ctx.sql`
          UPDATE routines
          SET title = ${input.title},
              category = ${input.category},
              description = ${input.description ?? ''},
              exercises_json = ${jsonEx}::jsonb
          WHERE id = ${input.id} AND user_id = ${input.userId}
        `;
      } else {
        await ctx.sql`
          INSERT INTO routines (user_id, title, category, description, exercises_json)
          VALUES (${input.userId}, ${input.title}, ${input.category}, ${input.description ?? ''}, ${jsonEx}::jsonb)
        `;
      }

      return { success: true };
    }),

  deleteRoutine: publicProcedure
    .input(z.object({ userId: z.string(), routineId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.sql`DELETE FROM routines WHERE id = ${input.routineId} AND user_id = ${input.userId}`;
      return { success: true };
    }),

  // ── Diet procedures ────────────────────────────────────────
  getMeals: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const rows = await ctx.sql`
        SELECT id, user_id, name, meal_time, calories, protein_g, carbs_g, fats_g, items_json
        FROM meals
        WHERE user_id = ${input.userId}
        ORDER BY meal_time ASC
      `;
      return rows.map((m) => ({
        id: m.id as string,
        user_id: m.user_id as string,
        name: m.name as string,
        meal_time: m.meal_time as string,
        calories: m.calories as number,
        protein_g: parseFloat(m.protein_g) || 0,
        carbs_g: parseFloat(m.carbs_g) || 0,
        fats_g: parseFloat(m.fats_g) || 0,
        items: Array.isArray(m.items_json) ? m.items_json : [],
      }));
    }),

  saveMeal: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        id: z.string().optional(),
        name: z.string().min(1),
        meal_time: z.string(),
        calories: z.number(),
        protein_g: z.number(),
        carbs_g: z.number(),
        fats_g: z.number(),
        items: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const jsonItems = JSON.stringify(input.items || []);

      if (input.id && input.id.length > 20) {
        await ctx.sql`
          UPDATE meals
          SET name = ${input.name},
              meal_time = ${input.meal_time},
              calories = ${input.calories},
              protein_g = ${input.protein_g},
              carbs_g = ${input.carbs_g},
              fats_g = ${input.fats_g},
              items_json = ${jsonItems}::jsonb
          WHERE id = ${input.id} AND user_id = ${input.userId}
        `;
      } else {
        await ctx.sql`
          INSERT INTO meals (user_id, name, meal_time, calories, protein_g, carbs_g, fats_g, items_json)
          VALUES (${input.userId}, ${input.name}, ${input.meal_time}, ${input.calories}, ${input.protein_g}, ${input.carbs_g}, ${input.fats_g}, ${jsonItems}::jsonb)
        `;
      }

      return { success: true };
    }),

  deleteMeal: publicProcedure
    .input(z.object({ userId: z.string(), mealId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.sql`DELETE FROM meals WHERE id = ${input.mealId} AND user_id = ${input.userId}`;
      return { success: true };
    }),

  saveDietGoals: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fats: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.sql`
        UPDATE users
        SET diet_calories = ${input.calories},
            diet_protein_g = ${input.protein},
            diet_carbs_g = ${input.carbs},
            diet_fats_g = ${input.fats},
            diet_configured = TRUE
        WHERE id = ${input.userId}
      `;
      return { success: true };
    }),

  // ── Weight History procedures ──────────────────────────────
  getWeightHistory: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const rows = await ctx.sql`
        SELECT id, user_id, date::text as date, weight_kg, notes
        FROM weight_history
        WHERE user_id = ${input.userId}
        ORDER BY date DESC
      `;
      return rows.map((r) => ({
        id: r.id as string,
        user_id: r.user_id as string,
        date: r.date as string,
        weight_kg: parseFloat(r.weight_kg) || 0,
        notes: (r.notes ?? '') as string,
      }));
    }),

  addWeightRecord: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        date: z.string(),
        weightKg: z.number().positive(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.sql`
        INSERT INTO weight_history (user_id, date, weight_kg, notes)
        VALUES (${input.userId}, ${input.date}, ${input.weightKg}, ${input.notes ?? ''})
        ON CONFLICT DO NOTHING
      `;

      await ctx.sql`
        UPDATE users SET current_weight = ${input.weightKg} WHERE id = ${input.userId}
      `;

      return { success: true };
    }),

  deleteWeightRecord: publicProcedure
    .input(z.object({ userId: z.string(), recordId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.sql`DELETE FROM weight_history WHERE id = ${input.recordId} AND user_id = ${input.userId}`;
      return { success: true };
    }),

  // ── Community procedures ────────────────────────────────────
  createCommunity: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Nome muito curto'),
        code: z.string().min(2, 'Senha muito curta'),
        userId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const cleanName = input.name.trim();
      const cleanCode = input.code.trim();
      const id = `comm-${cleanName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

      await ctx.sql`
        INSERT INTO communities (id, name, code, created_by)
        VALUES (${id}, ${cleanName}, ${cleanCode}, ${input.userId})
      `;

      return {
        id,
        name: cleanName,
        code: cleanCode,
        createdBy: input.userId,
      };
    }),

  joinCommunity: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Informe o nome da comunidade'),
        code: z.string().min(1, 'Informe a senha'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const cleanName = input.name.trim().toLowerCase();
      const cleanCode = input.code.trim();

      const rows = await ctx.sql`
        SELECT id, name, code, created_by
        FROM communities
        WHERE LOWER(name) = ${cleanName}
      `;

      if (rows.length === 0) {
        throw new Error('Comunidade não encontrada. Verifique o nome digitado.');
      }

      const comm = rows[0];
      if (comm.code !== cleanCode) {
        throw new Error('Senha incorreta para esta comunidade.');
      }

      return {
        id: comm.id as string,
        name: comm.name as string,
        code: comm.code as string,
        createdBy: comm.created_by as string,
      };
    }),

  getCommunityMessages: publicProcedure
    .input(z.object({ communityId: z.string() }))
    .query(async ({ input, ctx }) => {
      const rows = await ctx.sql`
        SELECT id, community_id, sender_id, sender_name, text, created_at::text as created_at
        FROM community_messages
        WHERE community_id = ${input.communityId}
        ORDER BY created_at ASC
        LIMIT 100
      `;

      return rows.map((r) => ({
        id: r.id as string,
        communityId: r.community_id as string,
        senderId: r.sender_id as string,
        senderName: r.sender_name as string,
        text: r.text as string,
        createdAt: r.created_at as string,
      }));
    }),

  addCommunityMessage: publicProcedure
    .input(
      z.object({
        communityId: z.string(),
        senderId: z.string(),
        senderName: z.string(),
        text: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await ctx.sql`
        INSERT INTO community_messages (id, community_id, sender_id, sender_name, text)
        VALUES (${id}, ${input.communityId}, ${input.senderId}, ${input.senderName}, ${input.text})
      `;

      return {
        id,
        communityId: input.communityId,
        senderId: input.senderId,
        senderName: input.senderName,
        text: input.text,
        createdAt: new Date().toISOString(),
      };
    }),
});

export type AppRouter = typeof appRouter;
