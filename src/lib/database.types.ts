export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          stripe_product_id: string | null
          image_url: string | null
          active: boolean
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          stripe_product_id?: string | null
          image_url?: string | null
          active?: boolean
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          stripe_product_id?: string | null
          image_url?: string | null
          active?: boolean
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          features: Json | null
          stripe_product_id: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          features?: Json | null
          stripe_product_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          features?: Json | null
          stripe_product_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscription_prices: {
        Row: {
          id: string
          subscription_plan_id: string
          stripe_price_id: string
          interval: string
          interval_count: number
          price: number
          currency: string
          recurring: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subscription_plan_id: string
          stripe_price_id: string
          interval: string
          interval_count?: number
          price: number
          currency?: string
          recurring?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subscription_plan_id?: string
          stripe_price_id?: string
          interval?: string
          interval_count?: number
          price?: number
          currency?: string
          recurring?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription_plan_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          status: string
          cancel_at_period_end: boolean
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_plan_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status: string
          cancel_at_period_end?: boolean
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_plan_id?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: string
          cancel_at_period_end?: boolean
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: string
          total: number
          stripe_session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status: string
          total: number
          stripe_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          total?: number
          stripe_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          price_id: string | null
          stripe_price_id: string | null
          quantity: number
          price: number
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          price_id?: string | null
          stripe_price_id?: string | null
          quantity: number
          price: number
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          price_id?: string | null
          stripe_price_id?: string | null
          quantity?: number
          price?: number
          currency?: string
          created_at?: string
        }
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          workout_type: string
          duration: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          workout_type: string
          duration?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          workout_type?: string
          duration?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shred_waitlist: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          fitness_goals: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone?: string | null
          fitness_goals?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          fitness_goals?: string | null
          created_at?: string
        }
      }
      shred_orders: {
        Row: {
          id: string
          user_id: string | null
          email: string
          full_name: string
          status: string
          total: number
          stripe_session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          full_name: string
          status: string
          total: number
          stripe_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          full_name?: string
          status?: string
          total?: number
          stripe_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prices: {
        Row: {
          id: string
          product_id: string
          stripe_price_id: string
          price: number
          currency: string
          active: boolean
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          stripe_price_id: string
          price: number
          currency?: string
          active?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          stripe_price_id?: string
          price?: number
          currency?: string
          active?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      shred_waitlist_view: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          fitness_goals: string | null
          created_at: string
          has_ordered: boolean
        }
        Insert: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          fitness_goals?: string | null
          created_at?: string
          has_ordered?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          fitness_goals?: string | null
          created_at?: string
          has_ordered?: boolean
        }
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
  }
}
