import { z } from 'zod';

export const profileSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(100).optional(),
});

export const workoutLogSchema = z.object({
  workout_date: z.date(),
  program_id: z.string(),
  notes: z.string().optional(),
});

export const subscriptionSchema = z.object({
  plan_id: z.string(),
  status: z.enum(['active', 'canceled', 'past_due']),
  current_period_end: z.date().optional(),
});