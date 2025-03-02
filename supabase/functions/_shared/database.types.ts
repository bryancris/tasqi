
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
      notifications: {
        Row: {
          id: number
          user_id: string
          title: string
          message: string
          body?: string
          type?: string
          read: boolean
          created_at: string
          updated_at?: string
          reference_id?: string
          reference_type?: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          message: string
          body?: string
          type?: string
          read?: boolean
          created_at?: string
          updated_at?: string
          reference_id?: string
          reference_type?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          message?: string
          body?: string
          type?: string
          read?: boolean
          created_at?: string
          updated_at?: string
          reference_id?: string
          reference_type?: string
        }
      }
      notification_events: {
        Row: {
          id: number
          event_type: string
          user_id: string
          task_id?: number
          metadata?: Json
          created_at: string
          updated_at?: string
          processed_at?: string
          status: string
          delivery_status?: string
          delivery_platform?: string
          delivery_attempts?: number
          last_error?: string
          error_count?: number
        }
        Insert: {
          id?: number
          event_type: string
          user_id: string
          task_id?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          processed_at?: string
          status?: string
          delivery_status?: string
          delivery_platform?: string
          delivery_attempts?: number
          last_error?: string
          error_count?: number
        }
        Update: {
          id?: number
          event_type?: string
          user_id?: string
          task_id?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          processed_at?: string
          status?: string
          delivery_status?: string
          delivery_platform?: string
          delivery_attempts?: number
          last_error?: string
          error_count?: number
        }
      }
      push_subscriptions: {
        Row: {
          id: number
          user_id: string
          endpoint: string
          auth_keys: Json
          active: boolean
          created_at: string
          updated_at?: string
          platform: string
          device_info?: Json
          metadata?: Json
          device_type?: string
        }
        Insert: {
          id?: number
          user_id: string
          endpoint: string
          auth_keys: Json
          active?: boolean
          created_at?: string
          updated_at?: string
          platform?: string
          device_info?: Json
          metadata?: Json
          device_type?: string
        }
        Update: {
          id?: number
          user_id?: string
          endpoint?: string
          auth_keys?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
          platform?: string
          device_info?: Json
          metadata?: Json
          device_type?: string
        }
      }
      push_device_tokens: {
        Row: {
          id: number
          user_id: string
          token: string
          platform: string
          created_at: string
          updated_at?: string
          device_info?: Json
          active: boolean
        }
        Insert: {
          id?: number
          user_id: string
          token: string
          platform: string
          created_at?: string
          updated_at?: string
          device_info?: Json
          active?: boolean
        }
        Update: {
          id?: number
          user_id?: string
          token?: string
          platform?: string
          created_at?: string
          updated_at?: string
          device_info?: Json
          active?: boolean
        }
      }
      timer_sessions: {
        Row: {
          id: number
          user_id: string
          duration: number
          starts_at: string
          expires_at: string
          label?: string
          is_active: boolean
          is_completed: boolean
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: number
          user_id: string
          duration: number
          starts_at: string
          expires_at: string
          label?: string
          is_active?: boolean
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          duration?: number
          starts_at?: string
          expires_at?: string
          label?: string
          is_active?: boolean
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      notification_event_type: "task_reminder" | "timer_complete" | "task_status_changed" | "task_shared" | "task_assignment"
    }
  }
}
