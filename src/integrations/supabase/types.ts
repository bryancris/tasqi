export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: number
          updated_at: string
          vapid_private_key: string | null
          vapid_public_key: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          updated_at?: string
          vapid_private_key?: string | null
          vapid_public_key?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          updated_at?: string
          vapid_private_key?: string | null
          vapid_public_key?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: number
          is_ai: boolean
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: number
          is_ai?: boolean
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: number
          is_ai?: boolean
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      daily_rituals: {
        Row: {
          created_at: string
          description: string | null
          frequency: string[] | null
          id: number
          is_completed: boolean | null
          time_of_day: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency?: string[] | null
          id?: number
          is_completed?: boolean | null
          time_of_day?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: string[] | null
          id?: number
          is_completed?: boolean | null
          time_of_day?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emotional_care_activities: {
        Row: {
          coping_strategy: string | null
          created_at: string
          date_logged: string
          emotion: string
          id: number
          intensity: number | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coping_strategy?: string | null
          created_at?: string
          date_logged?: string
          emotion: string
          id?: number
          intensity?: number | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coping_strategy?: string | null
          created_at?: string
          date_logged?: string
          emotion?: string
          id?: number
          intensity?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mental_wellness_activities: {
        Row: {
          activity_name: string
          activity_type: string
          created_at: string
          id: number
          measurement_unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_name: string
          activity_type: string
          created_at?: string
          id?: never
          measurement_unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_name?: string
          activity_type?: string
          created_at?: string
          id?: never
          measurement_unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mental_wellness_logs: {
        Row: {
          activity_id: number | null
          created_at: string
          id: number
          logged_at: string
          notes: string | null
          user_id: string
          value: number
        }
        Insert: {
          activity_id?: number | null
          created_at?: string
          id?: never
          logged_at?: string
          notes?: string | null
          user_id: string
          value: number
        }
        Update: {
          activity_id?: number | null
          created_at?: string
          id?: never
          logged_at?: string
          notes?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "mental_wellness_logs_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "mental_wellness_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          color: string | null
          content: string
          created_at: string
          id: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content: string
          created_at?: string
          id?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string
          id?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          message: string
          read: boolean | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_messages: {
        Row: {
          content: string
          created_at: string
          id: number
          message_type: Database["public"]["Enums"]["message_type"] | null
          metadata: Json | null
          organization_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          organization_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          organization_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      physical_wellness_activities: {
        Row: {
          activity_name: string
          activity_type: string
          created_at: string
          id: number
          measurement_unit: Database["public"]["Enums"]["measurement_unit"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_name: string
          activity_type: string
          created_at?: string
          id?: never
          measurement_unit: Database["public"]["Enums"]["measurement_unit"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_name?: string
          activity_type?: string
          created_at?: string
          id?: never
          measurement_unit?: Database["public"]["Enums"]["measurement_unit"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      physical_wellness_logs: {
        Row: {
          activity_id: number
          created_at: string
          id: number
          logged_at: string
          notes: string | null
          user_id: string
          value: number
        }
        Insert: {
          activity_id: number
          created_at?: string
          id?: never
          logged_at?: string
          notes?: string | null
          user_id: string
          value: number
        }
        Update: {
          activity_id?: number
          created_at?: string
          id?: never
          logged_at?: string
          notes?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "physical_wellness_logs_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "physical_wellness_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_keys: Json
          created_at: string
          endpoint: string
          id: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth_keys: Json
          created_at?: string
          endpoint: string
          id?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth_keys?: Json
          created_at?: string
          endpoint?: string
          id?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shared_tasks: {
        Row: {
          created_at: string
          id: number
          notification_sent: boolean | null
          shared_by_user_id: string | null
          shared_with_user_id: string | null
          status: string
          task_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          notification_sent?: boolean | null
          shared_by_user_id?: string | null
          shared_with_user_id?: string | null
          status?: string
          task_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          notification_sent?: boolean | null
          shared_by_user_id?: string | null
          shared_with_user_id?: string | null
          status?: string
          task_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      social_activities: {
        Row: {
          activity_name: string
          created_at: string
          description: string | null
          id: number
          participants: string[] | null
          scheduled_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_name: string
          created_at?: string
          description?: string | null
          id?: number
          participants?: string[] | null
          scheduled_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_name?: string
          created_at?: string
          description?: string | null
          id?: number
          participants?: string[] | null
          scheduled_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          connected_user_id: string
          created_at: string
          id: number
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_user_id: string
          created_at?: string
          id?: number
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_user_id?: string
          created_at?: string
          id?: number
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_group_members: {
        Row: {
          created_at: string
          group_id: number | null
          id: number
          role: Database["public"]["Enums"]["group_member_role"]
          trusted_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id?: number | null
          id?: number
          role?: Database["public"]["Enums"]["group_member_role"]
          trusted_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: number | null
          id?: number
          role?: Database["public"]["Enums"]["group_member_role"]
          trusted_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      task_groups: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          date: string | null
          description: string | null
          end_time: string | null
          id: number
          is_tracking: boolean | null
          owner_id: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"] | null
          reminder_enabled: boolean | null
          reschedule_count: number | null
          shared: boolean | null
          start_time: string | null
          status: Database["public"]["Enums"]["task_status"]
          time_spent: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: never
          is_tracking?: boolean | null
          owner_id: string
          position: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          reminder_enabled?: boolean | null
          reschedule_count?: number | null
          shared?: boolean | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          time_spent?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: never
          is_tracking?: boolean | null
          owner_id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          reminder_enabled?: boolean | null
          reschedule_count?: number | null
          shared?: boolean | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          time_spent?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trusted_task_users: {
        Row: {
          alias: string | null
          created_at: string
          id: number
          trusted_user_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alias?: string | null
          created_at?: string
          id?: number
          trusted_user_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alias?: string | null
          created_at?: string
          id?: number
          trusted_user_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          end_hour: number
          start_hour: number
          text_to_speech_enabled: boolean | null
          time_format: Database["public"]["Enums"]["time_format"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_hour?: number
          start_hour?: number
          text_to_speech_enabled?: boolean | null
          time_format?: Database["public"]["Enums"]["time_format"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_hour?: number
          start_hour?: number
          text_to_speech_enabled?: boolean | null
          time_format?: Database["public"]["Enums"]["time_format"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_chat_messages: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          user_id: string
        }
        Returns: {
          id: number
          content: string
          is_ai: boolean
          similarity: number
        }[]
      }
      reorder_tasks: {
        Args: {
          task_positions: Database["public"]["CompositeTypes"]["task_position"][]
        }
        Returns: undefined
      }
      reschedule_overdue_tasks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      connection_status: "pending" | "accepted" | "rejected"
      group_member_role: "admin" | "member"
      measurement_unit:
        | "count"
        | "minutes"
        | "hours"
        | "meters"
        | "kilometers"
        | "pounds"
        | "kilograms"
        | "milliliters"
        | "liters"
      message_type: "text" | "file"
      org_role: "admin" | "member"
      task_priority: "low" | "medium" | "high"
      task_status:
        | "scheduled"
        | "unscheduled"
        | "completed"
        | "in_progress"
        | "stuck"
      time_format: "12h" | "24h"
    }
    CompositeTypes: {
      task_position: {
        task_id: number | null
        new_position: number | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
