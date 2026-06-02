export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          street: string
          number: string
          neighborhood: string
          city: string
          state: string
          zip_code: string
          complement: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          street?: string
          number?: string
          neighborhood?: string
          city?: string
          state?: string
          zip_code?: string
          complement?: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          street?: string
          number?: string
          neighborhood?: string
          city?: string
          state?: string
          zip_code?: string
          complement?: string
          is_default?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string
          product_id: string
          product_image: string | null
          product_name: string | null
          seller_id: string | null
          seller_ref: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          product_id: string
          product_image?: string | null
          product_name?: string | null
          seller_id?: string | null
          seller_ref?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          product_id?: string
          product_image?: string | null
          product_name?: string | null
          seller_id?: string | null
          seller_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          store_id: string
          store_name: string
          store_image: string | null
          store_category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id: string
          store_name: string
          store_image?: string | null
          store_category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string
          store_name?: string
          store_image?: string | null
          store_category?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          store_id: string | null
          store_name: string
          items: Json
          total: number
          address: string | null
          payment: string
          fulfillment: string
          status: string
          estimated_min: number | null
          estimated_max: number | null
          created_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          store_id?: string | null
          store_name: string
          items?: Json
          total: number
          address?: string | null
          payment: string
          fulfillment: string
          status?: string
          estimated_min?: number | null
          estimated_max?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          store_id?: string | null
          store_name?: string
          items?: Json
          total?: number
          address?: string | null
          payment?: string
          fulfillment?: string
          status?: string
          estimated_min?: number | null
          estimated_max?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          seller_id: string
          name: string
          description: string | null
          price: number
          category: string | null
          image: string | null
          seller_kind: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          name: string
          description?: string | null
          price: number
          category?: string | null
          image?: string | null
          seller_kind?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          name?: string
          description?: string | null
          price?: number
          category?: string | null
          image?: string | null
          seller_kind?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cnpj: string | null
          created_at: string
          display_name: string | null
          extras: Json | null
          id: string
          phone: string | null
          role: string | null
          roles: string[]
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          cnpj?: string | null
          created_at?: string
          display_name?: string | null
          extras?: Json | null
          id: string
          phone?: string | null
          role?: string | null
          roles?: string[]
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          cnpj?: string | null
          created_at?: string
          display_name?: string | null
          extras?: Json | null
          id?: string
          phone?: string | null
          role?: string | null
          roles?: string[]
          verified?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          store_id: string
          buyer_id: string
          buyer_name: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          buyer_id: string
          buyer_name: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          buyer_id?: string
          buyer_name?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      /*
       * SQL para criar as tabelas abaixo no Supabase:
       *
       * CREATE TABLE support_tickets (
       *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       *   user_id UUID REFERENCES profiles(id),
       *   user_email TEXT,
       *   user_name TEXT,
       *   subject TEXT NOT NULL,
       *   category TEXT NOT NULL,
       *   status TEXT DEFAULT 'aberto',
       *   created_at TIMESTAMPTZ DEFAULT now(),
       *   updated_at TIMESTAMPTZ DEFAULT now()
       * );
       *
       * CREATE TABLE ticket_messages (
       *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       *   ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
       *   sender_id UUID REFERENCES profiles(id),
       *   sender_name TEXT,
       *   message TEXT NOT NULL,
       *   is_admin BOOLEAN DEFAULT false,
       *   created_at TIMESTAMPTZ DEFAULT now()
       * );
       *
       * -- Login do administrador (criar no Supabase Auth + definir role):
       * -- Email: adm@gmail.com  |  Senha: 2020
       * -- UPDATE profiles SET role = 'admin' WHERE id = '<uuid do usuário criado>';
       */
      support_tickets: {
        Row: {
          id:          string
          user_id:     string | null
          user_email:  string | null
          user_name:   string | null
          subject:     string
          category:    string
          status:      string
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:         string
          user_id?:    string | null
          user_email?: string | null
          user_name?:  string | null
          subject:     string
          category:    string
          status?:     string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?:     string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          id:           string
          ticket_id:    string
          sender_id:    string | null
          sender_name:  string | null
          message:      string
          is_admin:     boolean
          created_at:   string
        }
        Insert: {
          id?:          string
          ticket_id:    string
          sender_id?:   string | null
          sender_name?: string | null
          message:      string
          is_admin?:    boolean
          created_at?:  string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
