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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      category_collections: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      category_products: {
        Row: {
          category_id: string
          created_at: string | null
          display_order: number | null
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "krolist_products"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          currency: string
          rate_to_usd: number
          updated_at: string | null
        }
        Insert: {
          currency: string
          rate_to_usd: number
          updated_at?: string | null
        }
        Update: {
          currency?: string
          rate_to_usd?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      krolist_products: {
        Row: {
          availability_status: string | null
          category: string | null
          collection_title: string | null
          created_at: string | null
          currency: string
          current_price: number
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          last_checked_at: string | null
          original_currency: string
          original_price: number
          product_url: string
          store: string
          title: string
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          availability_status?: string | null
          category?: string | null
          collection_title?: string | null
          created_at?: string | null
          currency?: string
          current_price: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          last_checked_at?: string | null
          original_currency?: string
          original_price: number
          product_url: string
          store: string
          title: string
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          availability_status?: string | null
          category?: string | null
          collection_title?: string | null
          created_at?: string | null
          currency?: string
          current_price?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          last_checked_at?: string | null
          original_currency?: string
          original_price?: number
          product_url?: string
          store?: string
          title?: string
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      login_messages: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string
          display_times: number
          id: string
          is_active: boolean | null
          title_ar: string | null
          title_en: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en: string
          display_times?: number
          id?: string
          is_active?: boolean | null
          title_ar?: string | null
          title_en: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string
          display_times?: number
          id?: string
          is_active?: boolean | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      news_updates: {
        Row: {
          author_id: string | null
          category: string
          content_ar: string | null
          content_en: string
          created_at: string | null
          id: string
          is_published: boolean | null
          published_at: string
          title_ar: string | null
          title_en: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content_ar?: string | null
          content_en: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string
          title_ar?: string | null
          title_en: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content_ar?: string | null
          content_en?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string
          title_ar?: string | null
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          products: Json
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          products: Json
          status?: string
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          products?: Json
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      page_content: {
        Row: {
          category: string | null
          content_ar: string | null
          content_en: string
          content_type: string | null
          description: string | null
          id: string
          page_key: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          content_ar?: string | null
          content_en: string
          content_type?: string | null
          description?: string | null
          id?: string
          page_key: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          content_ar?: string | null
          content_en?: string
          content_type?: string | null
          description?: string | null
          id?: string
          page_key?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          currency: string
          id: string
          original_price: number | null
          price: number
          product_id: string
          scraped_at: string | null
        }
        Insert: {
          currency: string
          id?: string
          original_price?: number | null
          price: number
          product_id: string
          scraped_at?: string | null
        }
        Update: {
          currency?: string
          id?: string
          original_price?: number | null
          price?: number
          product_id?: string
          scraped_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          currency: string | null
          current_price: number
          description: string | null
          external_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          last_checked_at: string | null
          original_currency: string
          original_price: number
          product_url: string
          store: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          current_price: number
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_checked_at?: string | null
          original_currency?: string
          original_price: number
          product_url: string
          store: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          current_price?: number
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_checked_at?: string | null
          original_currency?: string
          original_price?: number
          product_url?: string
          store?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string
          expires: string
          id: string
          is_krolist: boolean | null
          reusable: boolean
          store: string
          store_url: string
          updated_at: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          expires: string
          id?: string
          is_krolist?: boolean | null
          reusable?: boolean
          store: string
          store_url: string
          updated_at?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          expires?: string
          id?: string
          is_krolist?: boolean | null
          reusable?: boolean
          store?: string
          store_url?: string
          updated_at?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          search_query: string
          searched_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          search_query: string
          searched_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          search_query?: string
          searched_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_promotions: {
        Row: {
          active: boolean | null
          badge_color: string
          badge_text: string
          created_at: string | null
          expires_at: string | null
          id: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          badge_color?: string
          badge_text: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          badge_color?: string
          badge_text?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_message_views: {
        Row: {
          created_at: string | null
          id: string
          last_viewed_at: string | null
          message_id: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_viewed_at?: string | null
          message_id: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_viewed_at?: string | null
          message_id?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_message_views_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "login_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_refresh_logs: {
        Row: {
          created_at: string
          id: string
          last_refresh_date: string
          refresh_count: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_refresh_date?: string
          refresh_count?: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          last_refresh_date?: string
          refresh_count?: number
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_product_stats: { Args: { user_uuid: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
